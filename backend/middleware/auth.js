const jwt = require('jsonwebtoken');
const User = require('../models/User');

// SECURITY: Use environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables!');
  console.warn('⚠️  Using fallback secret - THIS IS INSECURE FOR PRODUCTION!');
  return 'my_secret_key_for_healthcare_app_2025_07';
})();

const auth = async (req, res, next) => {
  try {
    console.log('🔐 Auth middleware started');
    console.log('🔐 Headers received:', Object.keys(req.headers));
    console.log('🔐 x-auth-token:', req.header('x-auth-token'));
    console.log('🔐 Authorization header:', req.header('Authorization'));
    
    // Check for token in various places
    const token = 
      req.header('x-auth-token') || 
      req.header('Authorization')?.replace('Bearer ', '') ||
      req.cookies?.token;

    console.log('🔐 Final extracted token:', token ? `${token.substring(0, 20)}...` : 'None');

    if (!token) {
      console.log('🔐 No token found, authorization denied');
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // TEMPORARY bypass for development - REMOVE IN PRODUCTION
    if (token === 'temp-admin-token' && process.env.NODE_ENV !== 'production') {
      console.log('🔐 Using temporary admin token');
      req.user = {
        id: 10020, // Use actual admin user ID from database
        email: 'admin@brgymaybunga.health',
        role: 'admin'
      };
      return next();
    }

    try {
      console.log('🔐 Attempting to verify JWT token');
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('🔐 JWT decoded successfully:', decoded.user);
      req.user = decoded.user;
      next();
    } catch (jwtError) {
      console.error('🔐 JWT verification failed:', jwtError.message);
      console.log('🔐 Failed token:', token.substring(0, 50) + '...');
      return res.status(401).json({ msg: 'Token is not valid' });
    }
  } catch (err) {
    console.error('🔐 Auth middleware error:', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    try {
      // Check if user exists from previous auth middleware
      if (!req.user) {
        return res.status(401).json({ msg: 'Access denied. No user found.' });
      }

      // Check if user has required role
      const userRole = req.user.role || req.user.Role; // Handle both formats
      if (!roles.includes(userRole.toLowerCase()) && !roles.includes(userRole)) {
        return res.status(403).json({ 
          msg: 'Access denied. Insufficient permissions.',
          required: roles,
          current: userRole
        });
      }

      next();
    } catch (err) {
      console.error('Role authorization error:', err.message);
      res.status(500).json({ msg: 'Authorization error' });
    }
  };
};

// Export both middleware functions
module.exports = {
  authenticateToken: auth,
  requireRole
};
