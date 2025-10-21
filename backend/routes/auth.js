const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('../models/User');
const Patient = require('../models/Patient');
const { DoctorSession } = require('../models');
const { authenticateToken: auth } = require('../middleware/auth');
const { smartIdAllocation } = require('../middleware/smartIdAllocation');
const AuditLogger = require('../utils/auditLogger');

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new patient user
// @access  Public
router.post(
  '/register',
  [
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('password', 'Password must be 6 or more characters').isLength({
      min: 6,
    }),
    body('dateOfBirth', 'Date of birth is required').not().isEmpty(),
    body('gender', 'Gender is required').isIn(['Male', 'Female']),
    // Custom validator for email that allows N/A
    body('email').custom((value) => {
      // Allow empty, undefined, null, or N/A values
      if (!value) {
        return true;
      }
      
      const trimmedValue = value.toString().trim().toLowerCase();
      
      if (trimmedValue === '' || trimmedValue === 'n/a' || trimmedValue === 'na') {
        return true;
      }
      
      // Check if it's a valid email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.trim())) {
        throw new Error('Invalid email format');
      }
      return true;
    }),
    // Custom validator for phone number that allows N/A
    body('phoneNumber').custom((value) => {
      // Allow empty, undefined, null, or N/A values
      if (!value) return true;
      
      const trimmedValue = value.toString().trim().toLowerCase();
      if (trimmedValue === '' || trimmedValue === 'n/a' || trimmedValue === 'na') {
        return true;
      }
      
      // Check if it's a valid Philippine phone number format
      const phoneRegex = /^(\+63|0)?9\d{9}$/;
      if (!phoneRegex.test(value.replace(/\s+/g, ''))) {
        throw new Error('Invalid phone number format');
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      firstName, 
      middleName,
      lastName, 
      suffix,
      email, 
      phoneNumber,
      password, 
      houseNo,
      street,
      purok,
      city,
      region,
      philHealthNumber,
      membershipStatus,
      dateOfBirth,
      age,
      gender,
      civilStatus
    } = req.body;

    try {
      // Clean and validate email and phone number
      let cleanEmail = null;
      let cleanPhoneNumber = null;
      
      // Process email - treat empty strings, "N/A", "n/a", etc. as null
      if (email && typeof email === 'string') {
        const trimmedEmail = email.trim().toLowerCase();
        if (trimmedEmail && trimmedEmail !== 'n/a' && trimmedEmail !== 'na' && trimmedEmail !== '') {
          cleanEmail = email.trim();
        }
      }
      
      // Process phone number - treat empty strings, "N/A", etc. as null
      if (phoneNumber && typeof phoneNumber === 'string') {
        const trimmedPhone = phoneNumber.trim().toLowerCase();
        if (trimmedPhone && trimmedPhone !== 'n/a' && trimmedPhone !== 'na' && trimmedPhone !== '') {
          cleanPhoneNumber = phoneNumber.trim();
        }
      }
      
      const username = cleanEmail || cleanPhoneNumber;
      if (!username) {
        return res.status(400).json({ msg: 'Either email or phone number is required' });
      }

      // Check if user already exists - check both User and Patient tables
      const existenceConditions = [];
      if (cleanEmail) {
        existenceConditions.push({ email: cleanEmail });
      }
      if (cleanPhoneNumber) {
        existenceConditions.push({ contactNumber: cleanPhoneNumber });
      }
      
      let user = null;
      let existingPatient = null;
      
      if (existenceConditions.length > 0) {
        // Check User table
        user = await User.findOne({
          where: {
            [Op.or]: existenceConditions
          }
        });
        
        // Also check Patient table for existing email/phone
        existingPatient = await Patient.findOne({
          where: {
            [Op.or]: existenceConditions
          }
        });
      }

      if (user || existingPatient) {
        return res.status(400).json({ msg: 'User already exists with this email or phone number' });
      }

      // Create new User - password will be hashed by beforeCreate hook
      user = await User.create({
        username: username,
        email: cleanEmail,
        contactNumber: cleanPhoneNumber,
        password: password, // Pass plain password - hook will hash it
        role: 'patient',
        firstName: firstName,
        lastName: lastName
      });

      // Generate QR code token
      const qrCode = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Clean values for Patient table - convert empty strings to null for unique fields
      const cleanPhilHealth = (philHealthNumber === '' || philHealthNumber === 'N/A') ? null : philHealthNumber;

      // Create new Patient associated with the User
      const patient = await Patient.create({
        userId: user.id,
        firstName,
        middleName,
        lastName,
        suffix,
        dateOfBirth,
        gender,
        civilStatus,
        contactNumber: cleanPhoneNumber, // Add contact number to Patient table
        email: cleanEmail, // Add email to Patient table (for display purposes)
        houseNo,
        street,
        purok,
        city,
        region,
        philHealthNumber: cleanPhilHealth, // Use null instead of empty string
        familyId: null, // Ensures the patient is unsorted
        qrCode: qrCode
      });

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
          role: user.role,
          username: user.username,
          patientId: patient.id,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
        (err, token) => {
          if (err) {
            console.error('Error signing token:', err);
            return res.status(500).send('Server error during token generation');
          }
          
          res.json({ 
            token, 
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              firstName: patient.firstName,
              lastName: patient.lastName,
              patientId: patient.id,
              qrCode: patient.qrCode,
              dateOfBirth: patient.dateOfBirth // Include for age calculation
            }
          });
        }
      );
    } catch (err) {
      console.error('Registration error:', err.message);
      console.error('Full error:', err);
      
      // Provide more specific error messages
      if (err.name === 'SequelizeValidationError') {
        const validationErrors = err.errors.map(e => e.message).join(', ');
        return res.status(400).json({ msg: `Validation error: ${validationErrors}` });
      }
      
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ msg: 'User already exists with this email or phone number' });
      }
      
      res.status(500).json({ msg: 'Server error during registration', error: err.message });
    }
  }
);

// @route   POST api/auth/create-staff
// @desc    Create admin or doctor user
// @access  Private (Admin only)
router.post(
  '/create-staff',
  [
    auth, // Add authentication middleware
    smartIdAllocation(), // Smart ID allocation will detect role from req.body.accessLevel
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
    body('emailInitials', 'Email initials are required').not().isEmpty(),
    body('password', 'Password must be 6-10 characters with letters, numbers and symbols').isLength({
      min: 6,
      max: 10
    }).matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,10}$/),
    body('accessLevel', 'Access level is required').isIn(['Administrator', 'Doctor', 'Management']),
    body('position', 'Position is required').not().isEmpty(),
  ],
  async (req, res) => {
    // Check if the user has admin privileges
    if (req.user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized: Admin access required' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      firstName, 
      middleName,
      lastName, 
      emailInitials,
      password,
      accessLevel,
      position
    } = req.body;

    try {
      const email = `${emailInitials}@brgymaybunga.health`;
      const role = accessLevel === 'Administrator' ? 'admin' : accessLevel === 'Management' ? 'management' : 'doctor';

      // Check if user already exists
      let user = await User.findOne({
        where: {
          [Op.or]: [
            { email: email },
            { username: emailInitials }
          ]
        }
      });

      if (user) {
        return res.status(400).json({ msg: 'User already exists with this email or username' });
      }

      // Create new User (password will be hashed by model hook)
      user = await User.create({
        username: emailInitials,
        email: email,
        password: password, // Let the model handle hashing
        role: role,
        firstName: firstName,
        middleName: middleName || null,
        lastName: lastName,
        position: position,
        accessLevel: accessLevel,
        isActive: true
      });

      // Log the user creation action
      await AuditLogger.logUserCreation(req, user);

      res.json({ 
        msg: 'User created successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          position: user.position,
          accessLevel: user.accessLevel
        }
      });
    } catch (err) {
      console.error('Staff creation error:', err.message);
      res.status(500).send('Server error during staff creation');
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('login', 'Please include a valid email or username').not().isEmpty(),
    body('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { login, password } = req.body;

    try {
        let user;

        // For admin/doctor login, require @brgymaybunga.health email format for database users
        // But allow any email format for patient accounts
        const isEmailFormat = login.includes('@');
        if (isEmailFormat && !login.endsWith('@brgymaybunga.health')) {
          // Check if this might be a patient account - if so, allow it through
          const potentialPatient = await User.findOne({
            where: {
              [Op.or]: [
                { username: login },
                { email: login }
              ],
              role: 'patient',
              isActive: true
            }
          });
          
          // If no patient found with this email, reject (admin/doctor must use @brgymaybunga.health)
          if (!potentialPatient) {
            return res.status(400).json({ msg: 'Invalid credentials' });
          }
        }

        // First check database for created users
        user = await User.findOne({
          where: {
            [Op.and]: [
              {
                [Op.or]: [
                  { username: login },
                  { email: login },
                  { contactNumber: login }
                ]
              },
              { role: { [Op.in]: ['admin', 'doctor', 'patient', 'management'] } },
              { isActive: true }
            ]
          }
        });

        if (user) {
          // Verify password for database users
          const isMatch = await bcrypt.compare(password, user.password);
          
          if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
          }
          
          // For patient users, fetch the associated Patient record to get patientId and dateOfBirth
          if (user.role === 'patient') {
            const patient = await Patient.findOne({
              where: { userId: user.id }
            });
            if (patient) {
              user.patientId = patient.id;
              user.dateOfBirth = patient.dateOfBirth; // Include dateOfBirth for age calculation
            }
          }
        } else {
          // Fallback accounts for development/testing only (disabled in production)
          // Set ENABLE_FALLBACK_ACCOUNTS=true in .env to enable (NOT recommended for production)
          const fallbackEnabled = process.env.ENABLE_FALLBACK_ACCOUNTS === 'true';
          const isDevEnvironment = process.env.NODE_ENV !== 'production';
          
          if (fallbackEnabled && isDevEnvironment) {
            console.warn('⚠️  WARNING: Using fallback accounts (development mode only)');
            
            // Fallback accounts for development ONLY
            if (login === 'admin' && password === (process.env.DEFAULT_ADMIN_PASSWORD || 'admin123')) {
                user = {
                    id: 100001,
                    username: 'admin',
                    email: 'admin@maybunga.healthcare',
                    role: 'admin',
                    firstName: 'System',
                    lastName: 'Admin',
                    accessLevel: 'Administrator'
                };
            } else if (login === 'doctor' && password === (process.env.DEFAULT_DOCTOR_PASSWORD || 'doctor123')) {
                user = {
                    id: 100002,
                    username: 'doctor',
                    email: 'doctor@maybunga.healthcare',
                    role: 'doctor',
                    firstName: 'Dr. System',
                    lastName: 'Doctor',
                    accessLevel: 'Doctor'
                };
            } else if (login === 'management' && password === (process.env.DEFAULT_MANAGEMENT_PASSWORD || 'management123')) {
                user = {
                    id: 100003,
                    username: 'management',
                    email: 'management@brgymaybunga.health',
                    role: 'management',
                    firstName: 'Management',
                    lastName: 'Dashboard',
                    accessLevel: 'Management'
                };
            } else {
                // No fallback account matched
                return res.status(400).json({ msg: 'Invalid credentials' });
            }
          } else {
            // Fallback accounts disabled - user must exist in database
            return res.status(400).json({ 
              msg: 'Invalid credentials',
              info: isDevEnvironment ? 'Fallback accounts are disabled. Please use database accounts or enable ENABLE_FALLBACK_ACCOUNTS in .env' : undefined
            });
          }
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                patientId: user.patientId || null, // Include patientId in JWT token
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' },
            async (err, token) => {
                if (err) {
                    console.error('Error signing token:', err);
                    return res.status(500).send('Server error during token generation');
                }

                // Create doctor session if user is a doctor
                if (user.role === 'doctor') {
                    try {
                        // End any existing active sessions for this doctor
                        await DoctorSession.update(
                            { 
                                status: 'offline',
                                logoutTime: new Date()
                            },
                            {
                                where: {
                                    doctorId: user.id,
                                    status: ['online', 'busy']
                                }
                            }
                        );

                        // Create new active session
                        await DoctorSession.create({
                            doctorId: user.id,
                            status: 'online',
                            loginTime: new Date(),
                            lastActivity: new Date(),
                            sessionToken: token
                        });

                        console.log(`Doctor session created for ${user.firstName} ${user.lastName} (ID: ${user.id})`);
                    } catch (sessionError) {
                        console.error('Error creating doctor session:', sessionError);
                        // Don't fail the login if session creation fails
                    }
                }
                
                // Log successful login to audit trail
                try {
                    await AuditLogger.logCustomAction(
                        { 
                            user: { id: user.id, role: user.role, firstName: user.firstName, lastName: user.lastName },
                            ip: req.ip || req.connection.remoteAddress,
                            headers: req.headers
                        },
                        'user_login',
                        `${user.firstName} ${user.lastName} logged in`,
                        {
                            targetType: 'user',
                            targetId: user.id,
                            targetName: `${user.firstName} ${user.lastName}`,
                            metadata: {
                                role: user.role,
                                loginMethod: login.includes('@') ? 'email' : 'username',
                                userAgent: req.headers['user-agent'] || 'Unknown',
                                device: req.headers['user-agent'] ? req.headers['user-agent'].split(' ')[0] : 'Unknown'
                            }
                        }
                    );
                } catch (auditError) {
                    console.error('⚠️  Failed to log login event:', auditError.message);
                    // Don't fail the login if audit logging fails
                }
                
                res.json({ 
                  token, 
                  user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    accessLevel: user.accessLevel || (user.role === 'admin' ? 'Administrator' : user.role === 'management' ? 'Management' : 'Doctor'),
                    patientId: user.patientId, // Include patientId for patient users
                    dateOfBirth: user.dateOfBirth // Include dateOfBirth for age calculation (patient users only)
                  }
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/logout
// @desc    Logout user and cleanup doctor session
// @access  Public
router.post('/logout', async (req, res) => {
  try {
    const { userId, role } = req.body;

    // If user is a doctor, update their session status to offline
    if (role === 'doctor' && userId) {
      try {
        await DoctorSession.update(
          { 
            status: 'offline',
            logoutTime: new Date(),
            currentPatientId: null
          },
          {
            where: {
              doctorId: userId,
              status: ['online', 'busy']
            }
          }
        );
        console.log(`Doctor session ended for user ID: ${userId}`);
      } catch (sessionError) {
        console.error('Error ending doctor session:', sessionError);
        // Don't fail the logout if session cleanup fails
      }
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err.message);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { firstName, lastName, email, contactNumber, position, specialization, licenseNumber, biography } = req.body;
    const userId = req.user.id;
    
    // Find user
    let user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Update user data - only update provided fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;
    if (position !== undefined) user.position = position;
    if (specialization !== undefined) user.specialization = specialization;
    if (licenseNumber !== undefined) user.licenseNumber = licenseNumber;
    if (biography !== undefined) user.biography = biography;
    
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        contactNumber: user.contactNumber,
        role: user.role,
        position: user.position,
        specialization: user.specialization,
        licenseNumber: user.licenseNumber,
        biography: user.biography
      }
    });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;

