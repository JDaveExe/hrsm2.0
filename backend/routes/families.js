const express = require('express');
const { body, validationResult } = require('express-validator');
const Family = require('../models/Family');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET api/families
// @desc    Get all families
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const families = await Family.findAll({
      include: [
        {
          model: Patient,
          as: 'members',
          attributes: ['id', 'firstName', 'lastName', 'gender']
        }
      ],
      order: [['familyName', 'ASC']],
    });
    res.json(families);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/families
// @desc    Create a new family
// @access  Private
router.post(
  '/',
  [auth, [
    body('familyName', 'Family name is required').not().isEmpty(),
    body('surname', 'Surname is required').not().isEmpty(),
    body('headOfFamily').optional({ checkFalsy: true }).isString(),
    body('contactNumber')
      .optional({ checkFalsy: true })
      .isLength({ min: 11, max: 11 })
      .withMessage('Contact number must be exactly 11 digits')
      .isNumeric()
      .withMessage('Contact number must contain only numbers'),
  ]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const family = await Family.create(req.body);
      res.status(201).json(family);
    } catch (err) {
      console.error(err.message);
      // Handle unique constraint violation
      if (err.name === 'SequelizeUniqueConstraintError') {
        if (err.fields.contactNumber) {
          return res.status(400).json({ msg: 'This contact number is already registered' });
        }
      }
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/families/:id
// @desc    Get family by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const family = await Family.findByPk(req.params.id, {
      include: [
        {
          model: Patient,
          as: 'members',
          attributes: ['id', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'contactNumber']
        }
      ],
    });

    if (!family) {
      return res.status(404).json({ msg: 'Family not found' });
    }

    res.json(family);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/families/:id
// @desc    Update a family
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const family = await Family.findByPk(req.params.id);

    if (!family) {
      return res.status(404).json({ msg: 'Family not found' });
    }

    await family.update(req.body);
    res.json(family);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/families/:id
// @desc    Delete a family
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const family = await Family.findByPk(req.params.id);

    if (!family) {
      return res.status(404).json({ msg: 'Family not found' });
    }

    // Check if family has members
    const memberCount = await Patient.count({ where: { familyId: req.params.id } });
    if (memberCount > 0) {
      return res.status(400).json({ 
        msg: `Cannot delete family. It has ${memberCount} members. Please reassign members first.` 
      });
    }

    await family.destroy();
    res.json({ msg: 'Family removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
