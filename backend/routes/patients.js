const express = require('express');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Family = require('../models/Family');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST api/patients
// @desc    Create a new patient
// @access  Private
router.post(
  '/',
  [auth, [
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('dateOfBirth', 'Date of birth is required').not().isEmpty(),
    body('gender', 'Gender is required').isIn(['Male', 'Female']),
  ]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const patient = await Patient.create(req.body);
      res.status(201).json(patient);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/patients
// @desc    Get all patients
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.findAll({
      include: [{ model: User, attributes: ['id', 'username', 'email'] }],
      order: [['lastName', 'ASC']],
    });
    res.json(patients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/patients/:id
// @desc    Get patient by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id, {
      include: [{ model: User, attributes: ['id', 'username', 'email'] }],
    });

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/patients/:id
// @desc    Update a patient
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    await patient.update(req.body);
    res.json(patient);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/patients/:id
// @desc    Delete a patient
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    await patient.destroy();
    res.json({ msg: 'Patient removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/patients/unsorted
// @desc    Get all patients without a family assignment
// @access  Private
router.get('/unsorted', auth, async (req, res) => {
  try {
    const unsortedPatients = await Patient.findAll({
      where: { familyId: null },
      include: [{ model: User, attributes: ['id', 'username', 'email'] }],
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });
    res.json(unsortedPatients);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/patients/autosort
// @desc    Automatically sort patients by surname into existing families
// @access  Private
router.post('/autosort', auth, async (req, res) => {
  try {
    const unsortedPatients = await Patient.findAll({
      where: { familyId: null },
      order: [['lastName', 'ASC']],
    });

    const results = {
      sorted: [],
      needsNewFamily: []
    };

    for (const patient of unsortedPatients) {
      // Find existing family with same surname
      const existingFamily = await Family.findOne({
        where: { surname: patient.lastName }
      });

      if (existingFamily) {
        // Assign patient to existing family
        await patient.update({ familyId: existingFamily.id });
        results.sorted.push({
          patient: {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName
          },
          assignedToFamily: existingFamily.familyName
        });
      } else {
        // Patient needs new family
        results.needsNewFamily.push({
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/patients/autosort/create-families
// @desc    Auto-create families for unmatched patients
// @access  Private
router.post('/autosort/create-families', auth, async (req, res) => {
  try {
    const { patientIds } = req.body;
    
    const results = [];
    
    for (const patientId of patientIds) {
      const patient = await Patient.findByPk(patientId);
      if (patient && !patient.familyId) {
        // Create new family with patient's surname
        const newFamily = await Family.create({
          familyName: `${patient.lastName} Family`,
          surname: patient.lastName,
          headOfFamily: `${patient.firstName} ${patient.lastName}`,
          contactNumber: patient.contactNumber || '',
          address: patient.address || ''
        });

        // Assign patient to new family
        await patient.update({ familyId: newFamily.id });
        
        results.push({
          patient: {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName
          },
          newFamily: {
            id: newFamily.id,
            familyName: newFamily.familyName
          }
        });
      }
    }

    res.json(results);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/patients/:id/assign-family
// @desc    Manually assign a patient to a family
// @access  Private
router.put('/:id/assign-family', auth, async (req, res) => {
  try {
    const { familyId } = req.body;
    const patient = await Patient.findByPk(req.params.id);

    if (!patient) {
      return res.status(404).json({ msg: 'Patient not found' });
    }

    // Verify family exists
    const family = await Family.findByPk(familyId);
    if (!family) {
      return res.status(404).json({ msg: 'Family not found' });
    }

    await patient.update({ familyId });
    res.json({ msg: 'Patient assigned to family successfully', patient, family });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
