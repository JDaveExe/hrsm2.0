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
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format'),
    body('phoneNumber').optional({ checkFalsy: true }).isMobilePhone('en-PH').withMessage('Invalid phone number format'),
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
      barangay,
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
      const username = email || phoneNumber;
      if (!username) {
        return res.status(400).json({ msg: 'Either email or phone number is required' });
      }

      // Check if user already exists
      let user = await User.findOne({
        where: {
          [Op.or]: [
            { email: email || null },
            { contactNumber: phoneNumber || null }
          ]
        }
      });

      if (user) {
        return res.status(400).json({ msg: 'User already exists with this email or phone number' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new User
      user = await User.create({
        username: username,
        email: email || null,
        contactNumber: phoneNumber || null,
        password: hashedPassword,
        role: 'patient',
        firstName: firstName,
        lastName: lastName
      });

      // Generate QR code token
      const qrCode = `${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

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
        houseNo,
        street,
        barangay,
        city,
        region,
        philHealthNumber,
        familyId: null, // Ensures the patient is unsorted
        qrCode: qrCode
      });

      // Create JWT payload
      const payload = {
        user: {
          id: user.id,
          role: user.role,
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
              qrCode: patient.qrCode
            }
          });
        }
      );
    } catch (err) {
      console.error('Registration error:', err.message);
      res.status(500).send('Server error during registration');
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
                  { email: login }
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
          
          // For patient users, fetch the associated Patient record to get patientId
          if (user.role === 'patient') {
            const patient = await Patient.findOne({
              where: { userId: user.id }
            });
            if (patient) {
              user.patientId = patient.id;
            }
          }
        } else {
          // Fallback to hardcoded bypass logic for development
          if (login === 'admin' && password === 'admin123') {
              user = {
                  id: 100001, // Use very high ID to avoid conflicts
                  username: 'admin',
                  email: 'admin@maybunga.healthcare',
                  role: 'admin',
                  firstName: 'System',
                  lastName: 'Admin',
                  accessLevel: 'Administrator'
              };
          } else if (login === 'doctor' && password === 'doctor123') {
              user = {
                  id: 100002, // Use very high ID to avoid conflicts
                  username: 'doctor',
                  email: 'doctor@maybunga.healthcare',
                  role: 'doctor',
                  firstName: 'Dr. John',
                  lastName: 'Smith',
                  accessLevel: 'Doctor'
              };
          } else if (login === 'patient' && password === 'patient123') {
              user = {
                  id: 47, // Use Josuke's User ID
                  username: 'patient',
                  email: 'jojojosuke@gmail.com', // Use Josuke's email
                  role: 'patient',
                  firstName: 'Josuke',
                  lastName: 'Joestar',
                  accessLevel: 'Patient',
                  patientId: 40 // Use Josuke's Patient ID
              };
          } else if (login === 'management' && password === 'management123') {
              user = {
                  id: 100003, // Use very high ID to avoid conflicts
                  username: 'management',
                  email: 'management@brgymaybunga.health',
                  role: 'management',
                  firstName: 'Management',
                  lastName: 'Dashboard',
                  accessLevel: 'Management'
              };
          } else {
              // For any other login, act as if credentials are invalid
              return res.status(400).json({ msg: 'Invalid credentials' });
          }
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role,
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
                    patientId: user.patientId // Include patientId for patient users
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

module.exports = router;

