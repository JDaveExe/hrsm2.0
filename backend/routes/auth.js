const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const router = express.Router();

// Import models
const User = require('../models/User');
const Patient = require('../models/Patient');

// Import middleware
const auth = require('../middleware/auth');

// Import validation rules
const validators = require('../utils/validators');

// Import utilities
const { generateQRCode } = require('../utils/qrGenerator');

// @desc    Health check for auth routes
// @route   GET /api/auth/health
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth routes are working',
    timestamp: new Date().toISOString()
  });
});

// @desc    Check if email/username exists
// @route   POST /api/auth/check-existing
// @access  Public
router.post('/check-existing', async (req, res) => {
  try {
    const { email, username } = req.body;

    const existingUser = await User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { username: username?.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email?.toLowerCase() 
          ? 'Email address is already registered' 
          : 'Username is already taken',
        field: existingUser.email === email?.toLowerCase() ? 'email' : 'username'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Email and username are available'
    });

  } catch (error) {
    console.error('Check existing error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during validation'
    });
  }
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', 
  ...validators.registerValidation, 
  async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      contactNumber,
      address,
      dateOfBirth,
      gender,
      bloodType,
      emergencyContact
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email address is already registered' 
          : 'Username is already taken'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'patient', // Default role for registration
      profile: {
        firstName,
        lastName,
        contactNumber,
        address,
        dateOfBirth,
        gender
      }
    });

    await user.save();

    // Create patient profile (no family assignment for online registration)
    const patient = new Patient({
      userId: user._id,
      personalInfo: {
        birthDate: dateOfBirth,
        gender,
        bloodType,
        emergencyContact
      },
      registrationType: 'online', // Track how patient was registered
      familyId: null // Online registrations go to "Unsorted Members"
    });

    // Generate QR code for patient
    const qrCodeData = {
      patientId: patient.patientId,
      email: user.email,
      phone: contactNumber,
      name: `${firstName} ${lastName}`,
      checksum: generateChecksum(patient.patientId, user.email)
    };

    patient.qrCode = await generateQRCode(JSON.stringify(qrCodeData));
    patient.qrCodeGeneratedAt = new Date();

    await patient.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookies
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile
      },
      patient: {
        id: patient._id,
        patientId: patient.patientId,
        qrCode: patient.qrCode
      },
      accessToken: token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @desc    Login user (account access only, not check-in)
// @route   POST /api/auth/login
// @access  Public
router.post('/login', 
  ...validators.loginValidation, 
  async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT tokens
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set httpOnly cookies
    res.cookie('accessToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        lastLogin: user.lastLogin
      },
      accessToken: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Set new access token cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences,
        isVerified: user.isVerified,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Helper function to generate checksum
function generateChecksum(patientId, email) {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(patientId + email + process.env.JWT_SECRET).digest('hex').substring(0, 12);
}

module.exports = router;
