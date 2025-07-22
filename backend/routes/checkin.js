const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();

// Import models
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const ServiceSchedule = require('../models/ServiceSchedule');
const CheckInSession = require('../models/CheckInSession');

// Import middleware
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Import validation
const { qrCodeValidation } = require('../utils/validators');

// Import utilities
const { parseQRCode, verifyQRCode } = require('../utils/qrGenerator');

// @desc    Health check for check-in routes
// @route   GET /api/checkin/health
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Check-in routes are working',
    timestamp: new Date().toISOString()
  });
});

// @desc    Get available services for current time
// @route   GET /api/checkin/available-services/:timeSlot
// @access  Public
router.get('/available-services/:timeSlot', async (req, res) => {
  try {
    const { timeSlot } = req.params;
    
    if (!['morning', 'afternoon'].includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid time slot. Must be "morning" or "afternoon"'
      });
    }

    const today = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
    
    // Check if it's weekend
    if (dayOfWeek === 'saturday' || dayOfWeek === 'sunday') {
      return res.status(200).json({
        success: true,
        message: 'No services available on weekends',
        services: [],
        dayOfWeek,
        timeSlot
      });
    }

    // Get available services for the day and time slot
    const serviceSchedule = await ServiceSchedule.findOne({
      dayOfWeek,
      timeSlot,
      isActive: true
    });

    if (!serviceSchedule) {
      return res.status(200).json({
        success: true,
        message: 'No services available for this time slot',
        services: [],
        dayOfWeek,
        timeSlot
      });
    }

    res.status(200).json({
      success: true,
      message: 'Available services retrieved successfully',
      services: serviceSchedule.availableServices,
      dayOfWeek,
      timeSlot,
      schedule: {
        morning: '8:00 AM - 12:00 PM',
        afternoon: '1:00 PM - 5:00 PM'
      }
    });

  } catch (error) {
    console.error('Get available services error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving available services'
    });
  }
});

// @desc    Scan QR code for check-in
// @route   POST /api/checkin/qr-scan
// @access  Private (Admin/Staff)
router.post('/qr-scan', [auth, roleCheck(['admin'])], async (req, res) => {
  try {
    const { qrCodeData } = req.body;

    if (!qrCodeData) {
      return res.status(400).json({
        success: false,
        message: 'QR code data is required'
      });
    }

    // Parse QR code
    const qrData = parseQRCode(qrCodeData);
    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    // Verify QR code
    if (!verifyQRCode(qrData)) {
      return res.status(400).json({
        success: false,
        message: 'QR code is invalid or expired'
      });
    }

    // Check QR code type
    if (qrData.type !== 'patient_checkin') {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code type for check-in'
      });
    }

    // Find patient
    const patient = await Patient.findOne({ 
      patientId: qrData.patientId 
    }).populate('userId', 'profile email');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if patient is active
    if (!patient.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Patient account is inactive'
      });
    }

    // Check if patient already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingCheckIn = await CheckInSession.findOne({
      patientId: patient._id,
      checkInDate: {
        $gte: today,
        $lt: tomorrow
      },
      sessionStatus: { $in: ['active', 'completed'] }
    });

    if (existingCheckIn) {
      return res.status(409).json({
        success: false,
        message: 'Patient has already checked in today',
        existingSession: {
          checkInTime: existingCheckIn.createdAt,
          selectedService: existingCheckIn.selectedService,
          status: existingCheckIn.sessionStatus
        }
      });
    }

    // Determine current time slot
    const currentHour = new Date().getHours();
    const timeSlot = currentHour < 13 ? 'morning' : 'afternoon';

    // Get available services
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
    
    const serviceSchedule = await ServiceSchedule.findOne({
      dayOfWeek,
      timeSlot,
      isActive: true
    });

    if (!serviceSchedule || serviceSchedule.availableServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No services available for ${timeSlot} on ${dayOfWeek}`
      });
    }

    res.status(200).json({
      success: true,
      message: 'QR code scanned successfully',
      patient: {
        id: patient._id,
        patientId: patient.patientId,
        name: `${patient.userId.profile.firstName} ${patient.userId.profile.lastName}`,
        email: patient.userId.email,
        contactNumber: patient.userId.profile.contactNumber
      },
      availableServices: serviceSchedule.availableServices,
      timeSlot,
      dayOfWeek
    });

  } catch (error) {
    console.error('QR scan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during QR code scanning'
    });
  }
});

// @desc    Select service type after QR scan
// @route   POST /api/checkin/select-service
// @access  Private (Admin/Staff)
router.post('/select-service', [auth, roleCheck(['admin'])], async (req, res) => {
  try {
    const { patientId, serviceType, timeSlot } = req.body;

    if (!patientId || !serviceType || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, service type, and time slot are required'
      });
    }

    // Validate patient
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Validate service availability
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
    
    const serviceSchedule = await ServiceSchedule.findOne({
      dayOfWeek,
      timeSlot,
      isActive: true,
      'availableServices.serviceType': serviceType
    });

    if (!serviceSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Selected service is not available for this time slot'
      });
    }

    // Get service details
    const selectedService = serviceSchedule.availableServices.find(
      service => service.serviceType === serviceType
    );

    res.status(200).json({
      success: true,
      message: 'Service selected successfully',
      selectedService,
      requiresVitalSigns: selectedService.requiresVitalSigns,
      nextStep: 'confirm_checkin'
    });

  } catch (error) {
    console.error('Service selection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during service selection'
    });
  }
});

// @desc    Confirm check-in with selected service
// @route   POST /api/checkin/confirm
// @access  Private (Admin/Staff)
router.post('/confirm', [auth, roleCheck(['admin'])], async (req, res) => {
  try {
    const { patientId, serviceType, timeSlot, reason, symptoms } = req.body;

    if (!patientId || !serviceType || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, service type, and time slot are required'
      });
    }

    // Validate patient
    const patient = await Patient.findById(patientId).populate('userId', 'profile');
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check service availability again
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
    
    const serviceSchedule = await ServiceSchedule.findOne({
      dayOfWeek,
      timeSlot,
      isActive: true,
      'availableServices.serviceType': serviceType
    });

    if (!serviceSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Selected service is no longer available'
      });
    }

    const selectedService = serviceSchedule.availableServices.find(
      service => service.serviceType === serviceType
    );

    // Create appointment
    const appointment = new Appointment({
      patientId: patient._id,
      checkInDate: new Date(),
      checkInTime: new Date().toLocaleTimeString('en-US', { 
        hour12: true,
        hour: '2-digit',
        minute: '2-digit'
      }),
      serviceType,
      timeSlot,
      status: 'checked-in',
      requiresVitalSigns: selectedService.requiresVitalSigns,
      reason: reason || '',
      symptoms: symptoms || []
    });

    await appointment.save();

    // Create check-in session
    const checkInSession = new CheckInSession({
      patientId: patient._id,
      qrCode: patient.qrCode,
      checkInDate: new Date(),
      sessionStatus: 'active',
      selectedService: serviceType,
      timeSlot,
      vitalSignsRequired: selectedService.requiresVitalSigns,
      appointmentId: appointment._id,
      createdBy: req.user.userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await checkInSession.save();

    res.status(201).json({
      success: true,
      message: 'Check-in completed successfully',
      appointment: {
        id: appointment._id,
        appointmentId: appointment.appointmentId,
        patientName: `${patient.userId.profile.firstName} ${patient.userId.profile.lastName}`,
        serviceType: appointment.serviceType,
        checkInTime: appointment.checkInTime,
        status: appointment.status,
        requiresVitalSigns: appointment.requiresVitalSigns
      },
      session: {
        id: checkInSession._id,
        status: checkInSession.sessionStatus,
        expiresAt: checkInSession.expiresAt
      },
      nextSteps: selectedService.requiresVitalSigns 
        ? ['Record vital signs', 'Notify doctor']
        : ['Notify doctor']
    });

  } catch (error) {
    console.error('Check-in confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during check-in confirmation'
    });
  }
});

// @desc    Get check-in session status
// @route   GET /api/checkin/status/:sessionId
// @access  Private (Admin/Staff)
router.get('/status/:sessionId', [auth, roleCheck(['admin'])], async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await CheckInSession.findById(sessionId)
      .populate({
        path: 'patientId',
        populate: {
          path: 'userId',
          select: 'profile'
        }
      })
      .populate('appointmentId');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Check-in session not found'
      });
    }

    res.status(200).json({
      success: true,
      session: {
        id: session._id,
        patientName: `${session.patientId.userId.profile.firstName} ${session.patientId.userId.profile.lastName}`,
        patientId: session.patientId.patientId,
        selectedService: session.selectedService,
        timeSlot: session.timeSlot,
        status: session.sessionStatus,
        vitalSignsRequired: session.vitalSignsRequired,
        vitalSignsCompleted: session.vitalSignsCompleted,
        doctorNotified: session.doctorNotified,
        checkInDate: session.checkInDate,
        expiresAt: session.expiresAt,
        appointment: session.appointmentId
      }
    });

  } catch (error) {
    console.error('Get session status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving session status'
    });
  }
});

// @desc    Get today's check-ins
// @route   GET /api/checkin/today
// @access  Private (Admin/Staff)
router.get('/today', [auth, roleCheck(['admin'])], async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckIns = await CheckInSession.find({
      checkInDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'profile'
      }
    })
    .populate('appointmentId')
    .sort({ createdAt: -1 });

    const checkInSummary = {
      total: todayCheckIns.length,
      active: todayCheckIns.filter(session => session.sessionStatus === 'active').length,
      completed: todayCheckIns.filter(session => session.sessionStatus === 'completed').length,
      vitalSignsPending: todayCheckIns.filter(session => 
        session.vitalSignsRequired && !session.vitalSignsCompleted
      ).length,
      readyForDoctor: todayCheckIns.filter(session => 
        !session.vitalSignsRequired || session.vitalSignsCompleted
      ).length
    };

    res.status(200).json({
      success: true,
      message: 'Today\'s check-ins retrieved successfully',
      summary: checkInSummary,
      checkIns: todayCheckIns.map(session => ({
        id: session._id,
        patientName: `${session.patientId.userId.profile.firstName} ${session.patientId.userId.profile.lastName}`,
        patientId: session.patientId.patientId,
        selectedService: session.selectedService,
        timeSlot: session.timeSlot,
        status: session.sessionStatus,
        vitalSignsRequired: session.vitalSignsRequired,
        vitalSignsCompleted: session.vitalSignsCompleted,
        doctorNotified: session.doctorNotified,
        checkInTime: session.createdAt,
        appointmentId: session.appointmentId?._id
      }))
    });

  } catch (error) {
    console.error('Get today\'s check-ins error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while retrieving today\'s check-ins'
    });
  }
});

module.exports = router;
