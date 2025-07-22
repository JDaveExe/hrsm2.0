const express = require('express');
const { validationResult } = require('express-validator');
const router = express.Router();

// Import models
const SystemConfig = require('../models/SystemConfig');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// Import middleware
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { auditLogger, getAuditLogs, getAuditStats, logAction } = require('../middleware/auditLogger');

// @desc    Health check for system routes
// @route   GET /api/system/health
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'System routes are working',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
//                         SYSTEM CONFIGURATION MANAGEMENT
// =============================================================================

// @desc    Get all system configurations
// @route   GET /api/system/config
// @access  Private (Admin only)
router.get('/config', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { category } = req.query;
    
    let configs;
    if (category) {
      configs = await SystemConfig.getByCategory(category, true);
    } else {
      configs = await SystemConfig.find()
        .populate('createdBy', 'firstName lastName')
        .populate('updatedBy', 'firstName lastName')
        .sort({ category: 1, displayName: 1 });
    }
    
    // Group by category
    const groupedConfigs = configs.reduce((acc, config) => {
      if (!acc[config.category]) {
        acc[config.category] = [];
      }
      acc[config.category].push(config);
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: {
        configs: groupedConfigs,
        total: configs.length
      }
    });
    
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system configuration',
      error: error.message
    });
  }
});

// @desc    Get public system configurations
// @route   GET /api/system/config/public
// @access  Public
router.get('/config/public', async (req, res) => {
  try {
    const configs = await SystemConfig.find({ isPublic: true })
      .select('key value dataType displayName description category')
      .sort({ category: 1, displayName: 1 });
    
    // Convert to key-value pairs for easy access
    const configMap = configs.reduce((acc, config) => {
      acc[config.key] = config.formattedValue;
      return acc;
    }, {});
    
    res.status(200).json({
      success: true,
      data: configMap
    });
    
  } catch (error) {
    console.error('Get public config error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching public configuration',
      error: error.message
    });
  }
});

// @desc    Update system configuration
// @route   PUT /api/system/config/:key
// @access  Private (Admin only)
router.put('/config/:key', 
  auth, 
  roleCheck(['admin']), 
  auditLogger('system_config_changed', 'System'),
  async (req, res) => {
    try {
      const { key } = req.params;
      const { value, reason } = req.body;
      
      const config = await SystemConfig.findOne({ key });
      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        });
      }
      
      if (!config.isEditable) {
        return res.status(400).json({
          success: false,
          message: 'This configuration is not editable'
        });
      }
      
      // Validate the new value
      const validation = config.validateValue(value);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.error
        });
      }
      
      const oldValue = config.value;
      config.updateValue(value, req.user.id, reason || 'Updated via admin panel');
      await config.save();
      
      // Log the configuration change
      await logAction(req, 'system_config_changed', 'SystemConfig', config._id, {
        description: `Configuration '${config.displayName}' changed`,
        oldValue,
        newValue: value,
        reason
      });
      
      res.status(200).json({
        success: true,
        message: 'Configuration updated successfully',
        data: {
          key: config.key,
          oldValue,
          newValue: config.formattedValue,
          version: config.version
        }
      });
      
    } catch (error) {
      console.error('Update config error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating configuration',
        error: error.message
      });
    }
  }
);

// @desc    Reset configuration to default value
// @route   POST /api/system/config/:key/reset
// @access  Private (Admin only)
router.post('/config/:key/reset', 
  auth, 
  roleCheck(['admin']), 
  auditLogger('system_config_changed', 'System'),
  async (req, res) => {
    try {
      const { key } = req.params;
      const { reason } = req.body;
      
      const config = await SystemConfig.findOne({ key });
      if (!config) {
        return res.status(404).json({
          success: false,
          message: 'Configuration not found'
        });
      }
      
      if (!config.isEditable) {
        return res.status(400).json({
          success: false,
          message: 'This configuration is not editable'
        });
      }
      
      // Get the original default value from the first entry in change history
      const originalValue = config.changeHistory.length > 0 
        ? config.changeHistory[0].value 
        : config.value;
      
      const oldValue = config.value;
      config.updateValue(originalValue, req.user.id, reason || 'Reset to default value');
      await config.save();
      
      res.status(200).json({
        success: true,
        message: 'Configuration reset to default value',
        data: {
          key: config.key,
          oldValue,
          newValue: config.formattedValue,
          version: config.version
        }
      });
      
    } catch (error) {
      console.error('Reset config error:', error);
      res.status(500).json({
        success: false,
        message: 'Error resetting configuration',
        error: error.message
      });
    }
  }
);

// @desc    Get configuration change history
// @route   GET /api/system/config/:key/history
// @access  Private (Admin only)
router.get('/config/:key/history', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { key } = req.params;
    
    const config = await SystemConfig.findOne({ key })
      .populate('changeHistory.changedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }
    
    const history = [
      {
        value: config.value,
        changedBy: config.updatedBy || config.createdBy,
        changedAt: config.updatedAt || config.createdAt,
        reason: 'Current value',
        version: config.version
      },
      ...config.changeHistory.map((entry, index) => ({
        ...entry.toObject(),
        version: config.version - index - 1
      }))
    ];
    
    res.status(200).json({
      success: true,
      data: {
        config: {
          key: config.key,
          displayName: config.displayName,
          description: config.description,
          dataType: config.dataType,
          category: config.category
        },
        history
      }
    });
    
  } catch (error) {
    console.error('Get config history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching configuration history',
      error: error.message
    });
  }
});

// =============================================================================
//                         AUDIT LOG MANAGEMENT
// =============================================================================

// @desc    Get audit logs
// @route   GET /api/system/audit/logs
// @access  Private (Admin only)
router.get('/audit/logs', auth, roleCheck(['admin']), getAuditLogs);

// @desc    Get audit statistics
// @route   GET /api/system/audit/stats
// @access  Private (Admin only)
router.get('/audit/stats', auth, roleCheck(['admin']), getAuditStats);

// @desc    Get user activity logs
// @route   GET /api/system/audit/user/:userId
// @access  Private (Admin only)
router.get('/audit/user/:userId', auth, roleCheck(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      limit = 50,
      startDate,
      endDate,
      actions,
      resourceTypes
    } = req.query;
    
    const options = {
      limit: parseInt(limit),
      startDate,
      endDate
    };
    
    if (actions) {
      options.actions = actions.split(',');
    }
    
    if (resourceTypes) {
      options.resourceTypes = resourceTypes.split(',');
    }
    
    const logs = await AuditLog.getUserActivity(userId, options);
    
    res.status(200).json({
      success: true,
      data: logs
    });
    
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user activity',
      error: error.message
    });
  }
});

// =============================================================================
//                         SYSTEM MONITORING & MAINTENANCE
// =============================================================================

// @desc    Get system status and statistics
// @route   GET /api/system/status
// @access  Private (Admin only)
router.get('/status', auth, roleCheck(['admin']), async (req, res) => {
  try {
    // Database statistics
    const dbStats = {
      totalUsers: await User.countDocuments(),
      activeUsers: await User.countDocuments({ status: 'active' }),
      totalPatients: await Patient.countDocuments(),
      totalAppointments: await Appointment.countDocuments(),
      todayAppointments: await Appointment.countDocuments({
        appointmentDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    };
    
    // System performance
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
    
    // Recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = await AuditLog.countDocuments({
      timestamp: { $gte: yesterday }
    });
    
    // Error rate (last 24 hours)
    const totalRecentActions = await AuditLog.countDocuments({
      timestamp: { $gte: yesterday }
    });
    const failedRecentActions = await AuditLog.countDocuments({
      timestamp: { $gte: yesterday },
      result: 'failure'
    });
    
    const errorRate = totalRecentActions > 0 
      ? (failedRecentActions / totalRecentActions * 100).toFixed(2)
      : 0;
    
    res.status(200).json({
      success: true,
      data: {
        database: dbStats,
        system: systemInfo,
        activity: {
          last24Hours: recentActivity,
          errorRate: `${errorRate}%`,
          totalActions: totalRecentActions,
          failedActions: failedRecentActions
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Get system status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system status',
      error: error.message
    });
  }
});

// @desc    Initialize default system configurations
// @route   POST /api/system/init-config
// @access  Private (Admin only)
router.post('/init-config', 
  auth, 
  roleCheck(['admin']), 
  auditLogger('system_config_initialized', 'System'),
  async (req, res) => {
    try {
      await SystemConfig.initializeDefaults(req.user.id);
      
      await logAction(req, 'system_config_initialized', 'System', null, {
        description: 'Default system configurations initialized',
        initializedBy: req.user.id
      });
      
      res.status(200).json({
        success: true,
        message: 'Default system configurations initialized successfully'
      });
      
    } catch (error) {
      console.error('Initialize config error:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing system configurations',
        error: error.message
      });
    }
  }
);

// @desc    Clear old audit logs
// @route   DELETE /api/system/audit/cleanup
// @access  Private (Admin only)
router.delete('/audit/cleanup', 
  auth, 
  roleCheck(['admin']), 
  auditLogger('audit_logs_cleanup', 'System'),
  async (req, res) => {
    try {
      const { daysToKeep = 90 } = req.body;
      
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const result = await AuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });
      
      await logAction(req, 'audit_logs_cleanup', 'AuditLog', null, {
        description: `Cleaned up audit logs older than ${daysToKeep} days`,
        deletedCount: result.deletedCount,
        cutoffDate
      });
      
      res.status(200).json({
        success: true,
        message: `Cleaned up ${result.deletedCount} old audit log entries`,
        data: {
          deletedCount: result.deletedCount,
          cutoffDate,
          daysToKeep
        }
      });
      
    } catch (error) {
      console.error('Audit cleanup error:', error);
      res.status(500).json({
        success: false,
        message: 'Error cleaning up audit logs',
        error: error.message
      });
    }
  }
);

module.exports = router;
