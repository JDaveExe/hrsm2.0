const express = require('express');
const { authenticateToken: auth } = require('../middleware/auth');
const { CheckInSession, Patient } = require('../models');

const router = express.Router();

// Get active prescriptions for a patient
router.get('/patient/:patientId/prescriptions/active', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log(`🔍 Fetching active prescriptions for patient ID: ${patientId}`);
    
    // Get all completed checkups for this patient that have prescriptions
    const sessions = await CheckInSession.findAll({
      where: {
        patientId: patientId,
        status: 'completed'
      },
      include: [{
        model: Patient,
        as: 'Patient',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`📋 Found ${sessions.length} completed sessions for patient ${patientId}`);

    // Extract and process prescriptions from all sessions
    let allPrescriptions = [];
    
    sessions.forEach((session, index) => {
      if (session.prescription && session.prescription !== 'null' && session.prescription !== '[]') {
        try {
          const prescriptions = JSON.parse(session.prescription);
          if (Array.isArray(prescriptions) && prescriptions.length > 0) {
            prescriptions.forEach((prescription, prescIndex) => {
              // Add metadata to each prescription
              const enrichedPrescription = {
                id: `${session.id}-${prescIndex}`, // Unique ID for frontend
                sessionId: session.id,
                prescriptionDate: session.createdAt,
                doctorName: session.doctorName || 'Dr. John Smith',
                checkupDate: session.createdAt,
                status: calculatePrescriptionStatus(prescription, session.createdAt),
                ...prescription
              };
              allPrescriptions.push(enrichedPrescription);
            });
          }
        } catch (error) {
          console.error(`Error parsing prescription JSON for session ${session.id}:`, error);
        }
      }
    });

    // Filter for active prescriptions (not expired based on duration)
    const activePrescriptions = allPrescriptions.filter(prescription => {
      return prescription.status === 'active' || prescription.status === 'current';
    });

    console.log(`💊 Found ${allPrescriptions.length} total prescriptions, ${activePrescriptions.length} active`);

    res.json({
      patientId: parseInt(patientId),
      activePrescriptions,
      totalPrescriptions: allPrescriptions.length,
      activeCount: activePrescriptions.length
    });

  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);
    res.status(500).json({ 
      msg: 'Server error while fetching prescriptions',
      error: error.message 
    });
  }
});

// Get prescription history for a patient
router.get('/patient/:patientId/prescriptions/history', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    console.log(`📜 Fetching prescription history for patient ID: ${patientId}`);
    
    const sessions = await CheckInSession.findAll({
      where: {
        patientId: patientId,
        status: 'completed'
      },
      include: [{
        model: Patient,
        as: 'Patient',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    let allPrescriptions = [];
    
    sessions.forEach((session, index) => {
      if (session.prescription && session.prescription !== 'null' && session.prescription !== '[]') {
        try {
          const prescriptions = JSON.parse(session.prescription);
          if (Array.isArray(prescriptions) && prescriptions.length > 0) {
            prescriptions.forEach((prescription, prescIndex) => {
              const enrichedPrescription = {
                id: `${session.id}-${prescIndex}`,
                sessionId: session.id,
                prescriptionDate: session.createdAt,
                doctorName: session.doctorName || 'Dr. John Smith',
                checkupDate: session.createdAt,
                status: calculatePrescriptionStatus(prescription, session.createdAt),
                ...prescription
              };
              allPrescriptions.push(enrichedPrescription);
            });
          }
        } catch (error) {
          console.error(`Error parsing prescription JSON for session ${session.id}:`, error);
        }
      }
    });

    // Sort by date (most recent first)
    allPrescriptions.sort((a, b) => new Date(b.prescriptionDate) - new Date(a.prescriptionDate));

    res.json({
      patientId: parseInt(patientId),
      prescriptionHistory: allPrescriptions,
      totalCount: allPrescriptions.length
    });

  } catch (error) {
    console.error('Error fetching prescription history:', error);
    res.status(500).json({ 
      msg: 'Server error while fetching prescription history',
      error: error.message 
    });
  }
});

// Helper function to calculate prescription status based on duration and date
function calculatePrescriptionStatus(prescription, prescriptionDate) {
  if (!prescription.duration || !prescriptionDate) {
    return 'active'; // Default to active if we can't determine
  }

  try {
    const startDate = new Date(prescriptionDate);
    const currentDate = new Date();
    
    // Parse duration (e.g., "3 days", "1 week", "2 weeks")
    const durationStr = prescription.duration.toLowerCase();
    let durationInDays = 0;
    
    if (durationStr.includes('day')) {
      const days = parseInt(durationStr.match(/\d+/)?.[0] || '0');
      durationInDays = days;
    } else if (durationStr.includes('week')) {
      const weeks = parseInt(durationStr.match(/\d+/)?.[0] || '0');
      durationInDays = weeks * 7;
    } else if (durationStr.includes('month')) {
      const months = parseInt(durationStr.match(/\d+/)?.[0] || '0');
      durationInDays = months * 30; // Approximate
    } else {
      // If we can't parse, assume it's active for a reasonable time
      durationInDays = 7; // Default 1 week
    }
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + durationInDays);
    
    if (currentDate <= endDate) {
      return 'active';
    } else {
      return 'completed';
    }
  } catch (error) {
    console.error('Error calculating prescription status:', error);
    return 'active'; // Default to active on error
  }
}

module.exports = router;
