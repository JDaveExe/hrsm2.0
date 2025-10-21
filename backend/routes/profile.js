const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken: auth } = require('../middleware/auth');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AuditLogger = require('../utils/auditLogger');
const bcrypt = require('bcryptjs');

const router = express.Router();

/**
 * @route   GET /api/profile/me
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
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
        'createdAt',
        'updatedAt'
      ]
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ profile: user });
  } catch (err) {
    console.error('Error fetching profile:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/profile/:userId
 * @desc    Get user profile by ID (Admin only)
 * @access  Private/Admin
 */
router.get('/:userId', auth, async (req, res) => {
  try {
    // Only admin can view other users' profiles
    if (req.user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    const user = await User.findOne({
      where: { id: req.params.userId },
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
        'createdAt',
        'updatedAt'
      ]
    });

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ profile: user });
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/profile/me
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/me', [
  auth,
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('contactNumber').optional().matches(/^[0-9+\-() ]+$/).withMessage('Invalid contact number format'),
  body('position').optional().trim()
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        msg: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { firstName, lastName, email, contactNumber, position } = req.body;

    // Find user
    const user = await User.findOne({ where: { id: req.user.id } });
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Store old values for audit logging
    const oldValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      position: user.position
    };

    // Update fields
    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        where: { 
          email, 
          id: { [require('sequelize').Op.ne]: req.user.id } 
        } 
      });
      if (existingUser) {
        return res.status(400).json({ msg: 'Email already in use' });
      }
      updateFields.email = email;
    }
    if (contactNumber !== undefined) updateFields.contactNumber = contactNumber;
    if (position !== undefined) updateFields.position = position;

    // Update user
    await user.update(updateFields);

    // Build change description
    const changes = [];
    if (firstName && firstName !== oldValues.firstName) changes.push(`name to "${firstName} ${user.lastName}"`);
    if (lastName && lastName !== oldValues.lastName) changes.push(`name to "${user.firstName} ${lastName}"`);
    if (email && email !== oldValues.email) changes.push(`email to "${email}"`);
    if (contactNumber && contactNumber !== oldValues.contactNumber) changes.push(`contact to "${contactNumber}"`);
    if (position && position !== oldValues.position) changes.push(`position to "${position}"`);

    // Log audit trail
    const userName = `${user.firstName} ${user.lastName}`.trim() || req.user.username || 'Unknown User';
    await AuditLog.create({
      userId: req.user.id,
      userName: userName,
      userRole: req.user.role,
      action: 'updated_profile',
      actionDescription: `${userName} updated their profile: ${changes.join(', ')}`,
      targetType: 'user',
      targetId: req.user.id,
      targetName: userName,
      metadata: {
        oldValues,
        newValues: updateFields
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });

    res.json({
      msg: 'Profile updated successfully',
      profile: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
        position: user.position,
        accessLevel: user.accessLevel,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/profile/:userId
 * @desc    Update user profile by ID (Admin only)
 * @access  Private/Admin
 */
router.put('/:userId', [
  auth,
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('contactNumber').optional().matches(/^[0-9+\-() ]+$/).withMessage('Invalid contact number format'),
  body('position').optional().trim(),
  body('accessLevel').optional().trim()
], async (req, res) => {
  try {
    // Only admin can update other users' profiles
    if (req.user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        msg: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { firstName, lastName, email, contactNumber, position, accessLevel } = req.body;

    // Find user
    const user = await User.findOne({ where: { id: req.params.userId } });
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Store old values for audit logging
    const oldValues = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber,
      position: user.position,
      accessLevel: user.accessLevel
    };

    // Update fields
    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ 
        where: { 
          email, 
          id: { [require('sequelize').Op.ne]: req.params.userId } 
        } 
      });
      if (existingUser) {
        return res.status(400).json({ msg: 'Email already in use' });
      }
      updateFields.email = email;
    }
    if (contactNumber !== undefined) updateFields.contactNumber = contactNumber;
    if (position !== undefined) updateFields.position = position;
    if (accessLevel !== undefined) updateFields.accessLevel = accessLevel;

    // Update user
    await user.update(updateFields);

    // Build change description
    const changes = [];
    if (firstName && firstName !== oldValues.firstName) changes.push(`name`);
    if (lastName && lastName !== oldValues.lastName) changes.push(`name`);
    if (email && email !== oldValues.email) changes.push(`email`);
    if (contactNumber && contactNumber !== oldValues.contactNumber) changes.push(`contact`);
    if (position && position !== oldValues.position) changes.push(`position`);
    if (accessLevel && accessLevel !== oldValues.accessLevel) changes.push(`access level`);

    // Log audit trail
    const adminName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.username || 'Admin';
    const targetUserName = `${user.firstName} ${user.lastName}`.trim();
    await AuditLog.create({
      userId: req.user.id,
      userName: adminName,
      userRole: req.user.role,
      action: 'updated_user_profile',
      actionDescription: `${adminName} updated user profile for ${targetUserName}: ${changes.join(', ')}`,
      targetType: 'user',
      targetId: user.id,
      targetName: targetUserName,
      metadata: {
        targetUser: targetUserName,
        oldValues,
        newValues: updateFields
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });

    res.json({
      msg: 'User profile updated successfully',
      profile: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
        position: user.position,
        accessLevel: user.accessLevel,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    console.error('Error updating user profile:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/profile/activities/me
 * @desc    Get current user's recent activities from audit trail
 * @access  Private
 */
router.get('/activities/me', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get audit logs for current user
    const { count, rows: activities } = await AuditLog.findAndCountAll({
      where: { userId: req.user.id },
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      attributes: [
        'id',
        'action',
        'actionDescription',
        'targetType',
        'targetId',
        'targetName',
        'timestamp',
        'ipAddress',
        'metadata'
      ]
    });

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching user activities:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/profile/activities/:userId
 * @desc    Get user's recent activities by ID (Admin only)
 * @access  Private/Admin
 */
router.get('/activities/:userId', auth, async (req, res) => {
  try {
    // Only admin can view other users' activities
    if (req.user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get audit logs for specified user
    const { count, rows: activities } = await AuditLog.findAndCountAll({
      where: { userId: req.params.userId },
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: offset,
      attributes: [
        'id',
        'action',
        'actionDescription',
        'targetType',
        'targetId',
        'targetName',
        'timestamp',
        'ipAddress',
        'metadata'
      ]
    });

    res.json({
      activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching user activities:', err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   PUT /api/profile/password
 * @desc    Update current user's password
 * @access  Private
 */
router.put('/password', [
  auth,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        msg: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findOne({ where: { id: req.user.id } });
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await user.update({ password: hashedPassword });

    // Log audit trail
    const userName = `${user.firstName} ${user.lastName}`.trim() || req.user.username || 'Unknown User';
    await AuditLog.create({
      userId: req.user.id,
      userName: userName,
      userRole: req.user.role,
      action: 'changed_password',
      actionDescription: `${userName} changed their account password`,
      targetType: 'user',
      targetId: req.user.id,
      targetName: userName,
      metadata: {},
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });

    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
