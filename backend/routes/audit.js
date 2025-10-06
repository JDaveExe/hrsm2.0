const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { authenticateToken: auth, requireRole } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');
const { sequelize } = require('../config/database');

const router = express.Router();

/**
 * @route   GET /api/audit/logs
 * @desc    Get audit logs with filtering and pagination
 * @access  Private - Admin, Management, and Doctors (limited access)
 */
router.get('/logs', [
  auth,
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('userRole').optional().isIn(['admin', 'doctor', 'management', 'staff', 'patient']).withMessage('Invalid user role'),
  query('action').optional().isString().withMessage('Action must be a string'),
  query('targetType').optional().isIn(['patient', 'user', 'medication', 'vaccine', 'appointment', 'checkup', 'report']).withMessage('Invalid target type'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
  query('search').optional().isString().isLength({ max: 255 }).withMessage('Search term too long')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        msg: 'Validation failed', 
        errors: errors.array() 
      });
    }

    // Role-based access control
    const userRole = req.user.role.toLowerCase();
    
    // Only admin, management, and doctors can view audit logs
    if (!['admin', 'management', 'doctor'].includes(userRole)) {
      return res.status(403).json({ 
        msg: 'Access denied. Insufficient permissions to view audit logs.' 
      });
    }

    // Extract query parameters
    const {
      page = 1,
      limit = 50,
      userRole: filterRole,
      action,
      targetType,
      startDate,
      endDate,
      search
    } = req.query;

    // Doctors can only see their own actions and patient-related actions
    let roleFilter = filterRole;
    if (userRole === 'doctor' && !filterRole) {
      // Limit doctors to see only doctor actions and patient-related activities
      roleFilter = 'doctor';
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      userRole: roleFilter,
      action,
      targetType,
      startDate,
      endDate,
      search
    };

    // If doctor is requesting, add additional constraints
    if (userRole === 'doctor') {
      // Doctors can only see their own actions or general patient activities
      options.userId = req.user.id; // Only show their own actions
    }

    const result = await AuditLog.getAuditLogs(options);

    // Log that someone viewed audit logs - AGGREGATED APPROACH
    // Only log once per user per hour to avoid cluttering audit logs
    const AuditLogger = require('../utils/auditLogger');
    
    // Check if user already viewed logs in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentView = await AuditLog.findOne({
      where: {
        userId: req.user.id,
        action: 'viewed_audit_logs',
        timestamp: {
          [require('sequelize').Op.gte]: oneHourAgo
        }
      },
      order: [['timestamp', 'DESC']]
    });

    if (!recentView) {
      // First view in the past hour - create new log entry
      await AuditLogger.logCustomAction(req, 'viewed_audit_logs', 
        'Viewed audit logs', {
          targetType: 'audit',
          metadata: {
            filters: options,
            resultsCount: result.auditLogs.length,
            viewCount: 1
          }
        });
    } else {
      // Update the existing log entry with incremented count
      // Parse metadata if it's a string, otherwise use it as-is
      let existingMetadata = recentView.metadata;
      if (typeof existingMetadata === 'string') {
        try {
          existingMetadata = JSON.parse(existingMetadata);
        } catch (e) {
          existingMetadata = {};
        }
      }
      
      const currentCount = existingMetadata?.viewCount || 1;
      const newCount = currentCount + 1;
      
      await recentView.update({
        timestamp: new Date(), // Update to latest view time
        metadata: JSON.stringify({
          viewCount: newCount,
          lastFilters: options,
          lastResultsCount: result.auditLogs.length,
          firstViewedAt: existingMetadata?.firstViewedAt || recentView.timestamp
        }),
        actionDescription: `Viewed audit logs (${newCount} times in the last hour)`
      });
    }

    res.json({
      success: true,
      data: result,
      message: `Retrieved ${result.auditLogs.length} audit log entries`
    });

  } catch (error) {
    console.error('❌ Error retrieving audit logs:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while retrieving audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/audit/logs/:id
 * @desc    Get specific audit log entry by ID
 * @access  Private - Admin and Management only
 */
router.get('/logs/:id', [
  auth,
  requireRole(['admin', 'management'])
], async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        msg: 'Invalid audit log ID' 
      });
    }

    const auditLog = await AuditLog.findByPk(id, {
      include: [{
        model: require('../models/User'),
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role']
      }]
    });

    if (!auditLog) {
      return res.status(404).json({ 
        success: false,
        msg: 'Audit log entry not found' 
      });
    }

    res.json({
      success: true,
      data: auditLog,
      message: 'Audit log entry retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error retrieving audit log entry:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while retrieving audit log entry',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/audit/stats
 * @desc    Get audit log statistics
 * @access  Private - Admin and Management only
 */
router.get('/stats', [
  auth,
  requireRole(['admin', 'management'])
], async (req, res) => {
  try {
    const { sequelize } = require('../config/database');
    
    // Get basic statistics
    const totalLogs = await AuditLog.count();
    
    // Get logs by role
    const logsByRole = await AuditLog.findAll({
      attributes: [
        'userRole',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['userRole'],
      raw: true
    });

    // Get logs by action
    const logsByAction = await AuditLog.findAll({
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['action'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Get recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentActivity = await AuditLog.count({
      where: {
        timestamp: {
          [sequelize.Sequelize.Op.gte]: yesterday
        }
      }
    });

    // Get most active users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await AuditLog.findAll({
      attributes: [
        'userId',
        'userName',
        'userRole',
        [sequelize.fn('COUNT', sequelize.col('id')), 'actionCount']
      ],
      where: {
        timestamp: {
          [sequelize.Sequelize.Op.gte]: thirtyDaysAgo
        }
      },
      group: ['userId', 'userName', 'userRole'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalLogs,
        logsByRole,
        logsByAction,
        recentActivity,
        activeUsers
      },
      message: 'Audit statistics retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error retrieving audit statistics:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while retrieving audit statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/audit/export
 * @desc    Export audit logs as CSV
 * @access  Private - Admin only
 */
router.get('/export', [
  auth,
  requireRole(['admin']),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO8601 date'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid ISO8601 date'),
  query('userRole').optional().isIn(['admin', 'doctor', 'management', 'staff', 'patient']).withMessage('Invalid user role'),
  query('action').optional().isString().withMessage('Action must be a string')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        msg: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { startDate, endDate, userRole, action } = req.query;

    // Build where clause for filtering
    const whereClause = {};
    
    if (userRole) {
      whereClause.userRole = userRole;
    }
    
    if (action) {
      whereClause.action = action;
    }
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        [require('sequelize').Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.timestamp = {
        [require('sequelize').Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.timestamp = {
        [require('sequelize').Op.lte]: new Date(endDate)
      };
    }

    const auditLogs = await AuditLog.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: 10000 // Reasonable limit for export
    });

    // Convert to CSV format
    const csvHeaders = 'Timestamp,User Name,User Role,Action,Description,Target Type,Target Name,IP Address\n';
    const csvData = auditLogs.map(log => {
      return [
        log.timestamp.toISOString(),
        log.userName.replace(/,/g, ';'), // Replace commas to avoid CSV issues
        log.userRole,
        log.action,
        log.actionDescription.replace(/,/g, ';'), // Replace commas
        log.targetType || '',
        log.targetName ? log.targetName.replace(/,/g, ';') : '',
        log.ipAddress || ''
      ].join(',');
    }).join('\n');

    const csvContent = csvHeaders + csvData;

    // Set response headers for file download
    const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Log the export action
    const AuditLogger = require('../utils/auditLogger');
    await AuditLogger.logCustomAction(req, 'exported_audit_logs', 
      `${req.user.firstName} ${req.user.lastName} exported audit logs`, {
        targetType: 'audit',
        metadata: {
          exportCount: auditLogs.length,
          filters: { startDate, endDate, userRole, action },
          filename
        }
      });

    res.send(csvContent);

  } catch (error) {
    console.error('❌ Error exporting audit logs:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while exporting audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   DELETE /api/audit/logs/cleanup
 * @desc    Clean up old audit logs (Admin only)
 * @access  Private - Admin only
 */
router.delete('/logs/cleanup', [
  auth,
  requireRole(['admin']),
  body('daysToKeep').isInt({ min: 30, max: 365 }).withMessage('Days to keep must be between 30 and 365')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        msg: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { daysToKeep } = req.body;
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Count logs to be deleted
    const countToDelete = await AuditLog.count({
      where: {
        timestamp: {
          [require('sequelize').Op.lt]: cutoffDate
        }
      }
    });

    // Delete old logs
    const deletedCount = await AuditLog.destroy({
      where: {
        timestamp: {
          [require('sequelize').Op.lt]: cutoffDate
        }
      }
    });

    // Log the cleanup action
    const AuditLogger = require('../utils/auditLogger');
    await AuditLogger.logCustomAction(req, 'cleaned_audit_logs', 
      `${req.user.firstName} ${req.user.lastName} cleaned up ${deletedCount} old audit logs`, {
        targetType: 'audit',
        metadata: {
          deletedCount,
          daysToKeep,
          cutoffDate: cutoffDate.toISOString()
        }
      });

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} old audit log entries`,
      data: {
        deletedCount,
        daysToKeep,
        cutoffDate
      }
    });

  } catch (error) {
    console.error('❌ Error cleaning up audit logs:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while cleaning up audit logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/audit/login-history
 * @desc    Get login history for the authenticated user (patient-focused)
 * @access  Private - Patient users
 */
router.get('/login-history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    
    // Fetch login events for this user
    const loginHistory = await AuditLog.findAll({
      where: {
        userId: userId,
        action: 'user_login'
      },
      order: [['timestamp', 'DESC']],
      limit: 50, // Last 50 logins
      attributes: ['id', 'timestamp', 'ipAddress', 'userAgent', 'metadata']
    });

    // Format the response
    const formattedHistory = loginHistory.map(log => {
      let metadata = log.metadata;
      
      // Parse metadata if it's a string
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          metadata = {};
        }
      }

      // Extract device information from user agent
      const userAgent = log.userAgent || 'Unknown';
      let device = 'Desktop';
      let browser = 'Unknown Browser';
      
      if (userAgent.toLowerCase().includes('mobile')) {
        device = 'Mobile';
      } else if (userAgent.toLowerCase().includes('tablet')) {
        device = 'Tablet';
      }
      
      if (userAgent.includes('Chrome')) {
        browser = 'Chrome';
      } else if (userAgent.includes('Firefox')) {
        browser = 'Firefox';
      } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        browser = 'Safari';
      } else if (userAgent.includes('Edge')) {
        browser = 'Edge';
      }
      
      return {
        id: log.id,
        date: log.timestamp.toISOString().split('T')[0],
        time: log.timestamp.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        device: `${device} - ${browser}`,
        location: log.ipAddress || 'Unknown',
        timestamp: log.timestamp,
        fullUserAgent: userAgent
      };
    });

    res.json({
      success: true,
      data: formattedHistory,
      count: formattedHistory.length,
      message: `Retrieved ${formattedHistory.length} login records`
    });

  } catch (error) {
    console.error('❌ Error retrieving login history:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while retrieving login history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/audit/actions
 * @desc    Get unique action types from audit logs
 * @access  Private - Admin, Management
 */
router.get('/actions', auth, async (req, res) => {
  try {
    // Check if user has permission
    const userRole = req.user.role.toLowerCase();
    if (!['admin', 'management'].includes(userRole)) {
      return res.status(403).json({ 
        msg: 'Access denied. Insufficient permissions.' 
      });
    }

    // Get unique action types from database
    const { Op } = require('sequelize');
    const actions = await AuditLog.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('action')), 'action']],
      where: {
        action: { [Op.ne]: null }
      },
      order: [['action', 'ASC']],
      raw: true
    });

    const actionList = actions.map(a => a.action).filter(Boolean);

    res.json({
      success: true,
      data: actionList,
      count: actionList.length
    });

  } catch (error) {
    console.error('Error fetching action types:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to fetch action types',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/audit/target-types
 * @desc    Get unique target types from audit logs
 * @access  Private - Admin, Management
 */
router.get('/target-types', auth, async (req, res) => {
  try {
    // Check if user has permission
    const userRole = req.user.role.toLowerCase();
    if (!['admin', 'management'].includes(userRole)) {
      return res.status(403).json({ 
        msg: 'Access denied. Insufficient permissions.' 
      });
    }

    // Get unique target types from database
    const { Op } = require('sequelize');
    const targetTypes = await AuditLog.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('targetType')), 'targetType']],
      where: {
        targetType: { [Op.ne]: null }
      },
      order: [['targetType', 'ASC']],
      raw: true
    });

    const typeList = targetTypes.map(t => t.targetType).filter(Boolean);

    res.json({
      success: true,
      data: typeList,
      count: typeList.length
    });

  } catch (error) {
    console.error('Error fetching target types:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to fetch target types',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/audit/log-report
 * @desc    Log report generation from frontend
 * @access  Private
 */
router.post('/log-report', auth, async (req, res) => {
  try {
    const { reportType, reportDetails } = req.body;
    
    if (!reportType) {
      return res.status(400).json({ 
        success: false,
        msg: 'Report type is required' 
      });
    }

    const AuditLogger = require('../utils/auditLogger');
    await AuditLogger.logReportGeneration(req, reportType, reportDetails || {});

    res.json({
      success: true,
      msg: 'Report generation logged successfully'
    });

  } catch (error) {
    console.error('Error logging report generation:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Failed to log report generation',
      error: error.message 
    });
  }
});

module.exports = router;