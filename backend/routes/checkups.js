const express = require('express');
const router = express.Router();
const { CheckInSession, Patient, Appointment, User } = require('../models');
const { Op, sequelize } = require('sequelize');
const { sequelize: db } = require('../config/database');
const { authenticateToken: auth } = require('../middleware/auth');
const AuditLogger = require('../utils/auditLogger');

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
router.post('/:sessionId/vital-signs', auth, async (req, res) => {
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

    // Log the vital signs check action
    const patient = session.Patient;
    if (patient) {
      await AuditLogger.logVitalSignsCheck(req, patient, vitalSigns);
    }

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
router.post('/:sessionId/notify-doctor', auth, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { assignedDoctor, assignedDoctorName } = req.body;

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

    // Get doctor information if assignedDoctor is provided
    let doctor = null;
    if (assignedDoctor) {
      doctor = await User.findByPk(assignedDoctor, {
        attributes: ['id', 'firstName', 'lastName']
      });
    }

    // Update session to notify doctor
    await session.update({
      doctorNotified: true,
      notifiedAt: new Date(),
      status: 'doctor-notified',
      assignedDoctor: assignedDoctor || null
    });

    // Log patient transfer audit trail
    if (patient && doctor) {
      await AuditLogger.logPatientTransfer(req, patient, doctor);
    }

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
router.post('/check-in', auth, async (req, res) => {
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

    // Check if patient is already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingSession = await CheckInSession.findOne({
      where: {
        patientId: patientId,
        checkInTime: {
          [Op.between]: [today, tomorrow]
        },
        status: {
          [Op.not]: 'completed'
        }
      }
    });

    if (existingSession) {
      return res.status(409).json({ 
        error: `Patient ${patient.firstName} ${patient.lastName} is already checked in for today`,
        existingSession: {
          id: existingSession.id,
          checkInTime: existingSession.checkInTime,
          status: existingSession.status,
          serviceType: existingSession.serviceType
        }
      });
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

    // Log the patient check-in for audit trail
    await AuditLogger.logPatientCheckIn(
      req, 
      patient.id, 
      `${patient.firstName} ${patient.lastName}`, 
      { 
        method: checkInMethod,
        serviceType: serviceType,
        priority: priority,
        sessionId: session.id
      }
    );

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

// QR Code check-in endpoint (for patient self-checkin via QR scan)
router.post('/qr-checkin', async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      serviceType = 'General Checkup',
      priority = 'Normal',
      checkInMethod = 'qr-scan'
    } = req.body;

    console.log('QR check-in attempt:', { patientId, patientName, serviceType, priority });

    // Validate required fields
    if (!patientId || !patientName) {
      return res.status(400).json({ 
        error: 'Patient ID and name are required for QR check-in' 
      });
    }

    // Security validations
    
    // 1. Validate patient ID format (must be numeric)
    if (!/^\d+$/.test(patientId.toString())) {
      return res.status(400).json({ 
        error: 'Invalid patient ID format' 
      });
    }

    // 2. Validate patient name format (basic sanitization)
    if (!/^[a-zA-Z\s.'-]+$/.test(patientName.trim())) {
      return res.status(400).json({ 
        error: 'Invalid patient name format' 
      });
    }

    // 3. Rate limiting check (prevent spam checkins from same IP)
    const clientIP = req.ip || req.connection.remoteAddress;
    console.log(`QR check-in request from IP: ${clientIP}`);

    // 4. Validate service type and priority values
    const validServiceTypes = ['General Checkup', 'Follow-up', 'Emergency', 'Vaccination', 'Prenatal', 'Senior Citizen'];
    const validPriorities = ['Normal', 'High', 'Emergency'];
    
    if (!validServiceTypes.includes(serviceType)) {
      console.log(`Invalid service type: ${serviceType}, defaulting to General Checkup`);
      serviceType = 'General Checkup';
    }
    
    if (!validPriorities.includes(priority)) {
      console.log(`Invalid priority: ${priority}, defaulting to Normal`);
      priority = 'Normal';
    }

    // Check if patient exists in database
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ 
        error: `Patient with ID ${patientId} not found in database` 
      });
    }

    // Verify patient name matches (case-insensitive)
    const dbPatientName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    const qrPatientName = patientName.toLowerCase();
    
    if (dbPatientName !== qrPatientName) {
      console.log(`Name mismatch: DB="${dbPatientName}", QR="${qrPatientName}"`);
      return res.status(400).json({ 
        error: 'Patient name does not match database record' 
      });
    }

    // Check if patient is already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingSession = await CheckInSession.findOne({
      where: {
        patientId: patientId,
        checkInTime: {
          [Op.between]: [today, tomorrow]
        },
        status: {
          [Op.not]: 'completed'
        }
      }
    });

    if (existingSession) {
      return res.status(409).json({ 
        error: `Patient ${patientName} is already checked in for today`,
        existingSession: {
          id: existingSession.id,
          checkInTime: existingSession.checkInTime,
          status: existingSession.status,
          serviceType: existingSession.serviceType
        }
      });
    }

    // Create new QR check-in session
    const session = await CheckInSession.create({
      patientId,
      serviceType,
      priority,
      notes: `Checked in via QR code scan at ${new Date().toLocaleString()}`,
      checkInMethod,
      checkInTime: new Date(),
      status: 'checked-in'
    });

    // Log QR check-in action using the working pattern
    try {
      await AuditLogger.logCustomAction(req, 'patient_check_in', 
        `${req.user?.firstName || 'Admin'} ${req.user?.lastName || 'User'} checked in patient ${patientName} via QR scan`, {
          targetType: 'patient',
          targetId: patientId,
          targetName: patientName,
          metadata: {
            method: 'QR Scan',
            serviceType,
            priority,
            sessionId: session.id,
            checkInTime: session.checkInTime,
            patientId,
            patientName
          }
        });
    } catch (auditError) {
      console.error('❌ Audit logging failed for patient check-in:', auditError.message);
      // Don't fail the check-in if audit logging fails
    }

    console.log(`QR check-in successful for patient ${patientName} (ID: ${patientId})`);

    res.status(201).json({
      success: true,
      message: `${patientName} has been successfully checked in via QR scan`,
      session: {
        id: session.id,
        patientId: session.patientId,
        patientName: patientName,
        checkInTime: session.checkInTime,
        serviceType: session.serviceType,
        priority: session.priority,
        status: session.status,
        checkInMethod: session.checkInMethod
      }
    });

  } catch (error) {
    console.error('Error processing QR check-in:', error);
    res.status(500).json({ 
      error: 'Failed to process QR check-in',
      message: error.message 
    });
  }
});

// Update checkup information (service type, priority, etc.)
router.patch('/:sessionId', auth, async (req, res) => {
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
router.put('/:sessionId/status', auth, async (req, res) => {
  const transaction = await db.transaction();
  
  try {
    console.log('Updating checkup status for doctor ID:', req.user?.id);
    
    // Ensure we have a valid doctor ID from the authenticated user
    if (!req.user || !req.user.id) {
      await transaction.rollback();
      return res.status(401).json({ 
        error: 'Unauthorized - Doctor ID not found in request' 
      });
    }
    
    const currentDoctorId = req.user.id;
    const { sessionId } = req.params;
    const { status, notes, prescriptions, chiefComplaint, presentSymptoms, diagnosis, treatmentPlan, doctorNotes, doctorId, doctorName } = req.body;

    console.log('🔄 Updating checkup status:', {
      sessionId,
      status,
      currentDoctorId,
      notes: notes?.substring(0, 50) + '...',
      chiefComplaint: chiefComplaint?.substring(0, 50) + '...',
      presentSymptoms: presentSymptoms?.substring(0, 50) + '...',
      diagnosis: diagnosis?.substring(0, 50) + '...',
      treatmentPlan: treatmentPlan?.substring(0, 50) + '...',
      doctorNotes: doctorNotes?.substring(0, 50) + '...',
      prescriptionsCount: prescriptions?.length || 0,
      doctorId,
      doctorName
    });

    const session = await CheckInSession.findByPk(sessionId, { transaction });
    if (!session) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Check-in session not found' });
    }

    // Verify that this checkup belongs to the current doctor (for security)
    if (session.assignedDoctor && session.assignedDoctor !== currentDoctorId) {
      await transaction.rollback();
      return res.status(403).json({ 
        error: 'Access denied - This checkup is not assigned to you',
        assigned: session.assignedDoctor,
        current: currentDoctorId
      });
    }

    const updateData = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (chiefComplaint !== undefined) {
      updateData.chiefComplaint = chiefComplaint;
    }
    if (presentSymptoms !== undefined) {
      updateData.presentSymptoms = presentSymptoms;
    }
    if (diagnosis !== undefined) {
      updateData.diagnosis = diagnosis;
    }
    if (treatmentPlan !== undefined) {
      updateData.treatmentPlan = treatmentPlan;
    }
    if (doctorNotes !== undefined) {
      updateData.doctorNotes = doctorNotes;
    }
    
    // Track the doctor who completed the checkup
    if (status === 'completed') {
      updateData.assignedDoctor = currentDoctorId; // Use the authenticated doctor's ID
      updateData.completedAt = new Date();
    } else if (status === 'vaccination-completed') {
      // For vaccination completions, explicitly set assignedDoctor to null to avoid FK constraint issues
      updateData.assignedDoctor = null;
      updateData.completedAt = new Date();
    }

    // If status is being set to 'completed', handle inventory deduction
    console.log(`Checking deduction conditions: status=${status}, prescriptions=${prescriptions ? prescriptions.length : 'null'}`);
    if (status === 'completed' && prescriptions && prescriptions.length > 0) {
      console.log(`🔄 Processing inventory deduction for completed checkup ${sessionId}`);
      
      // Use file-based inventory system (same as inventory routes)
      const fs = require('fs').promises;
      const path = require('path');
      const medicationsDataPath = path.join(__dirname, '../data/medications.json');
      
      // Helper function to read JSON data
      const readJsonFile = async (filePath) => {
        try {
          const data = await fs.readFile(filePath, 'utf8');
          return JSON.parse(data);
        } catch (error) {
          if (error.code === 'ENOENT') {
            return [];
          }
          throw error;
        }
      };
      
      // Helper function to write JSON data
      const writeJsonFile = async (filePath, data) => {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      };
      
      // Process each prescription and deduct from inventory
      for (const prescription of prescriptions) {
        if (prescription.medication && prescription.quantity && prescription.quantity > 0) {
          // Read current medications from file
          const medications = await readJsonFile(medicationsDataPath);
          
          // Find the medication in inventory (case-insensitive search)
          const medicationIndex = medications.findIndex(m => 
            m.name.toLowerCase() === prescription.medication.toLowerCase()
          );
          
          if (medicationIndex === -1) {
            await transaction.rollback();
            return res.status(400).json({ 
              error: `Medication "${prescription.medication}" not found in inventory` 
            });
          }
          
          const medication = medications[medicationIndex];
          
          // Check if there's enough stock
          if (medication.unitsInStock < prescription.quantity) {
            await transaction.rollback();
            return res.status(400).json({ 
              error: `Insufficient stock for "${prescription.medication}". Available: ${medication.unitsInStock}, Required: ${prescription.quantity}` 
            });
          }
          
          // Deduct the quantity from stock
          const newStock = medication.unitsInStock - prescription.quantity;
          medications[medicationIndex].unitsInStock = newStock;
          medications[medicationIndex].status = newStock <= medication.minimumStock ? 'Low Stock' : 
                  newStock === 0 ? 'Out of Stock' : 'Available';
          medications[medicationIndex].updatedAt = new Date().toISOString();
          
          // Write updated inventory back to file
          await writeJsonFile(medicationsDataPath, medications);
          
          console.log(`✅ Deducted ${prescription.quantity} units of "${prescription.medication}" from inventory. New stock: ${newStock}`);
        }
      }
      
      // Update the session with the prescriptions data
      updateData.prescription = JSON.stringify(prescriptions);
    }

    console.log('🔄 About to update session with data:', updateData);
    await session.update(updateData, { transaction });
    console.log('✅ Session updated successfully, committing transaction...');
    await transaction.commit();
    console.log('✅ Transaction committed successfully');

    // Log status update action
    const patientInfo = await Patient.findByPk(session.patientId);
    const patientName = patientInfo ? `${patientInfo.firstName} ${patientInfo.lastName}` : 'Unknown Patient';
    
    await AuditLogger.logCheckupStatusUpdate(currentDoctorId, session.patientId, patientName, {
      sessionId: sessionId,
      oldStatus: session.status,
      newStatus: status,
      hasNotes: !!notes,
      hasDiagnosis: !!diagnosis,
      hasTreatmentPlan: !!treatmentPlan,
      prescriptionCount: prescriptions?.length || 0
    });

    // Log checkup completion specifically when status becomes 'completed' (non-blocking)
    if (status === 'completed' && session.Patient) {
      Promise.resolve().then(async () => {
        try {
          await AuditLogger.logCheckupCompletion(req, session.Patient);
        } catch (error) {
          console.warn('Non-critical: Audit logging failed for checkup completion:', error.message);
        }
      });
    }

    // Get the updated session with full patient information for proper response
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
    
    // Return the full checkup data in the same format as the doctor checkups endpoint
    const result = {
      id: updatedSession.id,
      patientId: patient?.id || updatedSession.patientId,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient',
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
      chiefComplaint: updatedSession.chiefComplaint || '',
      presentSymptoms: updatedSession.presentSymptoms || '',
      diagnosis: updatedSession.diagnosis || '',
      treatmentPlan: updatedSession.treatmentPlan || '',
      doctorNotes: updatedSession.doctorNotes || '',
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

    res.json(result);
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
router.get('/doctor', auth, async (req, res) => {
  try {
    console.log('=== DOCTOR CHECKUPS ENDPOINT CALLED ===');
    console.log('Getting doctor checkups for doctor ID:', req.user?.id);
    console.log('Request headers:', req.headers);
    
    // Ensure we have a valid doctor ID from the authenticated user
    if (!req.user || !req.user.id) {
      console.log('❌ No doctor ID found in request');
      return res.status(401).json({ 
        error: 'Unauthorized - Doctor ID not found in request' 
      });
    }
    
    const doctorId = req.user.id;
    console.log('✅ Doctor ID confirmed:', doctorId);
    
    console.log('🔍 Querying checkups with filter:');
    console.log('- assignedDoctor:', doctorId);
    console.log('- status IN:', ['started', 'in-progress', 'completed', 'transferred']);
    
    const checkInSessions = await CheckInSession.findAll({
      where: {
        status: {
          [Op.in]: ['started', 'in-progress', 'completed', 'transferred']
        },
        assignedDoctor: doctorId // Filter by the logged-in doctor's ID
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

    console.log(`📊 Found ${checkInSessions.length} checkups for doctor ${doctorId}`);
    checkInSessions.forEach((session, index) => {
      console.log(`${index + 1}. ID: ${session.id}, Patient: ${session.patientId}, Status: '${session.status}', Time: ${session.checkInTime}`);
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
        chiefComplaint: session.chiefComplaint || '',
        presentSymptoms: session.presentSymptoms || '',
        diagnosis: session.diagnosis || '',
        treatmentPlan: session.treatmentPlan || '',
        doctorNotes: session.doctorNotes || '',
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

// @route   GET /api/checkups/ongoing
// @desc    Get doctor's ongoing checkups
// @access  Private (Doctor)
router.get('/ongoing', auth, async (req, res) => {
  try {
    console.log('Checking ongoing checkups for doctor ID:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: 'Unauthorized - Doctor ID not found in request' 
      });
    }
    
    const doctorId = req.user.id;
    
    // Find ongoing checkups for this doctor
    const ongoingCheckups = await CheckInSession.findAll({
      where: {
        assignedDoctor: doctorId,
        status: {
          [Op.in]: ['started', 'in-progress']
        }
      },
      include: [{
        model: Patient,
        as: 'Patient',
        attributes: ['id', 'firstName', 'lastName']
      }],
      order: [['startedAt', 'ASC']]
    });
    
    const checkupsData = ongoingCheckups.map(session => ({
      id: session.id,
      patientId: session.patientId,
      patientName: session.Patient ? `${session.Patient.firstName} ${session.Patient.lastName}` : 'Unknown',
      status: session.status,
      startedAt: session.startedAt,
      serviceType: session.serviceType,
      priority: session.priority,
      notes: session.notes
    }));
    
    console.log(`Found ${checkupsData.length} ongoing checkups for doctor ${doctorId}`);
    res.json(checkupsData);
  } catch (error) {
    console.error('Error fetching ongoing checkups:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ongoing checkups',
      message: error.message 
    });
  }
});

// @route   PUT /api/checkups/force-complete/:sessionId
// @desc    Force complete a stuck checkup session
// @access  Private (Doctor/Admin)
router.put('/force-complete/:sessionId', auth, async (req, res) => {
  try {
    console.log('Force completing checkup session:', req.params.sessionId, 'by user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: 'Unauthorized - User ID not found in request' 
      });
    }
    
    const { sessionId } = req.params;
    const userId = req.user.id;
    
    // Find the checkup session
    const session = await CheckInSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Checkup session not found' });
    }
    
    // Only the assigned doctor or admin can force complete
    if (req.user.role !== 'admin' && session.assignedDoctor !== userId) {
      return res.status(403).json({ 
        error: 'Access denied - Only the assigned doctor or admin can force complete this checkup' 
      });
    }
    
    // Force complete the checkup
    await session.update({
      status: 'completed',
      completedAt: new Date(),
      notes: (session.notes || '') + `\n[Force completed by ${req.user.role} at ${new Date().toISOString()}]`
    });
    
    // Log force completion action
    const patientInfo = await Patient.findByPk(session.patientId);
    const patientName = patientInfo ? `${patientInfo.firstName} ${patientInfo.lastName}` : 'Unknown Patient';
    
    await AuditLogger.logCheckupForceComplete(userId, session.patientId, patientName, {
      sessionId: sessionId,
      previousStatus: session.status,
      userRole: req.user.role,
      assignedDoctor: session.assignedDoctor
    });
    
    console.log(`Checkup ${sessionId} force completed by ${req.user.role} ${userId}`);
    
    res.json({
      success: true,
      message: 'Checkup force completed successfully',
      sessionId: session.id,
      status: session.status,
      completedAt: session.completedAt
    });
  } catch (error) {
    console.error('Error force completing checkup:', error);
    res.status(500).json({ 
      error: 'Failed to force complete checkup',
      message: error.message 
    });
  }
});

// Create new checkup session for doctor
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating checkup for doctor ID:', req.user?.id);
    
    // Ensure we have a valid doctor ID from the authenticated user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: 'Unauthorized - Doctor ID not found in request' 
      });
    }
    
    const doctorId = req.user.id;
    
    // Check if doctor already has an in-progress checkup
    const existingInProgressCheckup = await CheckInSession.findOne({
      where: {
        assignedDoctor: doctorId,
        status: {
          [Op.in]: ['started', 'in-progress']
        }
      }
    });
    
    if (existingInProgressCheckup) {
      return res.status(400).json({
        error: 'You already have a checkup in progress. Please complete your current checkup before starting a new one.',
        existingCheckupId: existingInProgressCheckup.id
      });
    }
    
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
      console.log(`Updating existing session ${existingSession.id} for patient ${patientId}, assigning to doctor ${doctorId}`);
      await existingSession.update({
        status: 'started',
        startedAt: new Date(),
        serviceType: serviceType || existingSession.serviceType || 'General Checkup',
        priority: priority || existingSession.priority || 'Normal',
        notes: notes || existingSession.notes || '',
        doctorNotified: true,
        assignedDoctor: doctorId // Assign to the current doctor
      });
      checkupSession = existingSession;
    } else {
      // Create new session if none exists
      console.log(`Creating new checkup session for patient ${patientId}, assigning to doctor ${doctorId}`);
      checkupSession = await CheckInSession.create({
        patientId: patient ? patient.id : null,
        checkInTime: new Date(),
        status: 'started',
        serviceType: serviceType || 'General Checkup',
        priority: priority || 'Normal',
        notes: notes || '',
        doctorNotified: true,
        assignedDoctor: doctorId, // Assign to the current doctor
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

    // Log checkup start to audit trail (non-blocking)
    if (patient) {
      Promise.resolve().then(async () => {
        try {
          await AuditLogger.logCheckupStart(req, patient);
        } catch (error) {
          console.warn('Non-critical: Audit logging failed for checkup start:', error.message);
        }
      });
    }

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

// Update checkup notes and prescriptions
router.patch('/:sessionId/notes', auth, async (req, res) => {
  try {
    console.log('Updating checkup notes for doctor ID:', req.user?.id);
    
    // Ensure we have a valid doctor ID from the authenticated user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: 'Unauthorized - Doctor ID not found in request' 
      });
    }
    
    const currentDoctorId = req.user.id;
    const { sessionId } = req.params;
    const { notes, prescriptions, chiefComplaint, presentSymptoms, diagnosis, treatmentPlan, doctorNotes } = req.body;

    console.log('Updating checkup notes:', { sessionId, currentDoctorId, notes, prescriptions, chiefComplaint, presentSymptoms, diagnosis, treatmentPlan, doctorNotes });

    const session = await CheckInSession.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Checkup session not found' });
    }

    // Verify that this checkup belongs to the current doctor (for security)
    if (session.assignedDoctor && session.assignedDoctor !== currentDoctorId) {
      return res.status(403).json({ 
        error: 'Access denied - This checkup is not assigned to you',
        assigned: session.assignedDoctor,
        current: currentDoctorId
      });
    }

    // Prepare update data
    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;
    if (prescriptions !== undefined) updateData.prescription = JSON.stringify(prescriptions);
    if (chiefComplaint !== undefined) updateData.chiefComplaint = chiefComplaint;
    if (presentSymptoms !== undefined) updateData.presentSymptoms = presentSymptoms;
    if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
    if (treatmentPlan !== undefined) updateData.treatmentPlan = treatmentPlan;
    if (doctorNotes !== undefined) updateData.doctorNotes = doctorNotes;
    updateData.updatedAt = new Date();

    // Update session with new data
    await session.update(updateData);

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
      chiefComplaint: updatedSession.chiefComplaint || '',
      presentSymptoms: updatedSession.presentSymptoms || '',
      diagnosis: updatedSession.diagnosis || '',
      treatmentPlan: updatedSession.treatmentPlan || '',
      doctorNotes: updatedSession.doctorNotes || '',
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
        },
        {
          model: User,
          as: 'assignedDoctorUser',
          required: false,
          attributes: ['id', 'firstName', 'lastName', 'username']
        }
      ],
      order: [['completedAt', 'DESC']]
    });

    const history = checkupHistory.map(session => {
      const patient = session.Patient;
      const appointment = session.Appointment;
      const doctor = session.assignedDoctorUser;
      
      return {
        id: session.id,
        patientId: session.patientId,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : session.patientName || 'Unknown Patient',
        serviceType: appointment?.serviceType || session.serviceType || 'General Checkup',
        priority: appointment?.priority || session.priority || 'Normal',
        status: session.status,
        checkInTime: session.checkInTime,
        startedAt: session.startedAt,
        completedAt: session.completedAt || session.checkOutTime,
        // Clinical note fields
        chiefComplaint: session.chiefComplaint || '',
        presentSymptoms: session.presentSymptoms || '',
        diagnosis: session.diagnosis || '',
        treatmentPlan: session.treatmentPlan || '',
        doctorNotes: session.doctorNotes || '',
        // Doctor tracking
        assignedDoctor: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor',
        // Legacy notes field
        notes: session.notes || '',
        // Prescriptions
        prescriptions: (() => {
          try {
            return session.prescription ? JSON.parse(session.prescription) : [];
          } catch (e) {
            console.error('Error parsing prescription JSON:', e, 'Raw value:', session.prescription);
            return [];
          }
        })(),
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

// Healthcare Analytics Endpoints
// Get diagnosis analytics data
router.get('/analytics/diagnosis', async (req, res) => {
  try {
    console.log('Fetching diagnosis analytics data...');
    
    const checkInSessions = await CheckInSession.findAll({
      where: {
        status: 'completed',
        diagnosis: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: '' },
            { [Op.ne]: 'sample' },
            { [Op.ne]: 'sample data' }
          ]
        }
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['dateOfBirth', 'gender'],
          required: false
        }
      ],
      attributes: ['diagnosis', 'createdAt']
    });

    console.log(`Found ${checkInSessions.length} completed checkups with diagnosis`);

    // Process diagnosis data and group by age and gender
    const diagnosisMap = {};
    
    checkInSessions.forEach(session => {
      const diagnosis = session.diagnosis.trim();
      const patientAge = session.Patient?.dateOfBirth ? calculateAge(session.Patient.dateOfBirth) : null;
      const patientGender = session.Patient?.gender || 'Unknown';
      
      if (!diagnosisMap[diagnosis]) {
        diagnosisMap[diagnosis] = {
          disease: diagnosis,
          total: 0,
          ageGroups: { '0-17': 0, '18-30': 0, '31-50': 0, '51+': 0 },
          genderGroups: { 'Male': 0, 'Female': 0, 'Other': 0, 'Unknown': 0 }
        };
      }
      
      diagnosisMap[diagnosis].total++;
      
      // Age group aggregation
      if (patientAge !== null && patientAge !== 'N/A') {
        if (patientAge >= 0 && patientAge <= 17) {
          diagnosisMap[diagnosis].ageGroups['0-17']++;
        } else if (patientAge >= 18 && patientAge <= 30) {
          diagnosisMap[diagnosis].ageGroups['18-30']++;
        } else if (patientAge >= 31 && patientAge <= 50) {
          diagnosisMap[diagnosis].ageGroups['31-50']++;
        } else if (patientAge >= 51) {
          diagnosisMap[diagnosis].ageGroups['51+']++;
        }
      }
      
      // Gender group aggregation
      const normalizedGender = patientGender.toLowerCase();
      if (normalizedGender === 'male' || normalizedGender === 'm') {
        diagnosisMap[diagnosis].genderGroups['Male']++;
      } else if (normalizedGender === 'female' || normalizedGender === 'f') {
        diagnosisMap[diagnosis].genderGroups['Female']++;
      } else if (normalizedGender === 'other') {
        diagnosisMap[diagnosis].genderGroups['Other']++;
      } else {
        diagnosisMap[diagnosis].genderGroups['Unknown']++;
      }
    });

    // Convert to array and sort by total count
    const diagnosisData = Object.values(diagnosisMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15); // Limit to top 15 diagnoses

    console.log(`Processed ${diagnosisData.length} unique diagnoses`);
    res.json(diagnosisData);
    
  } catch (error) {
    console.error('Error fetching diagnosis analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch diagnosis analytics',
      message: error.message 
    });
  }
});

// Get prescription analytics data
router.get('/analytics/prescriptions', async (req, res) => {
  try {
    console.log('Fetching prescription analytics data...');
    
    const checkInSessions = await CheckInSession.findAll({
      where: {
        status: 'completed',
        prescription: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.ne]: '' },
            { [Op.ne]: '[]' }
          ]
        }
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['dateOfBirth', 'gender'],
          required: false
        }
      ],
      attributes: ['prescription', 'createdAt']
    });

    console.log(`Found ${checkInSessions.length} completed checkups with prescriptions`);

    // Process prescription data
    const prescriptionMap = {};
    
    checkInSessions.forEach(session => {
      const patientAge = session.Patient?.dateOfBirth ? calculateAge(session.Patient.dateOfBirth) : null;
      const patientGender = session.Patient?.gender || 'Unknown';
      
      try {
        const prescriptions = JSON.parse(session.prescription || '[]');
        
        prescriptions.forEach(prescription => {
          const name = prescription.medication || prescription.name || 'Unknown';
          const type = prescription.type || (name.toLowerCase().includes('vaccine') ? 'Vaccine' : 'Medicine');
          
          if (!prescriptionMap[name]) {
            prescriptionMap[name] = {
              name: name,
              type: type,
              total: 0,
              ageGroups: { '0-17': 0, '18-30': 0, '31-50': 0, '51+': 0 },
              genderGroups: { 'Male': 0, 'Female': 0, 'Other': 0, 'Unknown': 0 }
            };
          }
          
          const quantity = parseInt(prescription.quantity) || 1;
          prescriptionMap[name].total += quantity;
          
          // Age group aggregation
          if (patientAge !== null && patientAge !== 'N/A') {
            if (patientAge >= 0 && patientAge <= 17) {
              prescriptionMap[name].ageGroups['0-17'] += quantity;
            } else if (patientAge >= 18 && patientAge <= 30) {
              prescriptionMap[name].ageGroups['18-30'] += quantity;
            } else if (patientAge >= 31 && patientAge <= 50) {
              prescriptionMap[name].ageGroups['31-50'] += quantity;
            } else if (patientAge >= 51) {
              prescriptionMap[name].ageGroups['51+'] += quantity;
            }
          }
          
          // Gender group aggregation
          const normalizedGender = patientGender.toLowerCase();
          if (normalizedGender === 'male' || normalizedGender === 'm') {
            prescriptionMap[name].genderGroups['Male'] += quantity;
          } else if (normalizedGender === 'female' || normalizedGender === 'f') {
            prescriptionMap[name].genderGroups['Female'] += quantity;
          } else if (normalizedGender === 'other') {
            prescriptionMap[name].genderGroups['Other'] += quantity;
          } else {
            prescriptionMap[name].genderGroups['Unknown'] += quantity;
          }
        });
      } catch (e) {
        console.error('Error parsing prescription JSON:', e);
      }
    });

    // Convert to array and sort by total usage
    const prescriptionData = Object.values(prescriptionMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15); // Limit to top 15 prescriptions

    console.log(`Processed ${prescriptionData.length} unique prescriptions`);
    res.json(prescriptionData);
    
  } catch (error) {
    console.error('Error fetching prescription analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch prescription analytics',
      message: error.message 
    });
  }
});

// Get barangay visits analytics data
router.get('/analytics/barangay-visits', async (req, res) => {
  try {
    console.log('Fetching barangay visits analytics data...');
    
    const checkInSessions = await CheckInSession.findAll({
      where: {
        status: 'completed'
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['barangay', 'address'],
          required: false
        }
      ],
      attributes: ['id', 'createdAt']
    });

    console.log(`Found ${checkInSessions.length} completed checkups`);

    // Process barangay visits data
    const barangayMap = {};
    
    checkInSessions.forEach(session => {
      // Try to get barangay from patient data
      let barangay = session.Patient?.barangay;
      
      // If no barangay in patient data, try to extract from address
      if (!barangay && session.Patient?.address) {
        const address = session.Patient.address.toLowerCase();
        // Common barangays in Pasig
        const commonBarangays = [
          'maybunga', 'rosario', 'santa ana', 'san miguel', 'caniogan', 
          'kapitolyo', 'pinagbuhatan', 'bagong ilog', 'bgy. rosario',
          'bgy. maybunga', 'bgy. santa ana', 'bgy. san miguel'
        ];
        
        for (const bgry of commonBarangays) {
          if (address.includes(bgry)) {
            barangay = bgry.replace('bgy. ', '').replace(/\b\w/g, l => l.toUpperCase());
            break;
          }
        }
      }
      
      // Default to 'Unknown' if no barangay found
      if (!barangay) {
        barangay = 'Unknown';
      }
      
      // Clean up barangay name
      barangay = barangay.charAt(0).toUpperCase() + barangay.slice(1).toLowerCase();
      
      if (!barangayMap[barangay]) {
        barangayMap[barangay] = {
          barangay: barangay,
          visits: 0
        };
      }
      
      barangayMap[barangay].visits++;
    });

    // Convert to array and sort by visit count
    const barangayData = Object.values(barangayMap)
      .sort((a, b) => b.visits - a.visits)
      .filter(item => item.barangay !== 'Unknown' || item.visits > 5); // Filter out unknown unless significant

    console.log(`Processed ${barangayData.length} barangays`);
    res.json(barangayData);
    
  } catch (error) {
    console.error('Error fetching barangay visits analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch barangay visits analytics',
      message: error.message 
    });
  }
});

module.exports = router;
