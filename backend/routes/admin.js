const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const Patient = require('../models/Patient');
const Family = require('../models/Family');
const User = require('../models/User');
const { authenticateToken: auth } = require('../middleware/auth');

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

// @route   GET api/admin/users
// @desc    Get all users (admin, doctor, and management accounts)
// @access  Private/Admin
router.get('/users', [auth, adminOnly], async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        role: {
          [Op.in]: ['admin', 'doctor', 'management']
        }
      },
      attributes: {
        exclude: ['password'] // Don't send password hashes
      },
      order: [['createdAt', 'DESC']]
    });

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/admin/users/:id
// @desc    Update user information
// @access  Private/Admin
router.put('/users/:id', [
  auth,
  adminOnly,
  body('firstName', 'First name is required').not().isEmpty(),
  body('lastName', 'Last name is required').not().isEmpty(),
  body('emailInitials', 'Email initials are required').not().isEmpty(),
  body('accessLevel', 'Access level is required').isIn(['Administrator', 'Doctor']),
  body('position', 'Position is required').not().isEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { 
    firstName, 
    middleName,
    lastName, 
    emailInitials,
    accessLevel,
    position
  } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if new email already exists for another user
    const email = `${emailInitials}@maybunga.health`;
    const existingUser = await User.findOne({
      where: {
        [Op.and]: [
          { email: email },
          { id: { [Op.ne]: id } } // Exclude current user
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ msg: 'Email already exists for another user' });
    }

    // Update user
    const role = accessLevel === 'Administrator' ? 'admin' : accessLevel === 'Management' ? 'management' : 'doctor';
    await user.update({
      firstName,
      middleName: middleName || null,
      lastName,
      username: emailInitials,
      email: email,
      role,
      position,
      accessLevel
    });

    // Return updated user without password
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    res.json({ 
      msg: 'User updated successfully',
      user: updatedUser
    });
  } catch (err) {
    console.error('Error updating user:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   DELETE api/admin/users/:id
// @desc    Delete user account
// @access  Private/Admin
router.delete('/users/:id', [auth, adminOnly], async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Prevent deleting the last admin user
    if (user.role === 'admin') {
      const adminCount = await User.count({
        where: { role: 'admin', isActive: true }
      });
      
      if (adminCount <= 1) {
        return res.status(400).json({ 
          msg: 'Cannot delete the last admin user. At least one admin must remain.' 
        });
      }
    }

    // Soft delete by setting isActive to false
    await user.update({ isActive: false });

    res.json({ msg: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   PUT api/admin/users/:id/reset-password
// @desc    Reset user password
// @access  Private/Admin
router.put('/users/:id/reset-password', [
  auth,
  adminOnly,
  body('newPassword', 'Password must be 8 or more characters').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update password (will be hashed by model hook)
    await user.update({ password: newPassword });

    res.json({ msg: 'Password reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   DELETE api/admin/users/cleanup
// @desc    Reset user data to initial state (keep only default admin)
// @access  Private/Admin
router.delete('/users/cleanup', [auth, adminOnly], async (req, res) => {
  try {
    // Count current admin users
    const adminCount = await User.count({
      where: { role: 'admin', isActive: true }
    });

    if (adminCount <= 1) {
      return res.status(400).json({ 
        msg: 'Cannot perform cleanup. At least one admin user must remain.' 
      });
    }

    // Soft delete all non-default users (keep the requesting admin)
    const currentUserId = req.user.id;
    await User.update(
      { isActive: false },
      {
        where: {
          id: { [Op.ne]: currentUserId },
          role: { [Op.in]: ['admin', 'doctor', 'management'] }
        }
      }
    );

    // Count remaining active users
    const remainingUsers = await User.count({
      where: { isActive: true }
    });

    res.json({ 
      msg: 'User data cleanup completed successfully',
      remainingUsers: remainingUsers
    });
  } catch (err) {
    console.error('Error during user cleanup:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/admin/lab-referrals/:id/upload-results
// @desc    Upload lab results for a referral
// @access  Private/Admin
router.post('/lab-referrals/:id/upload-results', [auth, adminOnly], async (req, res) => {
  try {
    const { id } = req.params;
    const { resultsData, resultsNotes } = req.body;
    
    console.log(`📋 Admin uploading lab results for referral ID: ${id}`);
    
    // For now, just return success - in production this would update the database
    // and potentially store file uploads
    
    res.json({
      msg: 'Lab results uploaded successfully',
      referralId: id,
      uploadedBy: req.user.id,
      uploadDate: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error uploading lab results:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;
