const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');

const router = express.Router();

// Temporary in-memory storage for appointment requests and approved appointments
// TODO: Replace with database when AppointmentRequest model is created
let appointmentRequests = [];
let pendingAppointments = []; // Store approved/rejected appointments with status

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
      symptoms,
      notes
    } = req.body;

    // Create appointment request
    const appointmentRequest = {
      id: Date.now(), // Temporary ID generation
      patientId,
      patientName,
      appointmentType,
      requestedDate,
      requestedTime,
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

    // Check for scheduling conflicts
    const conflictingAppointment = await Appointment.findOne({
      where: {
        appointmentDate,
        appointmentTime,
        doctorId: doctorId || null,
        status: { [Op.notIn]: ['Cancelled', 'Completed'] },
        isActive: true
      }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ 
        msg: 'Time slot already booked for this doctor' 
      });
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
      'Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'
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

      const conflictingAppointment = await Appointment.findOne({
        where: {
          id: { [Op.ne]: appointment.id },
          appointmentDate: checkDate,
          appointmentTime: checkTime,
          doctorId: checkDoctorId,
          status: { [Op.notIn]: ['Cancelled', 'Completed'] },
          isActive: true
        }
      });

      if (conflictingAppointment) {
        return res.status(400).json({ 
          msg: 'Time slot already booked for this doctor' 
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
    if (appointment.status !== 'Scheduled') { // Using 'Scheduled' as 'approved' equivalent for now
      return res.status(400).json({ 
        msg: 'Only approved appointments can be accepted',
        currentStatus: appointment.status 
      });
    }

    // Update status to accepted (using 'Confirmed' as 'accepted' equivalent)
    await appointment.update({ 
      status: 'Confirmed',
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
    if (appointment.status !== 'Scheduled') {
      return res.status(400).json({ 
        msg: 'Only approved appointments can be rejected',
        currentStatus: appointment.status 
      });
    }

    // Update status to cancelled with rejection reason
    await appointment.update({ 
      status: 'Cancelled',
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


module.exports = router;
