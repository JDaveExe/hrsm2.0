const express = require('express');
const router = express.Router();
const { CheckInSession, Patient, VitalSigns, User } = require('../models');
const { Op } = require('sequelize');
const { authenticateToken: auth } = require('../middleware/auth');

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'N/A';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Get doctor's patient queue - for doctors and admins
router.get('/', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build where clause - admins see all queue items, doctors see only their assigned patients
    const whereClause = {
      checkInTime: {
        [Op.between]: [today, tomorrow]
      },
      doctorNotified: true,
      status: {
        [Op.in]: ['doctor-notified', 'in-progress', 'completed']
      },
      [Op.not]: {
        status: 'transferred'
      }
    };

    // If user is not admin, filter by assigned doctor
    if (req.user.role !== 'admin') {
      whereClause.assignedDoctor = req.user.id;
    }

    // Get queue sessions
    const queueSessions = await CheckInSession.findAll({
      where: whereClause,
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'contactNumber']
        },
        {
          model: User,
          as: 'assignedDoctorUser',
          attributes: ['id', 'firstName', 'lastName', 'username', 'position'],
          required: false
        }
      ],
      order: [
        ['notifiedAt', 'ASC'], // Order by when they were added to queue
        ['checkInTime', 'ASC']
      ]
    });

    const queueData = queueSessions.map(session => ({
      id: session.id,
      patientId: session.patientId,
      patientName: session.Patient ? `${session.Patient.firstName} ${session.Patient.lastName}` : 'Unknown Patient',
      age: session.Patient?.dateOfBirth ? calculateAge(session.Patient.dateOfBirth) : 'N/A',
      gender: session.Patient?.gender || 'N/A',
      contactNumber: session.Patient?.contactNumber || 'N/A',
      checkInTime: session.checkInTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      queuedAt: session.notifiedAt ? session.notifiedAt.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }) : null,
      serviceType: session.serviceType || 'General Checkup',
      status: session.status === 'doctor-notified' ? 'waiting' : session.status,
      priority: session.priority || 'Normal',
      vitalSigns: session.vitalSigns ? JSON.parse(session.vitalSigns) : null,
      vitalSignsTime: session.vitalSignsTime,
      notes: session.notes || '',
      assignedDoctor: session.assignedDoctor || null,
      assignedDoctorName: session.assignedDoctorUser ? 
        `${session.assignedDoctorUser.firstName} ${session.assignedDoctorUser.lastName}` : null,
      startedAt: session.startedAt || null,
      completedAt: session.completedAt || null
    }));

    res.json(queueData);
  } catch (error) {
    console.error('Error fetching doctor queue:', error);
    res.status(500).json({ 
      error: 'Failed to fetch doctor queue',
      message: error.message 
    });
  }
});

// Start a checkup session
router.post('/:sessionId/start', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { doctorId } = req.body;

    const session = await CheckInSession.findByPk(sessionId, {
      include: [{
        model: Patient,
        as: 'Patient',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Check-in session not found' });
    }

    if (!session.doctorNotified) {
      return res.status(400).json({ error: 'Patient must be in queue before starting checkup' });
    }

    // Ensure this session is assigned to the authenticated doctor
    if (session.assignedDoctor !== req.user.id) {
      return res.status(403).json({ error: 'You can only start checkups for patients assigned to you' });
    }

    // Update session to in-progress
    await session.update({
      status: 'in-progress',
      assignedDoctor: doctorId,
      startedAt: new Date()
    });

    res.json({ 
      message: 'Checkup started successfully',
      session: {
        id: session.id,
        status: session.status,
        assignedDoctor: session.assignedDoctor,
        startedAt: session.startedAt,
        patientName: `${session.Patient?.firstName} ${session.Patient?.lastName}`
      }
    });
  } catch (error) {
    console.error('Error starting checkup:', error);
    res.status(500).json({ 
      error: 'Failed to start checkup',
      message: error.message 
    });
  }
});

// Complete a checkup session
router.post('/:sessionId/complete', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { doctorId, diagnosis, prescription, notes } = req.body;

    const session = await CheckInSession.findByPk(sessionId, {
      include: [{
        model: Patient,
        as: 'Patient',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!session) {
      return res.status(404).json({ error: 'Check-in session not found' });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({ error: 'Checkup must be in progress to complete' });
    }

    // Ensure this session is assigned to the authenticated doctor
    if (session.assignedDoctor !== req.user.id) {
      return res.status(403).json({ error: 'You can only complete checkups for patients assigned to you' });
    }

    // Update session to completed
    await session.update({
      status: 'completed',
      completedAt: new Date(),
      diagnosis: diagnosis || null,
      prescription: prescription || null,
      doctorNotes: notes || null
    });

    res.json({ 
      message: 'Checkup completed successfully',
      session: {
        id: session.id,
        status: session.status,
        completedAt: session.completedAt,
        patientName: `${session.Patient?.firstName} ${session.Patient?.lastName}`
      }
    });
  } catch (error) {
    console.error('Error completing checkup:', error);
    res.status(500).json({ 
      error: 'Failed to complete checkup',
      message: error.message 
    });
  }
});

// Update queue status (general purpose)
router.patch('/:sessionId/status', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, notes } = req.body;

    const session = await CheckInSession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Check-in session not found' });
    }

    const updateData = { status };
    
    // Add timestamp based on status
    if (status === 'in-progress' && !session.startedAt) {
      updateData.startedAt = new Date();
    } else if (status === 'completed' && !session.completedAt) {
      updateData.completedAt = new Date();
    }

    if (notes) {
      updateData.notes = notes;
    }

    await session.update(updateData);

    res.json({ 
      message: 'Status updated successfully',
      session: {
        id: session.id,
        status: session.status,
        notes: session.notes
      }
    });
  } catch (error) {
    console.error('Error updating queue status:', error);
    res.status(500).json({ 
      error: 'Failed to update status',
      message: error.message 
    });
  }
});

// Get queue statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await CheckInSession.findAll({
      where: {
        checkInTime: {
          [Op.between]: [today, tomorrow]
        },
        doctorNotified: true
      },
      attributes: ['status'],
      raw: true
    });

    const statusCounts = stats.reduce((acc, session) => {
      const status = session.status === 'doctor-notified' ? 'waiting' : session.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total: stats.length,
      waiting: statusCounts.waiting || 0,
      inProgress: statusCounts['in-progress'] || 0,
      completed: statusCounts.completed || 0
    });
  } catch (error) {
    console.error('Error fetching queue stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

module.exports = router;
