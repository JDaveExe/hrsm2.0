const { verifyAccessToken, extractTokenFromHeader } = require('../config/auth');
const User = require('../models/User');

/**
 * Middleware to authenticate user using JWT token
 * Adds user object to req.user if authentication is successful
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify the token
    const decoded = verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated.'
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Handle specific JWT errors
    if (error.message.includes('expired')) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.message.includes('invalid')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Middleware to check if user has required role
 * @param {...String} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user is doctor
 */
const requireDoctor = requireRole('doctor');

/**
 * Middleware to check if user is patient
 */
const requirePatient = requireRole('patient');

/**
 * Middleware to check if user is admin or doctor
 */
const requireAdminOrDoctor = requireRole('admin', 'doctor');

/**
 * Middleware to check if user is doctor or patient (for accessing patient data)
 */
const requireDoctorOrPatient = requireRole('doctor', 'patient');

/**
 * Middleware for optional authentication
 * If token is provided, it will authenticate the user
 * If no token is provided, it will continue without authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
          req.token = token;
        }
      } catch (error) {
        // If token is invalid, just continue without authentication
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    // In optional auth, we don't fail the request
    next();
  }
};

/**
 * Middleware to check if user can access specific patient data
 * Allows:
 * - Admins to access any patient data
 * - Doctors to access their assigned patients
 * - Patients to access only their own data
 */
const canAccessPatient = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const patientId = req.params.patientId || req.params.id;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required.'
      });
    }

    // Admins can access any patient data
    if (req.user.role === 'admin') {
      return next();
    }

    // Patients can only access their own data
    if (req.user.role === 'patient') {
      const Patient = require('../models/Patient');
      const patient = await Patient.findOne({ 
        _id: patientId, 
        userId: req.user._id 
      });
      
      if (!patient) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own data.'
        });
      }
      
      req.patient = patient;
      return next();
    }

    // Doctors can access their assigned patients
    if (req.user.role === 'doctor') {
      const Appointment = require('../models/Appointment');
      const hasAppointment = await Appointment.findOne({
        patientId: patientId,
        doctorId: req.user._id
      });
      
      if (!hasAppointment) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access data of your assigned patients.'
        });
      }
      
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied.'
    });

  } catch (error) {
    console.error('Patient access check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking patient access permissions.'
    });
  }
};

/**
 * Middleware to check if user can modify specific resource
 * @param {String} resourceType - Type of resource (appointment, prescription, etc.)
 * @returns {Function} Express middleware function
 */
const canModifyResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const resourceId = req.params.id;
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required.'
        });
      }

      // Admins can modify any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // For other roles, check ownership based on resource type
      let Model;
      let ownershipField;

      switch (resourceType) {
        case 'appointment':
          Model = require('../models/Appointment');
          ownershipField = req.user.role === 'doctor' ? 'doctorId' : 'patientId';
          break;
        case 'prescription':
          Model = require('../models/Prescription');
          ownershipField = req.user.role === 'doctor' ? 'doctorId' : 'patientId';
          break;
        case 'medicalRecord':
          Model = require('../models/MedicalRecord');
          ownershipField = 'doctorId'; // Only doctors can modify medical records
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid resource type.'
          });
      }

      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${resourceType} not found.`
        });
      }

      // Check ownership
      const ownerId = resource[ownershipField];
      
      if (req.user.role === 'patient') {
        // For patients, need to check through their patient record
        const Patient = require('../models/Patient');
        const patient = await Patient.findOne({ userId: req.user._id });
        
        if (!patient || !ownerId.equals(patient._id)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only modify your own resources.'
          });
        }
      } else {
        // For doctors, direct ownership check
        if (!ownerId.equals(req.user._id)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only modify your own resources.'
          });
        }
      }

      req.resource = resource;
      next();

    } catch (error) {
      console.error('Resource modification check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource modification permissions.'
      });
    }
  };
};

/**
 * Middleware to log authentication events
 */
const logAuthEvent = (event) => {
  return (req, res, next) => {
    console.log(`[AUTH EVENT] ${event} - User: ${req.user?.email || 'Unknown'} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireDoctor,
  requirePatient,
  requireAdminOrDoctor,
  requireDoctorOrPatient,
  optionalAuth,
  canAccessPatient,
  canModifyResource,
  logAuthEvent
};
