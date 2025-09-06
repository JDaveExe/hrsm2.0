const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');

const router = express.Router();

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

    res.json(appointments);
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
      'Dental Consultation', 'Dental Procedure', 'Out-Patient', 'Emergency', 'Lab Test'
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
      'Dental Consultation', 'Dental Procedure', 'Out-Patient', 'Emergency', 'Lab Test'
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

module.exports = router;
