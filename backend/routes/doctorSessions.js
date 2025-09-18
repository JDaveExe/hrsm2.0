const express = require('express');
const router = express.Router();
const { DoctorSession, User } = require('../models');
const { Op } = require('sequelize');

// Get all doctors with their availability status
router.get('/all', async (req, res) => {
  try {
    // Get all active doctors
    const allDoctors = await User.findAll({
      where: {
        role: 'doctor',
        isActive: true
      },
      attributes: ['id', 'firstName', 'lastName', 'username', 'email', 'position'],
      order: [['firstName', 'ASC']]
    });

    // Get their session statuses
    const activeSessions = await DoctorSession.findAll({
      where: {
        status: ['online', 'busy']
      },
      attributes: ['doctorId', 'status', 'loginTime', 'lastActivity', 'currentPatientId']
    });

    // Create session lookup map
    const sessionMap = {};
    activeSessions.forEach(session => {
      sessionMap[session.doctorId] = session;
    });

    // Map all doctors with their status
    const doctorsWithStatus = allDoctors.map(doctor => {
      const session = sessionMap[doctor.id];
      return {
        id: doctor.id,
        name: `${doctor.firstName} ${doctor.lastName}`,
        username: doctor.username,
        email: doctor.email,
        position: doctor.position,
        status: session ? session.status : 'offline',
        loginTime: session?.loginTime || null,
        lastActivity: session?.lastActivity || null,
        currentPatientId: session?.currentPatientId || null,
        isAvailable: session?.status === 'online',
        isBusy: session?.status === 'busy',
        isOffline: !session || session.status === 'offline'
      };
    });

    res.json(doctorsWithStatus);
  } catch (error) {
    console.error('Error fetching all doctors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch all doctors',
      message: error.message 
    });
  }
});

// Get all online doctors (backwards compatibility)
router.get('/online', async (req, res) => {
  try {
    const onlineDoctors = await DoctorSession.findAll({
      where: {
        status: ['online', 'busy']
      },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'username', 'email', 'position'],
          where: {
            role: 'doctor',
            isActive: true
          }
        }
      ],
      order: [['loginTime', 'DESC']]
    });

    const doctorsWithStatus = onlineDoctors.map(session => ({
      id: session.doctor.id,
      name: `${session.doctor.firstName} ${session.doctor.lastName}`,
      username: session.doctor.username,
      email: session.doctor.email,
      position: session.doctor.position,
      status: session.status,
      loginTime: session.loginTime,
      lastActivity: session.lastActivity,
      currentPatientId: session.currentPatientId,
      isAvailable: session.status === 'online',
      isBusy: session.status === 'busy'
    }));

    res.json(doctorsWithStatus);
  } catch (error) {
    console.error('Error fetching online doctors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch online doctors',
      message: error.message 
    });
  }
});

// Update doctor status when logging in
router.post('/login', async (req, res) => {
  try {
    const { doctorId, sessionToken } = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    // End any existing active sessions for this doctor
    await DoctorSession.update(
      { 
        status: 'offline',
        logoutTime: new Date()
      },
      {
        where: {
          doctorId,
          status: ['online', 'busy']
        }
      }
    );

    // Create new active session
    const newSession = await DoctorSession.create({
      doctorId,
      status: 'online',
      loginTime: new Date(),
      lastActivity: new Date(),
      sessionToken: sessionToken || null
    });

    res.json({ 
      message: 'Doctor logged in successfully',
      session: {
        id: newSession.id,
        status: newSession.status,
        loginTime: newSession.loginTime
      }
    });
  } catch (error) {
    console.error('Error logging in doctor:', error);
    res.status(500).json({ 
      error: 'Failed to log in doctor',
      message: error.message 
    });
  }
});

// Update doctor status when logging out
router.post('/logout', async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    // Update all active sessions to offline
    const updatedCount = await DoctorSession.update(
      { 
        status: 'offline',
        logoutTime: new Date(),
        currentPatientId: null
      },
      {
        where: {
          doctorId,
          status: ['online', 'busy']
        }
      }
    );

    res.json({ 
      message: 'Doctor logged out successfully',
      updatedSessions: updatedCount[0]
    });
  } catch (error) {
    console.error('Error logging out doctor:', error);
    res.status(500).json({ 
      error: 'Failed to log out doctor',
      message: error.message 
    });
  }
});

// Update doctor status (online/busy)
router.patch('/status', async (req, res) => {
  try {
    const { doctorId, status, patientId } = req.body;

    if (!doctorId || !status) {
      return res.status(400).json({ error: 'Doctor ID and status are required' });
    }

    if (!['online', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status,
      lastActivity: new Date()
    };

    if (status === 'busy' && patientId) {
      updateData.currentPatientId = patientId;
    } else if (status === 'online') {
      updateData.currentPatientId = null;
    }

    const [updatedCount] = await DoctorSession.update(updateData, {
      where: {
        doctorId,
        status: ['online', 'busy'] // Only update if currently active
      }
    });

    if (updatedCount === 0) {
      return res.status(404).json({ error: 'No active session found for doctor' });
    }

    res.json({ 
      message: 'Doctor status updated successfully',
      status,
      patientId: patientId || null
    });
  } catch (error) {
    console.error('Error updating doctor status:', error);
    res.status(500).json({ 
      error: 'Failed to update doctor status',
      message: error.message 
    });
  }
});

// Get specific doctor's current status
router.get('/status/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    const session = await DoctorSession.findOne({
      where: {
        doctorId,
        status: ['online', 'busy']
      },
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'username', 'position']
        }
      ],
      order: [['loginTime', 'DESC']]
    });

    if (!session) {
      return res.json({ 
        status: 'offline',
        isOnline: false,
        isBusy: false,
        isAvailable: false
      });
    }

    res.json({
      doctorId: session.doctorId,
      doctorName: `${session.doctor.firstName} ${session.doctor.lastName}`,
      status: session.status,
      isOnline: ['online', 'busy'].includes(session.status),
      isBusy: session.status === 'busy',
      isAvailable: session.status === 'online',
      loginTime: session.loginTime,
      lastActivity: session.lastActivity,
      currentPatientId: session.currentPatientId
    });
  } catch (error) {
    console.error('Error fetching doctor status:', error);
    res.status(500).json({ 
      error: 'Failed to fetch doctor status',
      message: error.message 
    });
  }
});

// Update last activity (heartbeat)
router.post('/heartbeat', async (req, res) => {
  try {
    const { doctorId } = req.body;

    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    const [updatedCount] = await DoctorSession.update(
      { lastActivity: new Date() },
      {
        where: {
          doctorId,
          status: ['online', 'busy']
        }
      }
    );

    res.json({ 
      message: 'Heartbeat updated',
      active: updatedCount > 0
    });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    res.status(500).json({ 
      error: 'Failed to update heartbeat',
      message: error.message 
    });
  }
});

module.exports = router;