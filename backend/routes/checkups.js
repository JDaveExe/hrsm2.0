const express = require('express');
const router = express.Router();
const { CheckInSession, Patient, Appointment } = require('../models');
const { Op, sequelize } = require('sequelize');
const { sequelize: db } = require('../config/database');

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

// Get today's checkups
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkInSessions = await CheckInSession.findAll({
      where: {
        checkInTime: {
          [Op.between]: [today, tomorrow]
        }
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'contactNumber']
        },
        {
          model: Appointment,
          as: 'Appointment',
          required: false,
          attributes: ['serviceType', 'appointmentTime', 'priority']
        }
      ],
      order: [['checkInTime', 'ASC']]
    });

    const checkups = checkInSessions.map(session => ({
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
      serviceType: session.Appointment?.serviceType || session.serviceType || 'General Checkup',
      status: session.status || 'checked-in',
      priority: session.Appointment?.priority || session.priority || 'Normal',
      vitalSignsCollected: !!session.vitalSigns,
      doctorNotified: session.doctorNotified || false,
      notes: session.notes || '',
      checkInMethod: session.checkInMethod || 'staff-assisted',
      vitalSigns: session.vitalSigns ? JSON.parse(session.vitalSigns) : null,
      vitalSignsTime: session.vitalSignsTime,
      notifiedAt: session.notifiedAt
    }));

    res.json(checkups);
  } catch (error) {
    console.error('Error fetching today\'s checkups:', error);
    res.status(500).json({ 
      error: 'Failed to fetch checkups',
      message: error.message 
    });
  }
});

// Record vital signs for a patient
router.post('/:sessionId/vital-signs', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const vitalSigns = req.body;

    const session = await CheckInSession.findByPk(sessionId, {
      include: [{
        model: Patient,
        as: 'Patient'
      }]
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Check-in session not found' });
    }

    // Update session with vital signs
    await session.update({
      vitalSigns: JSON.stringify(vitalSigns),
      vitalSignsTime: new Date(),
      status: 'vitals-recorded'
    });

    // Also save to VitalSigns table for history tracking
    const { VitalSigns } = require('../models');
    await VitalSigns.create({
      patientId: session.patientId,
      sessionId: session.id,
      temperature: vitalSigns.temperature || null,
      temperatureUnit: vitalSigns.temperatureUnit || 'celsius',
      heartRate: vitalSigns.heartRate || null,
      systolicBP: vitalSigns.systolicBP || null,
      diastolicBP: vitalSigns.diastolicBP || null,
      respiratoryRate: vitalSigns.respiratoryRate || null,
      oxygenSaturation: vitalSigns.oxygenSaturation || null,
      weight: vitalSigns.weight || null,
      weightUnit: vitalSigns.weightUnit || 'kg',
      height: vitalSigns.height || null,
      heightUnit: vitalSigns.heightUnit || 'cm',
      clinicalNotes: vitalSigns.clinicalNotes || null,
      recordedAt: vitalSigns.recordedAt || new Date(),
      createdAt: new Date()
    });

    res.json({ 
      message: 'Vital signs recorded successfully',
      session: {
        id: session.id,
        status: session.status,
        vitalSignsTime: session.vitalSignsTime
      }
    });
  } catch (error) {
    console.error('Error recording vital signs:', error);
    res.status(500).json({ 
      error: 'Failed to record vital signs',
      message: error.message 
    });
  }
});

// Get vital signs history for a patient
router.get('/vital-signs/history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { VitalSigns } = require('../models');
    
    console.log('Fetching vital signs history for patient:', patientId);
    
    // Get all vital signs records for this patient, ordered by most recent first
    const vitalSignsHistory = await VitalSigns.findAll({
      where: {
        patientId: patientId
      },
      order: [['recordedAt', 'DESC']],
      limit: 50 // Limit to last 50 records to prevent overwhelming the UI
    });
    
    console.log('Found vital signs records:', vitalSignsHistory.length);
    
    res.json(vitalSignsHistory);
  } catch (error) {
    console.error('Error fetching vital signs history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch vital signs history',
      message: error.message 
    });
  }
});

// Debug endpoint to test database operations
router.post('/debug/test-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    console.log('Debug: Testing session operations for ID:', sessionId);
    
    // Test 1: Simple findByPk without includes
    console.log('Debug: Test 1 - Simple findByPk');
    const session1 = await CheckInSession.findByPk(sessionId);
    console.log('Debug: Session found:', !!session1);
    
    if (!session1) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Test 2: Try to update the session
    console.log('Debug: Test 2 - Update session');
    await session1.update({
      doctorNotified: true,
      notifiedAt: new Date(),
      status: 'doctor-notified'
    });
    console.log('Debug: Session updated successfully');
    
    // Test 3: Get patient separately
    console.log('Debug: Test 3 - Get patient separately');
    const patient = await Patient.findByPk(session1.patientId);
    console.log('Debug: Patient found:', !!patient);
    
    res.json({
      success: true,
      sessionId: session1.id,
      patientId: session1.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
      status: session1.status
    });
    
  } catch (error) {
    console.error('Debug: Error in test-session:', error);
    res.status(500).json({
      error: 'Debug test failed',
      message: error.message,
      stack: error.stack
    });
  }
});

// Notify doctor about a patient
router.post('/:sessionId/notify-doctor', async (req, res) => {
  try {
    const { sessionId } = req.params;

    // First, get the session without includes to avoid association issues
    const session = await CheckInSession.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Check-in session not found' });
    }

    if (!session.vitalSigns) {
      return res.status(400).json({ error: 'Vital signs must be recorded before notifying doctor' });
    }

    // Get patient separately
    const patient = await Patient.findByPk(session.patientId, {
      attributes: ['id', 'firstName', 'lastName', 'contactNumber']
    });

    // Update session to notify doctor
    await session.update({
      doctorNotified: true,
      notifiedAt: new Date(),
      status: 'doctor-notified'
    });

    // Here you could add notification logic (email, SMS, push notification)
    // For now, we'll just log it
    console.log(`Doctor notified about patient: ${patient?.firstName} ${patient?.lastName} (Session ID: ${sessionId})`);

    res.json({ 
      message: 'Doctor notified successfully',
      session: {
        id: session.id,
        status: session.status,
        notifiedAt: session.notifiedAt,
        patientName: `${patient?.firstName} ${patient?.lastName}`
      }
    });
  } catch (error) {
    console.error('Error notifying doctor:', error);
    res.status(500).json({ 
      error: 'Failed to notify doctor',
      message: error.message 
    });
  }
});

// Create a new check-in session (for adding patients manually)
router.post('/check-in', async (req, res) => {
  try {
    const {
      patientId,
      serviceType,
      priority,
      notes,
      checkInMethod = 'staff-assisted'
    } = req.body;

    // Verify patient exists
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Create check-in session
    const session = await CheckInSession.create({
      patientId,
      serviceType,
      priority,
      notes,
      checkInMethod,
      checkInTime: new Date(),
      status: 'checked-in'
    });

    res.status(201).json({
      message: 'Patient checked in successfully',
      session: {
        id: session.id,
        patientId: session.patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        checkInTime: session.checkInTime,
        serviceType: session.serviceType,
        status: session.status
      }
    });
  } catch (error) {
    console.error('Error creating check-in session:', error);
    res.status(500).json({ 
      error: 'Failed to check in patient',
      message: error.message 
    });
  }
});

// Update checkup information (service type, priority, etc.)
router.patch('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { serviceType, priority, notes } = req.body;

    const session = await CheckInSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Check-in session not found' });
    }

    // Update the session fields
    if (serviceType !== undefined) {
      session.serviceType = serviceType;
    }
    if (priority !== undefined) {
      session.priority = priority;
    }
    if (notes !== undefined) {
      session.notes = notes;
    }

    await session.save();

    console.log(`Updated checkup ${sessionId}: serviceType=${serviceType}, priority=${priority}`);

    res.json({ 
      success: true, 
      message: 'Checkup updated successfully',
      session: {
        id: session.id,
        serviceType: session.serviceType,
        priority: session.priority,
        notes: session.notes
      }
    });
  } catch (error) {
    console.error('Error updating checkup:', error);
    res.status(500).json({ error: 'Failed to update checkup', details: error.message });
  }
});

// Update checkup status
router.put('/:sessionId/status', async (req, res) => {
  const transaction = await db.transaction();
  
  try {
    const { sessionId } = req.params;
    const { status, notes, prescriptions } = req.body;

    const session = await CheckInSession.findByPk(sessionId, { transaction });
    if (!session) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Check-in session not found' });
    }

    const updateData = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // If status is being set to 'completed', handle inventory deduction
    if (status === 'completed' && prescriptions && prescriptions.length > 0) {
      console.log(`Processing inventory deduction for completed checkup ${sessionId}`);
      
      // Load the Medication model dynamically
      const MedicationModel = require('../models/Prescription.sequelize');
      const Medication = MedicationModel(db);
      
      // Process each prescription and deduct from inventory
      for (const prescription of prescriptions) {
        if (prescription.medication && prescription.quantity && prescription.quantity > 0) {
          // Find the medication in inventory
          const medication = await Medication.findOne({
            where: { 
              name: prescription.medication 
            },
            transaction
          });
          
          if (!medication) {
            await transaction.rollback();
            return res.status(400).json({ 
              error: `Medication "${prescription.medication}" not found in inventory` 
            });
          }
          
          // Check if there's enough stock
          if (medication.unitsInStock < prescription.quantity) {
            await transaction.rollback();
            return res.status(400).json({ 
              error: `Insufficient stock for "${prescription.medication}". Available: ${medication.unitsInStock}, Required: ${prescription.quantity}` 
            });
          }
          
          // Deduct the quantity from stock
          const newStock = medication.unitsInStock - prescription.quantity;
          await medication.update({ 
            unitsInStock: newStock,
            status: newStock <= medication.minimumStock ? 'Low Stock' : 
                    newStock === 0 ? 'Out of Stock' : 'Available'
          }, { transaction });
          
          console.log(`Deducted ${prescription.quantity} units of "${prescription.medication}" from inventory. New stock: ${newStock}`);
        }
      }
      
      // Update the session with the prescriptions data
      updateData.prescription = JSON.stringify(prescriptions);
      updateData.completedAt = new Date();
    }

    await session.update(updateData, { transaction });
    await transaction.commit();

    res.json({ 
      message: 'Status updated successfully',
      session: {
        id: session.id,
        status: session.status,
        notes: session.notes,
        completedAt: session.completedAt
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating status:', error);
    res.status(500).json({ 
      error: 'Failed to update status',
      message: error.message 
    });
  }
});

// Get checkup statistics for today
router.get('/stats/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await CheckInSession.findAll({
      where: {
        checkInTime: {
          [Op.between]: [today, tomorrow]
        }
      },
      attributes: ['status', 'vitalSigns', 'doctorNotified'],
      raw: true
    });

    const summary = {
      total: stats.length,
      checkedIn: stats.filter(s => s.status === 'checked-in').length,
      vitalsRecorded: stats.filter(s => s.vitalSigns).length,
      doctorNotified: stats.filter(s => s.doctorNotified).length,
      completed: stats.filter(s => s.status === 'completed').length
    };

    res.json(summary);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      message: error.message 
    });
  }
});

// Remove patient from today's checkups
router.delete('/today/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find and delete the check-in session for today
    const deletedCount = await CheckInSession.destroy({
      where: {
        patientId: patientId,
        checkInTime: {
          [Op.between]: [today, tomorrow]
        }
      }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ 
        message: 'Patient not found in today\'s checkups or already removed' 
      });
    }

    res.json({ 
      message: 'Patient successfully removed from today\'s checkups',
      removedCount: deletedCount 
    });

  } catch (error) {
    console.error('Error removing patient from checkups:', error);
    res.status(500).json({ 
      error: 'Failed to remove patient from checkups',
      message: error.message 
    });
  }
});

// Doctor-specific endpoints for checkups management

// Get all checkups assigned to doctor
router.get('/doctor', async (req, res) => {
  try {
    const checkInSessions = await CheckInSession.findAll({
      where: {
        status: {
          [Op.in]: ['started', 'in-progress', 'completed', 'transferred']
        }
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'contactNumber']
        },
        {
          model: Appointment,
          as: 'Appointment',
          required: false,
          attributes: ['serviceType', 'appointmentTime', 'priority']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const checkups = checkInSessions.map(session => {
      const patient = session.Patient;
      const appointment = session.Appointment;
      
      return {
        id: session.id,
        patientId: patient?.patientId || patient?.id,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
        age: patient?.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A',
        gender: patient?.gender || 'N/A',
        contactNumber: patient?.contactNumber || 'N/A',
        serviceType: appointment?.serviceType || session.serviceType || 'General Checkup',
        priority: appointment?.priority || session.priority || 'Normal',
        status: session.status,
        startedAt: session.checkInTime,
        completedAt: session.checkOutTime,
        notes: session.notes || '',
        prescriptions: (() => {
          try {
            return session.prescription ? JSON.parse(session.prescription) : [];
          } catch (e) {
            console.error('Error parsing prescription JSON:', e, 'Raw value:', session.prescription);
            return [];
          }
        })(),
        vitalSigns: session.vitalSigns || null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
    });

    res.json(checkups);
  } catch (error) {
    console.error('Error fetching doctor checkups:', error);
    res.status(500).json({ 
      error: 'Failed to fetch doctor checkups',
      message: error.message 
    });
  }
});

// Create new checkup session for doctor
router.post('/', async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      age,
      gender,
      contactNumber,
      serviceType,
      priority,
      notes
    } = req.body;

    // Find the patient by patientId
    let patient = await Patient.findOne({
      where: { id: patientId }
    });

    if (!patient) {
      console.log(`Patient ${patientId} not found in database, creating checkup session with provided data`);
    }

    // Check if there's already an existing session for this patient today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let existingSession = await CheckInSession.findOne({
      where: {
        patientId: patient ? patient.id : patientId,
        checkInTime: {
          [Op.between]: [today, tomorrow]
        },
        status: {
          [Op.in]: ['checked-in', 'vitals-recorded', 'doctor-notified']
        }
      }
    });

    let checkupSession;

    if (existingSession) {
      // Update existing session instead of creating a new one
      console.log(`Updating existing session ${existingSession.id} for patient ${patientId}`);
      await existingSession.update({
        status: 'started',
        startedAt: new Date(),
        serviceType: serviceType || existingSession.serviceType || 'General Checkup',
        priority: priority || existingSession.priority || 'Normal',
        notes: notes || existingSession.notes || '',
        doctorNotified: true
      });
      checkupSession = existingSession;
    } else {
      // Create new session if none exists
      console.log(`Creating new checkup session for patient ${patientId}`);
      checkupSession = await CheckInSession.create({
        patientId: patient ? patient.id : null,
        checkInTime: new Date(),
        status: 'started',
        serviceType: serviceType || 'General Checkup',
        priority: priority || 'Normal',
        notes: notes || '',
        doctorNotified: true,
        // Store additional patient info if patient record doesn't exist
        additionalData: patient ? null : {
          patientId,
          patientName,
          age,
          gender,
          contactNumber
        }
      });
    }

    // Return the created session with formatted data
    const formattedSession = {
      id: checkupSession.id,
      patientId: patientId,
      patientName: patientName,
      age: age,
      gender: gender,
      contactNumber: contactNumber,
      serviceType: checkupSession.serviceType,
      priority: checkupSession.priority,
      status: checkupSession.status,
      startedAt: checkupSession.checkInTime,
      completedAt: null,
      notes: checkupSession.notes,
      vitalSigns: null,
      createdAt: checkupSession.createdAt,
      updatedAt: checkupSession.updatedAt
    };

    console.log('Checkup session created successfully:', formattedSession);
    res.status(201).json(formattedSession);
  } catch (error) {
    console.error('Error creating checkup session:', error);
    res.status(500).json({ 
      error: 'Failed to create checkup session',
      message: error.message 
    });
  }
});

// Get doctor's checkups (all statuses for the checkups tab)
router.get('/doctor', async (req, res) => {
  try {
    console.log('Getting doctor checkups...');
    
    const checkInSessions = await CheckInSession.findAll({
      where: {
        status: {
          [Op.in]: ['started', 'in-progress', 'completed']
        }
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'contactNumber', 'familyId']
        },
        {
          model: Appointment,
          as: 'Appointment',
          required: false,
          attributes: ['serviceType', 'appointmentTime', 'priority']
        }
      ],
      order: [['checkInTime', 'DESC']]
    });

    const checkups = checkInSessions.map(session => {
      const patient = session.Patient;
      const appointment = session.Appointment;
      
      const patientId = patient?.id || session.patientId;
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : session.patientName || 'Unknown Patient';
      const age = patient?.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A';
      const gender = patient?.gender || 'N/A';
      const contactNumber = patient?.contactNumber || 'N/A';
      const familyId = patient?.familyId || 'N/A';

      return {
        id: session.id,
        patientId: patientId,
        patientName: patientName,
        age: age,
        gender: gender,
        contactNumber: contactNumber,
        familyId: familyId,
        serviceType: appointment?.serviceType || session.serviceType || 'General Checkup',
        priority: appointment?.priority || session.priority || 'Normal',
        status: session.status,
        startedAt: session.checkInTime,
        completedAt: session.completedAt,
        notes: session.notes || '',
        prescriptions: session.prescriptions || [],
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
    });

    console.log(`Found ${checkups.length} doctor checkups`);
    res.json(checkups);
  } catch (error) {
    console.error('Error fetching doctor checkups:', error);
    res.status(500).json({ 
      error: 'Failed to fetch doctor checkups',
      message: error.message 
    });
  }
});

// Update checkup notes and prescriptions
router.patch('/:sessionId/notes', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes, prescriptions } = req.body;

    console.log('Updating checkup notes:', { sessionId, notes, prescriptions });

    const session = await CheckInSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Checkup session not found' });
    }

    // Update notes and prescriptions
    await session.update({
      notes: notes || session.notes,
      prescription: prescriptions ? JSON.stringify(prescriptions) : session.prescription,
      updatedAt: new Date()
    });

    // Get updated session with patient info
    const updatedSession = await CheckInSession.findByPk(sessionId, {
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'contactNumber', 'familyId']
        },
        {
          model: Appointment,
          as: 'Appointment',
          required: false,
          attributes: ['serviceType', 'appointmentTime', 'priority']
        }
      ]
    });

    const patient = updatedSession.Patient;
    const appointment = updatedSession.Appointment;
    
    const result = {
      id: updatedSession.id,
      patientId: patient?.id || updatedSession.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : updatedSession.patientName || 'Unknown Patient',
      age: patient?.dateOfBirth ? calculateAge(patient.dateOfBirth) : 'N/A',
      gender: patient?.gender || 'N/A',
      contactNumber: patient?.contactNumber || 'N/A',
      familyId: patient?.familyId || 'N/A',
      serviceType: appointment?.serviceType || updatedSession.serviceType || 'General Checkup',
      priority: appointment?.priority || updatedSession.priority || 'Normal',
      status: updatedSession.status,
      startedAt: updatedSession.checkInTime,
      completedAt: updatedSession.completedAt,
      notes: updatedSession.notes || '',
      prescriptions: (() => {
        try {
          return updatedSession.prescription ? JSON.parse(updatedSession.prescription) : [];
        } catch (e) {
          console.error('Error parsing prescription JSON:', e, 'Raw value:', updatedSession.prescription);
          return [];
        }
      })(),
      createdAt: updatedSession.createdAt,
      updatedAt: updatedSession.updatedAt
    };

    console.log('Checkup notes updated successfully:', result);
    res.json(result);
  } catch (error) {
    console.error('Error updating checkup notes:', error);
    res.status(500).json({ 
      error: 'Failed to update checkup notes',
      message: error.message 
    });
  }
});

// Get patient checkup history
router.get('/history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Getting checkup history for patient:', patientId);

    const checkupHistory = await CheckInSession.findAll({
      where: {
        patientId: patientId,
        status: {
          [Op.in]: ['completed', 'finished']
        }
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'contactNumber', 'familyId']
        },
        {
          model: Appointment,
          as: 'Appointment',
          required: false,
          attributes: ['serviceType', 'appointmentTime', 'priority']
        }
      ],
      order: [['completedAt', 'DESC']]
    });

    const history = checkupHistory.map(session => {
      const patient = session.Patient;
      const appointment = session.Appointment;
      
      return {
        id: session.id,
        patientId: session.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : session.patientName || 'Unknown Patient',
        serviceType: appointment?.serviceType || session.serviceType || 'General Checkup',
        priority: appointment?.priority || session.priority || 'Normal',
        status: session.status,
        startedAt: session.checkInTime,
        completedAt: session.completedAt,
        notes: session.notes || '',
        prescriptions: session.prescriptions || [],
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      };
    });

    console.log(`Found ${history.length} checkup history records for patient ${patientId}`);
    res.json(history);
  } catch (error) {
    console.error('Error fetching checkup history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch checkup history',
      message: error.message 
    });
  }
});

module.exports = router;
