const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Use a fallback secret if JWT_SECRET is not set in environment
const JWT_SECRET = process.env.JWT_SECRET || 'my_secret_key_for_healthcare_app_2025_07';

const auth = async (req, res, next) => {
  try {
    // Check for token in various places
    const token = 
      req.header('x-auth-token') || 
      req.header('Authorization')?.replace('Bearer ', '') ||
      req.cookies?.token;

    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Temporary bypass for testing
    if (token === 'temp-admin-token') {
      req.user = {
        id: 1,
        email: 'admin@maybunga.health',
        role: 'Admin'
      };
      console.log('Using temporary admin token');
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded.user;
      console.log('Auth successful for user:', req.user.email);
      next();
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError.message);
      return res.status(401).json({ msg: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = auth;
