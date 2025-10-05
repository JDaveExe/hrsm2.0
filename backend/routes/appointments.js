const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');

const router = express.Router();

// Temporary in-memory storage for appointment requests and approved appointments
// TODO: Replace with database when AppointmentRequest model is created
let appointmentRequests = [];
let pendingAppointments = []; // Store approved/rejected appointments with status

// Appointment limits configuration
const APPOINTMENT_LIMITS = {
  DAILY_LIMIT_PER_PATIENT: 2,
  WEEKLY_LIMIT_PER_PATIENT: 5,
  DAILY_LIMIT_TOTAL: 50, // Total appointments per day
  HOURLY_SLOTS: {
    '08:00': 5, '09:00': 5, '10:00': 5, '11:00': 5,
    '14:00': 5, '15:00': 5, '16:00': 5, '17:00': 5
  }
};

// Helper function to check appointment limits
const checkAppointmentLimits = async (patientId, appointmentDate, appointmentTime) => {
  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Check daily limit for patient
  const patientDailyCount = await Appointment.count({
    where: {
      patientId,
      appointmentDate,
      status: { [Op.notIn]: ['Cancelled', 'rejected'] },
      isActive: true
    }
  });
  
  if (patientDailyCount >= APPOINTMENT_LIMITS.DAILY_LIMIT_PER_PATIENT) {
    return {
      allowed: false,
      reason: `Patient has reached daily limit of ${APPOINTMENT_LIMITS.DAILY_LIMIT_PER_PATIENT} appointments per day`
    };
  }
  
  // Check weekly limit for patient
  const startOfWeek = new Date(appointmentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const patientWeeklyCount = await Appointment.count({
    where: {
      patientId,
      appointmentDate: {
        [Op.between]: [startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]]
      },
      status: { [Op.notIn]: ['Cancelled', 'rejected'] },
      isActive: true
    }
  });
  
  if (patientWeeklyCount >= APPOINTMENT_LIMITS.WEEKLY_LIMIT_PER_PATIENT) {
    return {
      allowed: false,
      reason: `Patient has reached weekly limit of ${APPOINTMENT_LIMITS.WEEKLY_LIMIT_PER_PATIENT} appointments per week`
    };
  }
  
  // Check total daily limit
  const totalDailyCount = await Appointment.count({
    where: {
      appointmentDate,
      status: { [Op.notIn]: ['Cancelled', 'rejected'] },
      isActive: true
    }
  });
  
  if (totalDailyCount >= APPOINTMENT_LIMITS.DAILY_LIMIT_TOTAL) {
    return {
      allowed: false,
      reason: `Daily appointment limit of ${APPOINTMENT_LIMITS.DAILY_LIMIT_TOTAL} has been reached`
    };
  }
  
  // Check hourly slot limits
  const hour = appointmentTime.split(':')[0].padStart(2, '0') + ':00';
  if (APPOINTMENT_LIMITS.HOURLY_SLOTS[hour]) {
    const hourlyCount = await Appointment.count({
      where: {
        appointmentDate,
        appointmentTime: {
          [Op.like]: `${hour}%`
        },
        status: { [Op.notIn]: ['Cancelled', 'rejected'] },
        isActive: true
      }
    });
    
    if (hourlyCount >= APPOINTMENT_LIMITS.HOURLY_SLOTS[hour]) {
      return {
        allowed: false,
        reason: `Time slot ${hour} is fully booked (${APPOINTMENT_LIMITS.HOURLY_SLOTS[hour]} appointments max)`
      };
    }
  }
  
  return { allowed: true };
};

// @route   GET api/appointments
// @desc    Get all appointments with optional filters
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      date, 
      status, 
      type, 
      doctorId, 
      patientId, 
      priority,
      startDate,
      endDate 
    } = req.query;

    // Build where clause based on query parameters
    const whereClause = { isActive: true };
    
    if (date) {
      whereClause.appointmentDate = date;
    }
    
    if (startDate && endDate) {
      whereClause.appointmentDate = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (doctorId) {
      whereClause.doctorId = doctorId;
    }
    
    if (patientId) {
      whereClause.patientId = patientId;
    }
    
    if (priority) {
      whereClause.priority = priority;
    }

    const appointments = await Appointment.findAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'contactNumber', 'email']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'position']
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName', 'role']
        }
      ],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });

    // Filter pending appointments based on query parameters
    let filteredPendingAppointments = [...pendingAppointments];
    
    if (status) {
      filteredPendingAppointments = filteredPendingAppointments.filter(apt => apt.status === status);
    }
    
    if (patientId) {
      filteredPendingAppointments = filteredPendingAppointments.filter(apt => apt.patientId === patientId);
    }
    
    if (date) {
      filteredPendingAppointments = filteredPendingAppointments.filter(apt => apt.appointmentDate === date);
    }
    
    if (type) {
      filteredPendingAppointments = filteredPendingAppointments.filter(apt => apt.type === type);
    }

    // Combine database appointments with temporary storage
    const allAppointments = [...appointments, ...filteredPendingAppointments];
    
    console.log(`📊 Found ${appointments.length} database appointments and ${filteredPendingAppointments.length} pending appointments`);
    
    res.json(allAppointments);
  } catch (err) {
    console.error('Error fetching appointments:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/appointments/today
// @desc    Get today's appointments (simplified route for frontend)
// @access  Private
router.get('/today', auth, async (req, res) => {
  try {
    console.log('🔍 Fetching today\'s appointments...');
    const today = new Date().toISOString().split('T')[0];
    console.log('📅 Today\'s date:', today);
    
    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: today,
        isActive: true,
        status: { [Op.notIn]: ['Cancelled'] }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'contactNumber']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'position']
        }
      ],
      order: [['appointmentTime', 'ASC']]
    });

    console.log(`📊 Found ${appointments.length} appointments for today`);

    // Format the response to match frontend expectations
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      patient_name: `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.trim() || 'Unknown Patient',
      appointment_date: apt.appointmentDate,
      appointment_time: apt.appointmentTime,
      type: apt.type,
      status: apt.status,
      doctor_name: `${apt.doctor?.firstName || ''} ${apt.doctor?.lastName || ''}`.trim() || 'Unknown Doctor',
      created_by_role: apt.createdBy ? 'admin' : 'doctor', // Simplified logic
      duration: apt.duration || '30 min',
      Patient: apt.patient,
      Doctor: apt.doctor
    }));

    console.log('✅ Sending formatted appointments:', formattedAppointments);
    res.json(formattedAppointments);
  } catch (err) {
    console.error('❌ Error fetching today\'s appointments:', err.message);
    console.error('📋 Error stack:', err.stack);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/appointments/calendar
// @desc    Get appointments for calendar view with query parameters
// @access  Private
router.get('/calendar', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ msg: 'startDate and endDate are required' });
    }

    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: {
          [Op.between]: [startDate, endDate]
        },
        isActive: true,
        status: { [Op.notIn]: ['Cancelled'] }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'contactNumber']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'position']
        }
      ],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });

    // Format the response to match frontend expectations
    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      patient_name: `${apt.patient?.firstName || ''} ${apt.patient?.lastName || ''}`.trim() || 'Unknown Patient',
      appointment_date: apt.appointmentDate,
      appointment_time: apt.appointmentTime,
      type: apt.type,
      status: apt.status,
      doctor_name: `${apt.doctor?.firstName || ''} ${apt.doctor?.lastName || ''}`.trim() || 'Unknown Doctor',
      created_by_role: apt.createdBy ? 'admin' : 'doctor', // Simplified logic
      duration: apt.duration || '30 min',
      Patient: apt.patient,
      Doctor: apt.doctor
    }));

    res.json(formattedAppointments);
  } catch (err) {
    console.error('Error fetching calendar appointments:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// ==================== APPOINTMENT REQUESTS ROUTES ====================
// Note: These routes must be defined BEFORE the parameterized /:id route
// to prevent "requests" from being interpreted as an appointment ID

// @route   POST api/appointments/requests
// @desc    Submit appointment request (Patient booking)
// @access  Private
router.post('/requests', [
  auth,
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('patientName').notEmpty().withMessage('Patient name is required'),
  body('appointmentType').notEmpty().withMessage('Appointment type is required'),
  body('requestedDate').isISO8601().withMessage('Valid date is required'),
  body('requestedTime').notEmpty().withMessage('Time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      patientId,
      patientName,
      appointmentType,
      requestedDate,
      requestedTime,
      duration,
      symptoms,
      notes
    } = req.body;

    // Check for duplicate appointments (same patient, date, and time)
    const isDuplicate = appointmentRequests.some(request => 
      request.patientId === patientId &&
      request.requestedDate === requestedDate &&
      request.requestedTime === requestedTime &&
      request.status === 'pending'
    ) || pendingAppointments.some(appointment => 
      appointment.patientId === patientId &&
      appointment.appointmentDate === requestedDate &&
      appointment.appointmentTime === requestedTime &&
      (appointment.status === 'pending' || appointment.status === 'approved' || appointment.status === 'accepted')
    );

    if (isDuplicate) {
      return res.status(400).json({ 
        msg: 'Duplicate appointment detected',
        error: 'You already have an appointment scheduled for this date and time. Please choose a different time slot.'
      });
    }

    // Check appointment limits
    const limitsCheck = await checkAppointmentLimits(patientId, requestedDate, requestedTime);
    if (!limitsCheck.allowed) {
      return res.status(400).json({ 
        msg: 'Appointment limit exceeded',
        error: limitsCheck.reason
      });
    }

    // Create appointment request
    const appointmentRequest = {
      id: Date.now(), // Temporary ID generation
      patientId,
      patientName,
      appointmentType,
      requestedDate,
      requestedTime,
      duration: duration || 30, // Default to 30 minutes
      symptoms: symptoms || '',
      notes: notes || '',
      status: 'pending',
      requestDate: new Date().toISOString(),
      submittedBy: req.user.id
    };

    // Create PENDING appointment
    const pendingAppointment = {
      id: Date.now() + Math.random(), // Unique ID for appointment
      patientId,
      patientName,
      appointmentDate: requestedDate,
      appointmentTime: requestedTime,
      duration: duration || 30, // Default to 30 minutes
      type: appointmentType,
      symptoms: symptoms || '',
      notes: notes || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
      requestId: appointmentRequest.id,
      isActive: true
    };

    // TODO: Save to database when AppointmentRequest model is created
    // For now, store in memory arrays
    appointmentRequests.push(appointmentRequest);
    pendingAppointments.push(pendingAppointment);
    
    console.log('📋 New Appointment Request Submitted:', appointmentRequest);
    console.log('📅 PENDING Appointment Created:', pendingAppointment);
    console.log('📊 Total requests in storage:', appointmentRequests.length);
    console.log('📊 Total appointments in storage:', pendingAppointments.length);

    res.status(201).json({
      message: 'Appointment request submitted successfully',
      request: appointmentRequest,
      appointment: pendingAppointment
    });
  } catch (err) {
    console.error('Error submitting appointment request:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/appointments/requests
// @desc    Get all appointment requests (Admin view)
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    // TODO: Fetch from database when AppointmentRequest model is created
    // For now, return in-memory array
    
    console.log('📋 Fetching appointment requests, total:', appointmentRequests.length);
    
    // Clean up expired appointment requests automatically
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTimeStr = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    
    const initialCount = appointmentRequests.length;
    const initialPendingCount = pendingAppointments.length;
    
    // Remove expired requests (requests where date/time has passed)
    appointmentRequests = appointmentRequests.filter(request => {
      if (request.status !== 'pending') return true; // Keep non-pending requests
      
      try {
        const requestDate = request.requestedDate;
        const requestTime = request.requestedTime;
        
        // If date is before today, it's expired
        if (requestDate < currentDateStr) {
          console.log(`⏰ Removing expired appointment request: ${request.id} (date: ${requestDate})`);
          return false;
        }
        
        // If date is today but time has passed, it's expired
        if (requestDate === currentDateStr && requestTime < currentTimeStr) {
          console.log(`⏰ Removing expired appointment request: ${request.id} (time: ${requestTime})`);
          return false;
        }
        
        return true; // Keep valid requests
      } catch (error) {
        console.warn('Invalid date/time in request:', request.id, error);
        return false; // Remove invalid requests
      }
    });
    
    // Also remove corresponding pending appointments for expired requests
    const validRequestIds = appointmentRequests.map(req => req.id);
    pendingAppointments = pendingAppointments.filter(apt => {
      if (apt.status !== 'pending' || !apt.requestId) return true; // Keep non-pending or approved appointments
      
      const isValidRequest = validRequestIds.includes(apt.requestId);
      if (!isValidRequest) {
        console.log(`⏰ Removing expired pending appointment: ${apt.id} (linked to expired request: ${apt.requestId})`);
      }
      return isValidRequest;
    });
    
    const removedRequests = initialCount - appointmentRequests.length;
    const removedPending = initialPendingCount - pendingAppointments.length;
    
    if (removedRequests > 0 || removedPending > 0) {
      console.log(`🧹 Cleaned up ${removedRequests} expired requests and ${removedPending} expired pending appointments`);
    }
    
    // Apply filters if provided
    const { status, patientId, date } = req.query;
    let filteredRequests = [...appointmentRequests];
    
    if (status) {
      filteredRequests = filteredRequests.filter(req => req.status === status);
    }
    
    if (patientId) {
      filteredRequests = filteredRequests.filter(req => req.patientId === patientId);
    }
    
    if (date) {
      filteredRequests = filteredRequests.filter(req => req.requestedDate === date);
    }

    res.json(filteredRequests);
  } catch (err) {
    console.error('Error fetching appointment requests:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/appointments/requests/count
// @desc    Get appointment requests count for notifications
// @access  Private
router.get('/requests/count', auth, async (req, res) => {
  try {
    // TODO: Count from database when model is ready
    const count = appointmentRequests.length;
    
    console.log('📊 Appointment requests count:', count);
    res.json({ count });
  } catch (err) {
    console.error('Error getting appointment requests count:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/appointments/available-slots
// @desc    Get available time slots for a specific date and patient
// @access  Private
router.get('/available-slots', auth, async (req, res) => {
  try {
    const { date, patientId } = req.query;
    
    if (!date) {
      return res.status(400).json({ msg: 'Date is required' });
    }

    // Generate time slots (9 AM to 5 PM, 30-minute intervals)
    const timeSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    const availableSlots = [];
    
    for (const time of timeSlots) {
      // Check if slot is already booked
      const existingAppointment = await Appointment.findOne({
        where: {
          appointmentDate: date,
          appointmentTime: time,
          status: { [Op.notIn]: ['Cancelled', 'Completed', 'rejected'] },
          isActive: true
        }
      });

      if (existingAppointment) {
        continue; // Skip booked slots
      }

      // Check appointment limits if patient ID is provided
      let limitStatus = { allowed: true, reason: null };
      if (patientId) {
        limitStatus = await checkAppointmentLimits(patientId, date, time);
      }

      availableSlots.push({
        time,
        available: limitStatus.allowed,
        reason: limitStatus.reason
      });
    }

    res.json({
      date,
      slots: availableSlots,
      totalSlots: timeSlots.length,
      availableCount: availableSlots.filter(slot => slot.available).length
    });
  } catch (err) {
    console.error('Error getting available slots:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/appointments/limits
// @desc    Get appointment limits configuration and current usage
// @access  Private
router.get('/limits', auth, async (req, res) => {
  try {
    const { patientId, date } = req.query;
    
    const response = {
      limits: APPOINTMENT_LIMITS,
      usage: {}
    };

    if (patientId && date) {
      const requestedDate = new Date(date);
      const startOfDay = new Date(requestedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(requestedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Get daily count for patient
      const dailyCount = await Appointment.count({
        where: {
          patientId: patientId,
          appointmentDate: date,
          status: { [Op.notIn]: ['Cancelled', 'rejected'] },
          isActive: true
        }
      });

      // Get weekly count for patient
      const startOfWeek = new Date(requestedDate);
      startOfWeek.setDate(requestedDate.getDate() - requestedDate.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weeklyCount = await Appointment.count({
        where: {
          patientId: patientId,
          appointmentDate: {
            [Op.between]: [startOfWeek.toISOString().split('T')[0], endOfWeek.toISOString().split('T')[0]]
          },
          status: { [Op.notIn]: ['Cancelled', 'rejected'] },
          isActive: true
        }
      });

      // Get total daily count
      const totalDailyCount = await Appointment.count({
        where: {
          appointmentDate: date,
          status: { [Op.notIn]: ['Cancelled', 'rejected'] },
          isActive: true
        }
      });

      response.usage = {
        patientDaily: dailyCount,
        patientWeekly: weeklyCount,
        totalDaily: totalDailyCount,
        dailyRemaining: Math.max(0, APPOINTMENT_LIMITS.maxPerPatientPerDay - dailyCount),
        weeklyRemaining: Math.max(0, APPOINTMENT_LIMITS.maxPerPatientPerWeek - weeklyCount),
        totalDailyRemaining: Math.max(0, APPOINTMENT_LIMITS.maxTotalPerDay - totalDailyCount)
      };
    }

    res.json(response);
  } catch (err) {
    console.error('Error getting appointment limits:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/appointments/requests/:id/approve
// @desc    Approve appointment request (Admin action)
// @access  Private
router.post('/requests/:id/approve', auth, async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    
    // Find the appointment request in memory
    const requestIndex = appointmentRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ msg: 'Appointment request not found' });
    }
    
    const appointmentRequest = appointmentRequests[requestIndex];
    
    // Find and update the corresponding PENDING appointment
    const pendingIndex = pendingAppointments.findIndex(apt => apt.requestId === requestId);
    let approvedAppointment;
    
    if (pendingIndex !== -1) {
      // Update existing PENDING appointment to APPROVED
      approvedAppointment = {
        ...pendingAppointments[pendingIndex],
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date().toISOString()
      };
      pendingAppointments[pendingIndex] = approvedAppointment;
    } else {
      // Fallback: create new approved appointment if pending not found
      approvedAppointment = {
        id: Date.now() + Math.random(),
        patientId: appointmentRequest.patientId,
        patientName: appointmentRequest.patientName,
        appointmentDate: appointmentRequest.requestedDate,
        appointmentTime: appointmentRequest.requestedTime,
        duration: appointmentRequest.duration || 30, // Default to 30 minutes
        type: appointmentRequest.appointmentType,
        symptoms: appointmentRequest.symptoms,
        notes: appointmentRequest.notes,
        status: 'approved',
        createdAt: new Date().toISOString(),
        approvedBy: req.user.id,
        approvedAt: new Date().toISOString(),
        requestId: requestId,
        isActive: true
      };
      pendingAppointments.push(approvedAppointment);
    }
    
    // Remove from requests array
    appointmentRequests.splice(requestIndex, 1);
    
    console.log(`✅ Appointment request ${requestId} approved by admin ${req.user.id}`);
    console.log('📊 Remaining requests in storage:', appointmentRequests.length);
    console.log('📊 Total approved appointments:', pendingAppointments.length);
    
    // TODO: Send notification to patient when notification system is ready
    
    res.json({
      message: 'Appointment request approved successfully',
      requestId: requestId,
      approvedRequest: appointmentRequest,
      appointment: approvedAppointment
    });
  } catch (err) {
    console.error('Error approving appointment request:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/appointments/requests/:id/reject
// @desc    Reject appointment request with reason (Admin action)
// @access  Private
router.post('/requests/:id/reject', [
  auth,
  body('reason').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const requestId = parseInt(req.params.id);
    const { reason } = req.body;
    
    // Find the appointment request in memory
    const requestIndex = appointmentRequests.findIndex(req => req.id === requestId);
    if (requestIndex === -1) {
      return res.status(404).json({ msg: 'Appointment request not found' });
    }
    
    const appointmentRequest = appointmentRequests[requestIndex];
    
    // Find and update the corresponding PENDING appointment
    const pendingIndex = pendingAppointments.findIndex(apt => apt.requestId === requestId);
    let rejectedAppointment;
    
    if (pendingIndex !== -1) {
      // Update existing PENDING appointment to REJECTED
      rejectedAppointment = {
        ...pendingAppointments[pendingIndex],
        status: 'rejected',
        rejectionReason: reason,
        rejectedBy: req.user.id,
        rejectedAt: new Date().toISOString()
      };
      pendingAppointments[pendingIndex] = rejectedAppointment;
    } else {
      // Fallback: create new rejected appointment if pending not found
      rejectedAppointment = {
        id: Date.now() + Math.random(),
        patientId: appointmentRequest.patientId,
        patientName: appointmentRequest.patientName,
        appointmentDate: appointmentRequest.requestedDate,
        appointmentTime: appointmentRequest.requestedTime,
        type: appointmentRequest.appointmentType,
        symptoms: appointmentRequest.symptoms,
        notes: appointmentRequest.notes,
        status: 'rejected',
        rejectionReason: reason,
        createdAt: new Date().toISOString(),
        rejectedBy: req.user.id,
        rejectedAt: new Date().toISOString(),
        requestId: requestId,
        isActive: true
      };
      pendingAppointments.push(rejectedAppointment);
    }
    
    // Remove from requests array
    appointmentRequests.splice(requestIndex, 1);
    
    console.log(`❌ Appointment request ${requestId} rejected by admin ${req.user.id}. Reason: ${reason}`);
    console.log('📊 Remaining requests in storage:', appointmentRequests.length);
    console.log('📊 Total appointments:', pendingAppointments.length);
    
    // TODO: Send notification to patient when notification system is ready
    
    res.json({
      message: 'Appointment request rejected',
      requestId: requestId,
      reason: reason,
      rejectedRequest: appointmentRequest,
      appointment: rejectedAppointment
    });
  } catch (err) {
    console.error('Error rejecting appointment request:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'contactNumber', 'email', 'dateOfBirth', 'gender']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'position', 'email']
        },
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName', 'role']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (err) {
    console.error('Error fetching appointment:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/appointments
// @desc    Create a new appointment
// @access  Private
router.post('/', [
  auth,
  [
    body('patientId', 'Patient ID is required').isInt(),
    body('appointmentDate', 'Appointment date is required').isDate(),
    body('appointmentTime', 'Appointment time is required').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('type', 'Appointment type is required').isIn([
      'Consultation', 'Follow-up', 'Check-up', 'Vaccination', 
      'Out-Patient', 'Emergency', 'Lab Test'
    ]),
    body('duration', 'Duration must be a positive number').optional().isInt({ min: 1 }),
    body('priority', 'Priority must be valid').optional().isIn(['Low', 'Normal', 'High', 'Emergency'])
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      duration = 30,
      type,
      priority = 'Normal',
      notes,
      symptoms,
      vitalSignsRequired = true
    } = req.body;

    // Check if patient exists
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    // Check if doctor exists (if provided)
    if (doctorId) {
      const doctor = await User.findOne({ 
        where: { id: doctorId, role: 'doctor', isActive: true }
      });
      if (!doctor) {
        return res.status(404).json({ msg: 'Doctor not found' });
      }
    }

    // Check if patient already has an active appointment (limit 1 per patient)
    const existingActiveAppointment = await Appointment.findOne({
      where: {
        patientId,
        status: { [Op.in]: ['Scheduled'] }, // Only allow one scheduled appointment
        isActive: true
      }
    });

    if (existingActiveAppointment) {
      return res.status(400).json({ 
        msg: 'Active appointment exists',
        error: 'You already have an active appointment. Please cancel your existing appointment before booking a new one.'
      });
    }

    // Check for cancellation cooldown (1 day after last cancellation)
    const lastCancellation = await Appointment.findOne({
      where: {
        patientId,
        status: 'Cancelled',
        isActive: true
      },
      order: [['updatedAt', 'DESC']]
    });

    if (lastCancellation) {
      const cooldownEnd = new Date(lastCancellation.updatedAt);
      cooldownEnd.setDate(cooldownEnd.getDate() + 1); // Add 1 day
      const now = new Date();
      
      if (now < cooldownEnd) {
        const hoursLeft = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60));
        return res.status(400).json({ 
          msg: 'Cancellation cooldown active',
          error: `You must wait ${hoursLeft} hours after cancelling an appointment before booking a new one.`
        });
      }
    }

    // Check for daily appointment limit (12 appointments per day)
    const dailyAppointmentCount = await Appointment.count({
      where: {
        appointmentDate,
        status: { [Op.notIn]: ['Cancelled'] },
        isActive: true
      }
    });

    if (dailyAppointmentCount >= 12) {
      return res.status(400).json({ 
        msg: 'Daily appointment limit reached',
        error: 'The daily appointment limit of 12 has been reached for this date. Please choose a different date.',
        errorCode: 'DAILY_LIMIT_REACHED'
      });
    }

    // Check for exact time conflicts (no two appointments at exact same date+time)
    const exactTimeConflict = await Appointment.findOne({
      where: {
        appointmentDate,
        appointmentTime,
        status: { [Op.notIn]: ['Cancelled', 'Completed', 'No Show'] },
        isActive: true
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    if (exactTimeConflict) {
      const conflictPatientName = exactTimeConflict.patient 
        ? `${exactTimeConflict.patient.firstName} ${exactTimeConflict.patient.lastName}`
        : 'Another patient';
      
      return res.status(400).json({ 
        msg: 'Time slot unavailable',
        error: `This exact time slot is already booked by ${conflictPatientName}. Please choose a different time.`,
        errorCode: 'EXACT_TIME_CONFLICT'
      });
    }

    // Check for 30-minute buffer conflicts (optional - can be removed if only exact conflicts matter)
    const conflictingAppointments = await Appointment.findAll({
      where: {
        appointmentDate,
        status: { [Op.notIn]: ['Cancelled', 'Completed', 'No Show'] },
        isActive: true,
        appointmentTime: { [Op.ne]: appointmentTime } // Exclude exact time (already checked above)
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['firstName', 'lastName']
        }
      ]
    });

    // Check if any existing appointment is within 30 minutes of the requested time
    const requestedTimeMinutes = parseInt(appointmentTime.split(':')[0]) * 60 + parseInt(appointmentTime.split(':')[1]);
    
    for (const existingAppt of conflictingAppointments) {
      const existingTimeMinutes = parseInt(existingAppt.appointmentTime.split(':')[0]) * 60 + parseInt(existingAppt.appointmentTime.split(':')[1]);
      const timeDifference = Math.abs(requestedTimeMinutes - existingTimeMinutes);
      
      if (timeDifference < 30) { // Less than 30 minutes apart
        const conflictPatientName = existingAppt.patient 
          ? `${existingAppt.patient.firstName} ${existingAppt.patient.lastName}`
          : 'Another patient';
        
        return res.status(400).json({ 
          msg: 'Time slot too close',
          error: `This time slot is too close to an existing appointment by ${conflictPatientName} at ${existingAppt.appointmentTime}. Please choose a time at least 30 minutes away.`,
          errorCode: 'BUFFER_TIME_CONFLICT'
        });
      }
    }

    const appointment = await Appointment.create({
      patientId,
      doctorId: doctorId || null,
      appointmentDate,
      appointmentTime,
      duration,
      type,
      priority,
      notes,
      symptoms,
      vitalSignsRequired,
      status: 'Scheduled', // All appointments go directly to scheduled status
      createdBy: req.user.id
    });

    // Fetch the created appointment with associations
    const newAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'contactNumber']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'position']
        }
      ]
    });

    // Create notification for the patient about the new appointment
    try {
      const appointmentData = {
        date: appointmentDate,
        time: appointmentTime,
        service: type,
        doctor: newAppointment.doctor ? 
          `${newAppointment.doctor.firstName} ${newAppointment.doctor.lastName}` : 
          'Dr. Smith',
        notes: notes || 'Please arrive 15 minutes early for your appointment'
      };

      const notificationTitle = 'New Appointment Scheduled';
      const notificationMessage = `You have a new ${type} appointment scheduled for ${appointmentDate} at ${appointmentTime}. Please review and accept to confirm your attendance.`;

      // Create notification in database
      await sequelize.query(
        `INSERT INTO notifications (patient_id, title, message, type, appointment_data, status) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        { 
          replacements: [
            patientId, 
            notificationTitle, 
            notificationMessage, 
            'appointment_scheduled',
            JSON.stringify(appointmentData),
            'pending'
          ]
        }
      );

      console.log(`✅ Notification created for patient ${patientId} - appointment on ${appointmentDate}`);
    } catch (notificationError) {
      console.error('Error creating notification (appointment still created):', notificationError.message);
      // Don't fail the whole request if notification creation fails
    }

    res.status(201).json({
      msg: 'Appointment created successfully',
      appointment: newAppointment
    });
  } catch (err) {
    console.error('Error creating appointment:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/appointments/:id
// @desc    Update an appointment
// @access  Private
router.put('/:id', [
  auth,
  [
    body('appointmentDate', 'Appointment date must be valid').optional().isDate(),
    body('appointmentTime', 'Appointment time must be valid').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('type', 'Appointment type must be valid').optional().isIn([
      'Consultation', 'Follow-up', 'Check-up', 'Vaccination', 
      'Out-Patient', 'Emergency', 'Lab Test'
    ]),
    body('status', 'Status must be valid').optional().isIn([
      'Scheduled', 'Completed', 'Cancelled', 'No Show'
    ]),
    body('priority', 'Priority must be valid').optional().isIn(['Low', 'Normal', 'High', 'Emergency'])
  ]
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    const updateData = { ...req.body, updatedBy: req.user.id };

    // If updating date/time, check for conflicts
    if (updateData.appointmentDate || updateData.appointmentTime) {
      const checkDate = updateData.appointmentDate || appointment.appointmentDate;
      const checkTime = updateData.appointmentTime || appointment.appointmentTime;
      const checkDoctorId = updateData.doctorId !== undefined ? updateData.doctorId : appointment.doctorId;

      // Check for ANY appointment conflicts at the same time slot (regardless of patient or doctor)
      const timeSlotConflict = await Appointment.findOne({
        where: {
          id: { [Op.ne]: appointment.id }, // Exclude current appointment from conflict check
          appointmentDate: checkDate,
          appointmentTime: checkTime,
          status: { [Op.notIn]: ['Cancelled', 'Completed', 'No Show'] },
          isActive: true
        },
        include: [
          {
            model: Patient,
            as: 'patient',
            attributes: ['firstName', 'lastName']
          }
        ]
      });

      if (timeSlotConflict) {
        const conflictPatientName = timeSlotConflict.patient 
          ? `${timeSlotConflict.patient.firstName} ${timeSlotConflict.patient.lastName}`
          : 'Another patient';
        
        return res.status(400).json({ 
          msg: 'Time slot already booked',
          error: `This time slot is already reserved by ${conflictPatientName}. Please choose a different time.`
        });
      }
    }

    await appointment.update(updateData);

    // Fetch updated appointment with associations
    const updatedAppointment = await Appointment.findByPk(appointment.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'contactNumber']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'position']
        }
      ]
    });

    res.json({
      msg: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (err) {
    console.error('Error updating appointment:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   DELETE api/appointments/:id
// @desc    Cancel/Delete an appointment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    const { permanent } = req.query;

    if (permanent === 'true') {
      // Permanently delete the appointment
      await appointment.destroy();
      res.json({ msg: 'Appointment permanently deleted' });
    } else {
      // Soft delete - mark as cancelled
      await appointment.update({ 
        status: 'Cancelled', 
        updatedBy: req.user.id 
      });
      res.json({ msg: 'Appointment cancelled successfully' });
    }
  } catch (err) {
    console.error('Error deleting appointment:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/appointments/today/list
// @desc    Get today's appointments
// @access  Private
router.get('/today/list', auth, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: today,
        isActive: true,
        status: { [Op.notIn]: ['Cancelled'] }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'contactNumber']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'position']
        }
      ],
      order: [['appointmentTime', 'ASC']]
    });

    res.json(appointments);
  } catch (err) {
    console.error('Error fetching today\'s appointments:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/appointments/calendar/:year/:month
// @desc    Get appointments for calendar view
// @access  Private
router.get('/calendar/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: {
          [Op.between]: [startDate, endDate]
        },
        isActive: true,
        status: { [Op.notIn]: ['Cancelled'] }
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });

    res.json(appointments);
  } catch (err) {
    console.error('Error fetching calendar appointments:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/appointments/:id/start-session
// @desc    Start appointment session
// @access  Private
router.post('/:id/start-session', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    if (appointment.status !== 'Confirmed' && appointment.status !== 'Scheduled') {
      return res.status(400).json({ msg: 'Appointment cannot be started' });
    }

    await appointment.update({ 
      status: 'In Progress',
      updatedBy: req.user.id 
    });

    res.json({ msg: 'Appointment session started' });
  } catch (err) {
    console.error('Error starting appointment session:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/appointments/:id/complete
// @desc    Complete appointment
// @access  Private
router.post('/:id/complete', [
  auth,
  [
    body('diagnosis', 'Diagnosis is required').optional().not().isEmpty(),
    body('treatment', 'Treatment is required').optional().not().isEmpty(),
    body('prescription', 'Prescription details').optional().not().isEmpty()
  ]
], async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    const { diagnosis, treatment, prescription, notes } = req.body;

    await appointment.update({ 
      status: 'Completed',
      diagnosis: diagnosis || appointment.diagnosis,
      treatment: treatment || appointment.treatment,
      prescription: prescription || appointment.prescription,
      notes: notes || appointment.notes,
      updatedBy: req.user.id 
    });

    res.json({ msg: 'Appointment completed successfully' });
  } catch (err) {
    console.error('Error completing appointment:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// ==================== APPOINTMENT STATUS WORKFLOW ENDPOINTS ====================

// @route   PUT api/appointments/:id/accept
// @desc    Patient accepts an approved appointment
// @access  Private
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'contactNumber']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Validate current status - only approved appointments can be accepted
    if (appointment.status !== 'approved') {
      return res.status(400).json({ 
        msg: 'Only approved appointments can be accepted',
        currentStatus: appointment.status 
      });
    }

    // Update status to accepted
    await appointment.update({ 
      status: 'accepted',
      needsPatientAcceptance: false,
      updatedBy: req.user.id,
      acceptedAt: new Date()
    });

    // Log the status change
    console.log(`✅ Appointment ${appointment.id} accepted by patient`);
    
    // TODO: Send notification to admin/doctor about patient acceptance
    // TODO: Update any related scheduling systems

    res.json({ 
      msg: 'Appointment accepted successfully',
      appointment: {
        id: appointment.id,
        status: appointment.status,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        patient: appointment.patient,
        doctor: appointment.doctor
      }
    });

  } catch (err) {
    console.error('Error accepting appointment:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/appointments/:id/reject
// @desc    Patient rejects an approved appointment
// @access  Private
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'contactNumber']
        },
        {
          model: User,
          as: 'doctor', 
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Validate current status - only approved appointments can be rejected
    if (appointment.status !== 'approved') {
      return res.status(400).json({ 
        msg: 'Only approved appointments can be rejected',
        currentStatus: appointment.status 
      });
    }

    // Update status to rejected with rejection reason
    await appointment.update({ 
      status: 'rejected',
      needsPatientAcceptance: false,
      rejectionReason: reason || 'No reason provided',
      notes: appointment.notes ? `${appointment.notes}\n\nPatient Rejection: ${reason || 'No reason provided'}` : `Patient Rejection: ${reason || 'No reason provided'}`,
      updatedBy: req.user.id,
      rejectedAt: new Date()
    });

    // Log the status change
    console.log(`❌ Appointment ${appointment.id} rejected by patient: ${reason}`);
    
    // TODO: Send notification to admin/doctor about patient rejection
    // TODO: Update scheduling availability

    res.json({ 
      msg: 'Appointment rejected successfully',
      appointment: {
        id: appointment.id,
        status: appointment.status,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        patient: appointment.patient,
        doctor: appointment.doctor,
        rejectionReason: reason
      }
    });

  } catch (err) {
    console.error('Error rejecting appointment:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/appointments/:id/complete
// @desc    Mark appointment as completed (Admin/Doctor only)
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const { diagnosis, treatment, prescription, followUpRequired, followUpDate } = req.body;

    // Verify user has permission (admin or doctor)
    if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
      return res.status(403).json({ msg: 'Access denied. Admin or doctor privileges required.' });
    }
    
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'contactNumber']
        },
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Validate current status - only confirmed appointments can be completed
    if (appointment.status !== 'Confirmed' && appointment.status !== 'In Progress') {
      return res.status(400).json({ 
        msg: 'Only confirmed or in-progress appointments can be completed',
        currentStatus: appointment.status 
      });
    }

    // Update appointment to completed with medical details
    await appointment.update({ 
      status: 'Completed',
      diagnosis: diagnosis || appointment.diagnosis,
      treatment: treatment || appointment.treatment,
      prescription: prescription || appointment.prescription,
      updatedBy: req.user.id,
      completedAt: new Date()
    });

    // Log the completion
    console.log(`✅ Appointment ${appointment.id} completed by ${req.user.firstName} ${req.user.lastName}`);
    
    // TODO: Send completion notification to patient
    // TODO: Schedule follow-up if required
    // TODO: Update patient medical history

    res.json({ 
      msg: 'Appointment completed successfully',
      appointment: {
        id: appointment.id,
        status: appointment.status,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
        patient: appointment.patient,
        doctor: appointment.doctor,
        diagnosis: appointment.diagnosis,
        treatment: appointment.treatment,
        prescription: appointment.prescription
      }
    });

  } catch (err) {
    console.error('Error completing appointment:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   GET api/appointments/:id/status-history
// @desc    Get appointment status change history
// @access  Private
router.get('/:id/status-history', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'createdByUser',
          attributes: ['id', 'firstName', 'lastName', 'role']
        }
      ]
    });

    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Build status history from appointment data
    const statusHistory = [
      {
        status: 'Created',
        timestamp: appointment.createdAt,
        user: appointment.createdByUser,
        action: 'Appointment created'
      }
    ];

    if (appointment.acceptedAt) {
      statusHistory.push({
        status: 'Accepted',
        timestamp: appointment.acceptedAt,
        user: { role: 'patient' },
        action: 'Patient accepted appointment'
      });
    }

    if (appointment.rejectedAt) {
      statusHistory.push({
        status: 'Rejected',
        timestamp: appointment.rejectedAt,
        user: { role: 'patient' },
        action: 'Patient rejected appointment'
      });
    }

    if (appointment.completedAt) {
      statusHistory.push({
        status: 'Completed',
        timestamp: appointment.completedAt,
        user: { role: 'doctor' },
        action: 'Appointment completed'
      });
    }

    res.json({
      appointmentId: appointment.id,
      currentStatus: appointment.status,
      statusHistory: statusHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    });

  } catch (err) {
    console.error('Error fetching status history:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// ==================== AUTOMATIC STATUS MANAGEMENT ENDPOINTS ====================

// @route   PUT api/appointments/update-overdue-status
// @desc    Automatically update status of overdue appointments
// @access  Private
router.put('/update-overdue-status', auth, async (req, res) => {
  try {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const currentTime = today.toTimeString().split(' ')[0].substring(0, 5); // HH:MM format
    
    // Find appointments that are past their scheduled time and still active
    const overdueAppointments = await Appointment.findAll({
      where: {
        appointmentDate: {
          [require('sequelize').Op.lt]: todayDateString // Date is before today
        },
        status: ['Scheduled', 'Confirmed'], // Only update scheduled/confirmed appointments
        isActive: true
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    // Also find appointments from today that have passed their time
    const todayOverdueAppointments = await Appointment.findAll({
      where: {
        appointmentDate: todayDateString,
        appointmentTime: {
          [require('sequelize').Op.lt]: currentTime // Time has passed
        },
        status: ['Scheduled', 'Confirmed'],
        isActive: true
      },
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    const allOverdueAppointments = [...overdueAppointments, ...todayOverdueAppointments];
    
    if (allOverdueAppointments.length === 0) {
      return res.json({ 
        msg: 'No overdue appointments found',
        updated: 0 
      });
    }

    // Update overdue appointments to 'No Show' status
    const updatePromises = allOverdueAppointments.map(async (appointment) => {
      await appointment.update({
        status: 'No Show',
        updatedBy: req.user.id,
        notes: appointment.notes ? 
          `${appointment.notes}\n\nAutomatically marked as No Show - appointment time passed` :
          'Automatically marked as No Show - appointment time passed'
      });
      
      console.log(`⏰ Appointment ${appointment.id} marked as No Show (overdue)`);
      
      return {
        id: appointment.id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        date: appointment.appointmentDate,
        time: appointment.appointmentTime,
        previousStatus: 'Scheduled/Confirmed',
        newStatus: 'No Show'
      };
    });

    const updatedAppointments = await Promise.all(updatePromises);

    res.json({
      msg: `Successfully updated ${updatedAppointments.length} overdue appointments`,
      updated: updatedAppointments.length,
      appointments: updatedAppointments
    });

  } catch (err) {
    console.error('Error updating overdue appointments:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/appointments/:id/mark-completed
// @desc    Mark specific appointment as completed (for patient dashboard)
// @access  Private
router.put('/:id/mark-completed', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ msg: 'Appointment not found' });
    }

    // Validate that appointment belongs to the requesting patient
    if (req.user.role === 'patient' && appointment.patientId !== req.user.patientId) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // Only allow marking confirmed appointments as completed
    if (appointment.status !== 'Confirmed') {
      return res.status(400).json({ 
        msg: 'Only confirmed appointments can be marked as completed',
        currentStatus: appointment.status 
      });
    }

    await appointment.update({
      status: 'Completed',
      completedAt: new Date(),
      updatedBy: req.user.id
    });

    console.log(`✅ Appointment ${appointment.id} marked as completed by patient`);

    res.json({ 
      msg: 'Appointment marked as completed',
      appointment: {
        id: appointment.id,
        status: appointment.status,
        completedAt: appointment.completedAt
      }
    });

  } catch (err) {
    console.error('Error marking appointment as completed:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// ==================== APPOINTMENT REQUESTS ENDPOINTS ====================

// @route   POST api/appointments/requests
// @desc    Submit appointment request (Patient booking)
// @access  Private

// GET /api/appointments/daily-count
// @desc    Get daily appointment count for a specific date
// @access  Public (for frontend validation)
router.get('/daily-count', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ msg: 'Date parameter is required' });
    }
    
    const count = await Appointment.count({
      where: {
        appointmentDate: date,
        status: { [Op.notIn]: ['Cancelled'] },
        isActive: true
      }
    });
    
    res.json({ 
      date,
      count,
      limit: 12,
      isLimitReached: count >= 12
    });
  } catch (error) {
    console.error('Error checking daily appointment count:', error);
    res.status(500).json({ msg: 'Server error while checking daily limit' });
  }
});

module.exports = router;
