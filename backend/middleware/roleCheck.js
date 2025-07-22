/**
 * Role-based access control middleware
 * Checks if the authenticated user has the required role(s)
 */
const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (should be set by auth middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not authenticated.'
        });
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
        });
      }

      // User has required role, continue
      next();
      
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during role verification'
      });
    }
  };
};

module.exports = roleCheck;
