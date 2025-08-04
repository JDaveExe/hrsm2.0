const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Patient = require('../models/Patient');
const Family = require('../models/Family');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware to check for admin privileges
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role.toLowerCase() === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Unauthorized: Admin access required' });
  }
};

// @route   GET api/admin/unsorted-members
// @desc    Get all patients not assigned to a family
// @access  Private/Admin
router.get('/unsorted-members', [auth, adminOnly], async (req, res) => {
  try {
    const unsortedMembers = await Patient.findAll({
      where: { familyId: null, isActive: true },
      order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    });
    res.json(unsortedMembers);
  } catch (err) {
    console.error('Error fetching unsorted members:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/admin/assign-family
// @desc    Assign a patient to a family, with an option to create the family
// @access  Private/Admin
router.post('/assign-family', 
  [
    auth, 
    adminOnly,
    body('patientId', 'Patient ID is required').isInt(),
    body('familyName', 'Family name is required').not().isEmpty(),
    body('createNewFamily', 'createNewFamily flag is required').isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { patientId, familyName, createNewFamily } = req.body;

    try {
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({ msg: 'Patient not found' });
      }

      let family;
      if (createNewFamily) {
        family = await Family.create({ 
          familyName,
          surname: patient.lastName,
          headOfFamily: `${patient.firstName} ${patient.lastName}`,
        });
      } else {
        family = await Family.findOne({ where: { familyName } });
        if (!family) {
          return res.status(404).json({ msg: 'Family not found' });
        }
      }

      await patient.update({ familyId: family.id });
      res.json({ msg: 'Patient assigned to family successfully', patient, family });

    } catch (err) {
      console.error('Error assigning family:', err.message);
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ msg: 'A family with this name already exists.' });
      }
      res.status(500).json({ msg: 'Server Error', error: err.message });
    }
  }
);

// @route   POST api/admin/autosort-patients
// @desc    Automatically sort patients into families by surname
// @access  Private/Admin
router.post('/autosort-patients', [auth, adminOnly], async (req, res) => {
  try {
    const unsortedPatients = await Patient.findAll({ where: { familyId: null } });
    const families = await Family.findAll();
    const familyMap = new Map(families.map(f => [f.surname.toLowerCase(), f]));

    const results = {
      sorted: [],
      needsManualAssignment: [],
    };

    for (const patient of unsortedPatients) {
      const family = familyMap.get(patient.lastName.toLowerCase());
      if (family) {
        await patient.update({ familyId: family.id });
        results.sorted.push({ patient, family });
      } else {
        results.needsManualAssignment.push(patient);
      }
    }

    res.json(results);
  } catch (err) {
    console.error('Error during auto-sort:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
