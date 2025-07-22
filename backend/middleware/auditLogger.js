const AuditLog = require('../models/AuditLog');

/**
 * Audit logging middleware factory
 * Creates middleware that logs specific actions
 */
const auditLogger = (action, resourceType) => {
  return async (req, res, next) => {
    // Store original res.json to intercept responses
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the action after response
      setImmediate(async () => {
        try {
          const logData = {
            userId: req.user ? req.user.id : null,
            action,
            resourceType,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            requestMethod: req.method,
            requestUrl: req.originalUrl,
            result: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure'
          };
          
          // Extract resource ID from various sources
          if (req.params.id) {
            logData.resourceId = req.params.id;
          } else if (data && data.data && data.data._id) {
            logData.resourceId = data.data._id;
          } else if (data && data.data && data.data.id) {
            logData.resourceId = data.data.id;
          }
          
          // Add details based on the action
          logData.details = {
            description: `${action} performed via ${req.method} ${req.originalUrl}`,
            requestBody: req.method !== 'GET' ? sanitizeRequestBody(req.body) : undefined,
            responseStatus: res.statusCode
          };
          
          // Add error message if request failed
          if (logData.result === 'failure' && data && data.message) {
            logData.errorMessage = data.message;
          }
          
          await AuditLog.logAction(logData);
        } catch (error) {
          console.error('Audit logging error:', error);
          // Don't let audit logging errors affect the main response
        }
      });
      
      // Call original res.json
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Manual audit logging function
 * Use this for logging actions that don't happen through standard API endpoints
 */
const logAction = async (req, action, resourceType, resourceId = null, details = {}) => {
  try {
    const logData = {
      userId: req.user ? req.user.id : null,
      action,
      resourceType,
      resourceId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      result: 'success',
      details: {
        description: details.description || `${action} performed`,
        ...details
      }
    };
    
    await AuditLog.logAction(logData);
  } catch (error) {
    console.error('Manual audit logging error:', error);
  }
};

/**
 * Log authentication events
 */
const logAuth = async (req, action, userId = null, details = {}) => {
  try {
    const logData = {
      userId,
      action,
      resourceType: 'User',
      resourceId: userId,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      result: details.success ? 'success' : 'failure',
      details: {
        description: details.description || action,
        ...details
      }
    };
    
    if (!details.success && details.error) {
      logData.errorMessage = details.error;
    }
    
    await AuditLog.logAction(logData);
  } catch (error) {
    console.error('Auth audit logging error:', error);
  }
};

/**
 * Log bulk operations
 */
const logBulkOperation = async (req, action, resourceType, resourceIds = [], details = {}) => {
  try {
    const logData = {
      userId: req.user ? req.user.id : null,
      action: 'bulk_operation_performed',
      resourceType,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      requestMethod: req.method,
      requestUrl: req.originalUrl,
      result: 'success',
      details: {
        description: `Bulk operation: ${action}`,
        bulkAction: action,
        affectedResources: resourceIds.length,
        resourceIds: resourceIds.slice(0, 100), // Limit to first 100 IDs
        ...details
      }
    };
    
    await AuditLog.logAction(logData);
  } catch (error) {
    console.error('Bulk operation audit logging error:', error);
  }
};

/**
 * Sanitize request body to remove sensitive information
 */
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = ['password', 'confirmPassword', 'oldPassword', 'newPassword'];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Get audit logs with filtering
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      result
    } = req.query;
    
    const filter = {};
    
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;
    if (result) filter.result = result;
    
    if (startDate && endDate) {
      filter.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const skip = (page - 1) * limit;
    const total = await AuditLog.countDocuments(filter);
    const pages = Math.ceil(total / limit);
    
    const logs = await AuditLog.find(filter)
      .populate('userId', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        }
      }
    });
    
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit logs',
      error: error.message
    });
  }
};

/**
 * Get audit statistics
 */
const getAuditStats = async (req, res) => {
  try {
    const { 
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      endDate = new Date()
    } = req.query;
    
    const filter = {
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Get activity summary
    const activitySummary = await AuditLog.getSystemActivity({ startDate, endDate });
    
    // Get user activity stats
    const userActivityPipeline = [
      { $match: filter },
      {
        $group: {
          _id: '$userId',
          actionCount: { $sum: 1 },
          lastActivity: { $max: '$timestamp' }
        }
      },
      { $sort: { actionCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, email: 1, role: 1 } }
          ]
        }
      },
      { $unwind: '$user' }
    ];
    
    const userActivity = await AuditLog.aggregate(userActivityPipeline);
    
    // Get error rate
    const totalActions = await AuditLog.countDocuments(filter);
    const failedActions = await AuditLog.countDocuments({ ...filter, result: 'failure' });
    const errorRate = totalActions > 0 ? (failedActions / totalActions * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalActions,
          failedActions,
          errorRate: `${errorRate}%`,
          dateRange: {
            startDate,
            endDate
          }
        },
        activitySummary,
        topUsers: userActivity
      }
    });
    
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching audit statistics',
      error: error.message
    });
  }
};

module.exports = {
  auditLogger,
  logAction,
  logAuth,
  logBulkOperation,
  getAuditLogs,
  getAuditStats,
  sanitizeRequestBody
};
