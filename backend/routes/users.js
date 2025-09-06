const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', auth, async (req, res) => {
  try {
    // Check if the user has admin privileges (case-insensitive check)
    if (req.user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized: Admin access required' });
    }

    const users = await User.findAll({
      attributes: [
        'id', 
        'username',
        'firstName', 
        'lastName', 
        'email', 
        'contactNumber', 
        'role', 
        'position', 
        'accessLevel', 
        'isActive',
        'createdAt'
      ],
      where: {
        role: { [Op.in]: ['admin', 'doctor'] }
      },
      order: [['lastName', 'ASC']],
    });

    res.json({ users }); // Wrap in object for consistency
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/doctors
// @desc    Get all doctors (accessible by doctors and admins)
// @access  Private/Doctor+
router.get('/doctors', auth, async (req, res) => {
  try {
    // Allow both doctors and admins to access this endpoint
    const userRole = req.user.role.toLowerCase();
    if (userRole !== 'admin' && userRole !== 'doctor') {
      return res.status(403).json({ msg: 'Unauthorized: Doctor or Admin access required' });
    }

    const doctors = await User.findAll({
      attributes: [
        'id', 
        'username',
        'firstName', 
        'lastName', 
        'email', 
        'contactNumber', 
        'role', 
        'position', 
        'accessLevel', 
        'isActive',
        'createdAt'
      ],
      where: {
        role: 'doctor',
        isActive: true
      },
      order: [['lastName', 'ASC']],
    });

    res.json({ users: doctors }); // Keep same format as main users endpoint
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users
// @desc    Create a new user
// @access  Private/Admin
router.post('/', 
  [
    auth,
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Must be a valid email address'),
    body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    body('role', 'Role is required').not().isEmpty(),
    body('contactNumber')
      .optional({ checkFalsy: true })
      .isLength({ min: 11, max: 11 })
      .withMessage('Contact number must be exactly 11 digits')
      .isNumeric()
      .withMessage('Contact number must contain only numbers'),
  ], 
  async (req, res) => {
    // Validate inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if the user has admin privileges (case-insensitive check)
      if (req.user.role.toLowerCase() !== 'admin') {
        return res.status(403).json({ msg: 'Unauthorized: Admin access required' });
      }

      const { firstName, lastName, email, contactNumber, password, role, position } = req.body;

      // Validate that at least email or contactNumber is provided
      if (!email && !contactNumber) {
        return res.status(400).json({ msg: 'Either email or contact number must be provided' });
      }

      // Check if user already exists with this email or contact number
      const whereClause = [];
      if (email) whereClause.push({ email });
      if (contactNumber) whereClause.push({ contactNumber });

      let user = await User.findOne({ 
        where: {
          [Op.or]: whereClause
        }
      });
      
      if (user) {
        return res.status(400).json({ msg: 'User already exists with this email or contact number' });
      }

      // Create new user
      user = await User.create({
        username: email || contactNumber, // Use email as username, fallback to contactNumber
        firstName,
        lastName,
        email: email || null,
        contactNumber: contactNumber || null,
        password, // Note: Password should be hashed in the model
        role,
        position: position || null
      });

      res.status(201).json({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
        position: user.position,
        createdAt: user.createdAt
      });
    } catch (err) {
      console.error('Error creating user:', err.message);
      // Handle unique constraint violation
      if (err.name === 'SequelizeUniqueConstraintError') {
        if (err.fields.email) {
          return res.status(400).json({ msg: 'This email is already registered' });
        }
        if (err.fields.contactNumber) {
          return res.status(400).json({ msg: 'This contact number is already registered' });
        }
      }
      res.status(500).send('Server Error');
    }
});

// @route   PUT api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  try {
    // Check if the user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized: Admin access required' });
    }

    const { firstName, lastName, email, role, position } = req.body;
    const userId = req.params.id;
    
    // Find user
    let user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user data
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.role = role || user.role;
    user.position = position || user.position;
    
    await user.save();

    res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      position: user.position
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if the user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized: Admin access required' });
    }

    const userId = req.params.id;
    
    // Find user
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Delete user
    await user.destroy();
    
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
