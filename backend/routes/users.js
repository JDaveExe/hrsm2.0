const express = require('express');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const router = express.Router();

// Import models
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// Import middleware
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Import validation rules
const validators = require('../utils/validators');

// @desc    Health check for user routes
// @route   GET /api/users/health
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User routes are working',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
//                         ADMIN USER MANAGEMENT
// =============================================================================

// @desc    Get all users with filtering and pagination
// @route   GET /api/users/admin/list
// @access  Private (Admin only)
router.get('/admin/list', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    // Search filter (name or email)
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await User.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    // Get users
    const users = await User.find(filter)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get user statistics
    const stats = {
      totalUsers: await User.countDocuments(),
      adminUsers: await User.countDocuments({ role: 'admin' }),
      doctorUsers: await User.countDocuments({ role: 'doctor' }),
      patientUsers: await User.countDocuments({ role: 'patient' }),
      activeUsers: await User.countDocuments({ status: 'active' }),
      inactiveUsers: await User.countDocuments({ status: 'inactive' })
    };

    res.status(200).json({
      success: true,
      data: {
        users,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        }
      }
    });

  } catch (error) {
    console.error('Get users list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @desc    Get user details by ID
// @route   GET /api/users/admin/:id
// @access  Private (Admin only)
router.get('/admin/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional information based on role
    let additionalInfo = {};
    
    if (user.role === 'patient') {
      // Get patient profile if exists
      const patientProfile = await Patient.findOne({ userId: user._id })
        .populate('familyId', 'familyName');
      additionalInfo.patientProfile = patientProfile;
      
      // Get appointment count
      if (patientProfile) {
        additionalInfo.appointmentCount = await Appointment.countDocuments({ 
          patientId: patientProfile._id 
        });
      }
    } else if (user.role === 'doctor') {
      // Get appointment count for doctor
      additionalInfo.appointmentCount = await Appointment.countDocuments({ 
        doctorId: user._id 
      });
      
      // Get today's appointments
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      
      additionalInfo.todayAppointments = await Appointment.countDocuments({
        doctorId: user._id,
        appointmentDate: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        ...additionalInfo
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user details',
      error: error.message
    });
  }
});

// @desc    Create new user (Admin)
// @route   POST /api/users/admin/create
// @access  Private (Admin only)
router.post('/admin/create', 
  auth, 
  roleCheck(['admin']), 
  ...validators.registerValidation, 
  async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      contactNumber,
      status = 'active'
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Validate role
    if (!['admin', 'doctor', 'patient'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      contactNumber,
      status,
      createdBy: req.user.id
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// @desc    Update user details
// @route   PUT /api/users/admin/:id
// @access  Private (Admin only)
router.put('/admin/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      role,
      contactNumber,
      status
    } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and doesn't conflict
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use by another user'
        });
      }
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (contactNumber) user.contactNumber = contactNumber;
    if (status) user.status = status;
    
    user.updatedBy = req.user.id;
    user.updatedAt = new Date();

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// @desc    Update user password
// @route   PUT /api/users/admin/:id/password
// @access  Private (Admin only)
router.put('/admin/:id/password', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.updatedBy = req.user.id;
    user.updatedAt = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/admin/:id
// @access  Private (Admin only)
router.delete('/admin/:id', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting the current admin user
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user has related data
    if (user.role === 'patient') {
      const patientProfile = await Patient.findOne({ userId: user._id });
      if (patientProfile) {
        const appointmentCount = await Appointment.countDocuments({ 
          patientId: patientProfile._id 
        });
        if (appointmentCount > 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot delete user with existing appointments. Please archive instead.'
          });
        }
      }
    } else if (user.role === 'doctor') {
      const appointmentCount = await Appointment.countDocuments({ 
        doctorId: user._id 
      });
      if (appointmentCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete doctor with existing appointments. Please archive instead.'
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
});

// =============================================================================
//                         GENERAL USER ENDPOINTS
// =============================================================================

// @desc    Get all users (role-based access)
// @route   GET /api/users
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    let selectFields = 'firstName lastName email role status';

    // Role-based filtering
    if (req.user.role === 'doctor') {
      // Doctors can see basic info of all users for appointments
      filter = {};
    } else if (req.user.role === 'patient') {
      // Patients can only see doctors and admins
      filter = { role: { $in: ['doctor', 'admin'] } };
    }
    // Admin can see all users

    const users = await User.find(filter)
      .select(selectFields)
      .sort({ firstName: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    // Access control: users can see their own profile, doctors can see patients, admins can see all
    const requestedUserId = req.params.id;
    const currentUserId = req.user.id;
    const currentUserRole = req.user.role;

    let canAccess = false;

    if (currentUserId === requestedUserId) {
      // User accessing their own profile
      canAccess = true;
    } else if (currentUserRole === 'admin') {
      // Admin can access any profile
      canAccess = true;
    } else if (currentUserRole === 'doctor') {
      // Doctor can access patient profiles
      const targetUser = await User.findById(requestedUserId);
      if (targetUser && targetUser.role === 'patient') {
        canAccess = true;
      }
    }

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(requestedUserId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
router.put('/me', auth, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      contactNumber
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (contactNumber) user.contactNumber = contactNumber;
    
    user.updatedAt = new Date();

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: userResponse
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
});

module.exports = router;
