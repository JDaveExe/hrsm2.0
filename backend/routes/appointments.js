const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();

// Import models
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const CheckInSession = require('../models/CheckInSession');
const ServiceSchedule = require('../models/ServiceSchedule');

// Import middleware
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// @desc    Health check for appointment routes
// @route   GET /api/appointments/health
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Appointment routes are working',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
//                         ADMIN APPOINTMENT MANAGEMENT
// =============================================================================

// @desc    Get today's checkups for admin dashboard
// @route   GET /api/appointments/admin/today
// @access  Private (Admin only)
router.get('/admin/today', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Get all appointments for today
    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('patientId', 'firstName lastName contactNumber qrCode')
    .populate('doctorId', 'firstName lastName')
    .sort({ appointmentTime: 1 });

    // Get check-in sessions for today
    const checkInSessions = await CheckInSession.find({
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('patientId', 'firstName lastName contactNumber qrCode')
    .sort({ createdAt: -1 });

    // Calculate statistics
    const stats = {
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
      pendingAppointments: appointments.filter(apt => apt.status === 'scheduled').length,
      cancelledAppointments: appointments.filter(apt => apt.status === 'cancelled').length,
      totalCheckIns: checkInSessions.length,
      completedCheckIns: checkInSessions.filter(session => session.status === 'completed').length,
      inProgressCheckIns: checkInSessions.filter(session => session.status === 'vital_signs_collected').length
    };

    res.status(200).json({
      success: true,
      data: {
        appointments,
        checkInSessions,
        stats,
        date: today.toISOString().split('T')[0]
      }
    });

  } catch (error) {
    console.error('Get today appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s appointments',
      error: error.message
    });
  }
});

// @desc    Get appointments with filtering and pagination
// @route   GET /api/appointments/admin/list
// @access  Private (Admin only)
router.get('/admin/list', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      doctorId,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter object
    const filter = {};

    if (status) filter.status = status;
    if (doctorId) filter.doctorId = doctorId;

    // Date range filter
    if (startDate && endDate) {
      filter.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Search filter (patient name or contact)
    let patientFilter = {};
    if (search) {
      patientFilter = {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { contactNumber: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get patient IDs that match search criteria
    let patientIds = [];
    if (search) {
      const patients = await Patient.find(patientFilter).select('_id');
      patientIds = patients.map(p => p._id);
      if (patientIds.length > 0) {
        filter.patientId = { $in: patientIds };
      } else {
        // No patients found matching search criteria
        return res.status(200).json({
          success: true,
          data: {
            appointments: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            }
          }
        });
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await Appointment.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    // Get appointments
    const appointments = await Appointment.find(filter)
      .populate('patientId', 'firstName lastName contactNumber qrCode')
      .populate('doctorId', 'firstName lastName')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        }
      }
    });

  } catch (error) {
    console.error('Get appointments list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// @desc    Create new appointment (Admin)
// @route   POST /api/appointments/admin/create
// @access  Private (Admin only)
router.post('/admin/create', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      serviceType,
      reason,
      notes
    } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !appointmentDate || !appointmentTime || !serviceType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check if doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check for conflicting appointments
    const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $ne: 'cancelled' }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Doctor already has an appointment at this time'
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      serviceType,
      reason,
      notes,
      status: 'scheduled',
      createdBy: req.user.id
    });

    await appointment.save();

    // Populate the appointment data
    await appointment.populate('patientId', 'firstName lastName contactNumber qrCode');
    await appointment.populate('doctorId', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
    });

  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
});

// @desc    Update appointment status
// @route   PUT /api/appointments/admin/:id/status
// @access  Private (Admin only)
router.put('/admin/:id/status', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const appointmentId = req.params.id;

    // Validate status
    const validStatuses = ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment status'
      });
    }

    // Find and update appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;
    appointment.updatedBy = req.user.id;

    await appointment.save();

    // Populate the appointment data
    await appointment.populate('patientId', 'firstName lastName contactNumber qrCode');
    await appointment.populate('doctorId', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: appointment
    });

  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment status',
      error: error.message
    });
  }
});

// @desc    Get appointment details by ID
// @route   GET /api/appointments/admin/:id
// @access  Private (Admin only)
router.get('/admin/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'firstName lastName contactNumber qrCode dateOfBirth gender')
      .populate('doctorId', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .populate('updatedBy', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Get appointment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment details',
      error: error.message
    });
  }
});

// @desc    Delete appointment
// @route   DELETE /api/appointments/admin/:id
// @access  Private (Admin only)
router.delete('/admin/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting appointment',
      error: error.message
    });
  }
});

// =============================================================================
//                         DOCTOR APPOINTMENT ACCESS
// =============================================================================

// @desc    Get doctor's appointments
// @route   GET /api/appointments/doctor/my-appointments
// @access  Private (Doctor only)
router.get('/doctor/my-appointments', auth, roleCheck(['doctor']), async (req, res) => {
  try {
    const { date, status } = req.query;
    
    // Build filter for doctor's appointments
    const filter = { doctorId: req.user.id };
    
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      filter.appointmentDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    if (status) {
      filter.status = status;
    }

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'firstName lastName contactNumber qrCode dateOfBirth gender')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    res.status(200).json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// @desc    Get all appointments (General)
// @route   GET /api/appointments
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    // Role-based filtering
    if (req.user.role === 'doctor') {
      filter.doctorId = req.user.id;
    } else if (req.user.role === 'patient') {
      // Find patient record for this user
      const patient = await Patient.findOne({ userId: req.user.id });
      if (patient) {
        filter.patientId = patient._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }
    }
    // Admin can see all appointments (no additional filter)

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'firstName lastName contactNumber')
      .populate('doctorId', 'firstName lastName')
      .sort({ appointmentDate: -1, appointmentTime: -1 })
      .limit(50); // Limit to recent 50 appointments

    res.status(200).json({
      success: true,
      data: appointments
    });

  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    let filter = { _id: req.params.id };
    
    // Role-based access control
    if (req.user.role === 'doctor') {
      filter.doctorId = req.user.id;
    } else if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ userId: req.user.id });
      if (patient) {
        filter.patientId = patient._id;
      } else {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }
    }
    // Admin can access any appointment

    const appointment = await Appointment.findOne(filter)
      .populate('patientId', 'firstName lastName contactNumber qrCode dateOfBirth gender')
      .populate('doctorId', 'firstName lastName');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching appointment',
      error: error.message
    });
  }
});

module.exports = router;
