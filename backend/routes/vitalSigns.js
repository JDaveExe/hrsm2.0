const express = require('express');
const router = express.Router();
const { VitalSigns, Patient } = require('../models');
const auth = require('../middleware/auth');

// @route   POST /api/vital-signs
// @desc    Create new vital signs record
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      patientId,
      temperature,
      heartRate,
      systolicBP,
      diastolicBP,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
      clinicalNotes,
      recordedAt
    } = req.body;

    // Validate required fields
    if (!patientId || !temperature || !heartRate || !systolicBP || !diastolicBP) {
      return res.status(400).json({
        message: 'Patient ID, temperature, heart rate, and blood pressure are required'
      });
    }

    // Check if patient exists
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Validate vital signs ranges
    if (temperature < 30.0 || temperature > 45.0) {
      return res.status(400).json({ message: 'Temperature must be between 30.0°C and 45.0°C' });
    }

    if (heartRate < 30 || heartRate > 200) {
      return res.status(400).json({ message: 'Heart rate must be between 30 and 200 bpm' });
    }

    if (systolicBP < 60 || systolicBP > 250 || diastolicBP < 40 || diastolicBP > 150) {
      return res.status(400).json({ message: 'Blood pressure values are out of valid range' });
    }

    if (systolicBP <= diastolicBP) {
      return res.status(400).json({ message: 'Systolic pressure must be higher than diastolic pressure' });
    }

    // Create vital signs record
    const vitalSigns = await VitalSigns.create({
      patientId,
      temperature: parseFloat(temperature),
      heartRate: parseInt(heartRate),
      systolicBP: parseInt(systolicBP),
      diastolicBP: parseInt(diastolicBP),
      respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
      oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
      weight: weight ? parseFloat(weight) : null,
      height: height ? parseInt(height) : null,
      clinicalNotes: clinicalNotes || null,
      recordedAt: recordedAt ? new Date(recordedAt) : new Date()
    });

    // Return the created record with patient info
    const createdVitalSigns = await VitalSigns.findByPk(vitalSigns.id, {
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    res.status(201).json({
      message: 'Vital signs recorded successfully',
      vitalSigns: createdVitalSigns
    });

  } catch (error) {
    console.error('Error creating vital signs:', error);
    res.status(500).json({
      message: 'Server error while recording vital signs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/vital-signs/patient/:patientId
// @desc    Get vital signs history for a patient
// @access  Private
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 50, offset = 0, orderBy = 'recordedAt', order = 'DESC' } = req.query;

    // Check if patient exists
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Get vital signs history
    const vitalSigns = await VitalSigns.findAll({
      where: { patientId },
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName']
      }],
      order: [[orderBy, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Get total count for pagination
    const totalCount = await VitalSigns.count({
      where: { patientId }
    });

    res.json({
      vitalSigns,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching vital signs history:', error);
    res.status(500).json({
      message: 'Server error while fetching vital signs history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/vital-signs/:id
// @desc    Get specific vital signs record
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const vitalSigns = await VitalSigns.findByPk(id, {
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    if (!vitalSigns) {
      return res.status(404).json({ message: 'Vital signs record not found' });
    }

    res.json(vitalSigns);

  } catch (error) {
    console.error('Error fetching vital signs record:', error);
    res.status(500).json({
      message: 'Server error while fetching vital signs record',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/vital-signs/:id
// @desc    Update vital signs record
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the record
    const vitalSigns = await VitalSigns.findByPk(id);
    if (!vitalSigns) {
      return res.status(404).json({ message: 'Vital signs record not found' });
    }

    // Update the record
    await vitalSigns.update(updateData);

    // Return updated record
    const updatedVitalSigns = await VitalSigns.findByPk(id, {
      include: [{
        model: Patient,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName']
      }]
    });

    res.json({
      message: 'Vital signs updated successfully',
      vitalSigns: updatedVitalSigns
    });

  } catch (error) {
    console.error('Error updating vital signs:', error);
    res.status(500).json({
      message: 'Server error while updating vital signs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/vital-signs/:id
// @desc    Delete vital signs record
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const vitalSigns = await VitalSigns.findByPk(id);
    if (!vitalSigns) {
      return res.status(404).json({ message: 'Vital signs record not found' });
    }

    await vitalSigns.destroy();

    res.json({ message: 'Vital signs record deleted successfully' });

  } catch (error) {
    console.error('Error deleting vital signs:', error);
    res.status(500).json({
      message: 'Server error while deleting vital signs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
