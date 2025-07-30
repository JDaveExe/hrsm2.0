const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
// const { Op } = require('sequelize');
// const User = require('../models/User');

const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new user
// @access  Public
/*
router.post(
  '/register',
  [
    body('username', 'Username is required').not().isEmpty(),
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be 6 or more characters').isLength({
      min: 6,
    }),
    body('firstName', 'First name is required').not().isEmpty(),
    body('lastName', 'Last name is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, firstName, lastName, contactNumber, address } = req.body;

    try {
      let user = await User.findOne({ where: { email } });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      user = await User.create({
        username,
        email,
        password,
        role: role || 'patient',
        firstName,
        lastName,
        contactNumber,
        address,
      });

      const payload = {
        user: {
          id: user.id,
          role: user.role,
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);
*/

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

    const { login } = req.body;

    try {
        let user;

        // Hardcoded bypass logic
        if (login === 'admin') {
            user = {
                id: 1,
                username: 'admin',
                email: 'admin@maybunga.healthcare',
                role: 'admin',
                firstName: 'System',
                lastName: 'Admin',
            };
        } else if (login === 'doctor') {
            user = {
                id: 2,
                username: 'doctor',
                email: 'doctor@maybunga.healthcare',
                role: 'doctor',
                firstName: 'Dr. John',
                lastName: 'Smith',
            };
        } else {
            // For any other login, act as if credentials are invalid
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role,
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
                res.json({ token, user });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
  }
);

module.exports = router;

