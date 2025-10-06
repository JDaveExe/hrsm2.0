const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { authenticateToken: auth, requireRole } = require('../middleware/auth');
const { AuditNotification, AuditLog } = require('../models');

const router = express.Router();

/**
 * @route   GET /api/audit-notifications
 * @desc    Get active audit notifications
 * @access  Private - Admin and Management only
 */
router.get('/', [
  auth,
  requireRole(['admin', 'management']),
  query('severity').optional().isIn(['critical', 'high', 'medium']).withMessage('Invalid severity'),
  query('includeRead').optional().isBoolean().withMessage('includeRead must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        msg: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { severity, includeRead } = req.query;

    // Get active notifications
    const notifications = await AuditNotification.getActiveNotifications({ severity });

    // Filter out read notifications if requested
    let filteredNotifications = notifications;
    if (includeRead === 'false') {
      filteredNotifications = notifications.filter(n => !n.isRead);
    }

    res.json({
      success: true,
      data: filteredNotifications,
      count: filteredNotifications.length,
      unreadCount: notifications.filter(n => !n.isRead).length
    });

  } catch (error) {
    console.error('❌ Error fetching audit notifications:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/audit-notifications/critical
 * @desc    Get only critical notifications (for banner alerts)
 * @access  Private - Admin and Management only
 */
router.get('/critical', [
  auth,
  requireRole(['admin', 'management'])
], async (req, res) => {
  try {
    const notifications = await AuditNotification.getActiveNotifications({ 
      severity: 'critical' 
    });

    // Only return undismissed critical notifications
    const activeAlerts = notifications.filter(n => !n.isDismissed);

    res.json({
      success: true,
      data: activeAlerts,
      count: activeAlerts.length
    });

  } catch (error) {
    console.error('❌ Error fetching critical notifications:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while fetching critical notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/audit-notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private - Admin and Management only
 */
router.put('/:id/read', [
  auth,
  requireRole(['admin', 'management']),
  param('id').isInt().withMessage('Invalid notification ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        msg: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;

    const notification = await AuditNotification.markAsRead(parseInt(id));

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({ 
        success: false,
        msg: error.message 
      });
    }

    console.error('❌ Error marking notification as read:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while marking notification as read',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/audit-notifications/:id/dismiss
 * @desc    Dismiss a notification
 * @access  Private - Admin and Management only
 */
router.put('/:id/dismiss', [
  auth,
  requireRole(['admin', 'management']),
  param('id').isInt().withMessage('Invalid notification ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        msg: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    const notification = await AuditNotification.dismiss(parseInt(id), userId);

    res.json({
      success: true,
      message: 'Notification dismissed',
      data: notification
    });

  } catch (error) {
    if (error.message === 'Notification not found') {
      return res.status(404).json({ 
        success: false,
        msg: error.message 
      });
    }

    console.error('❌ Error dismissing notification:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while dismissing notification',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   PUT /api/audit-notifications/dismiss-all
 * @desc    Dismiss all notifications
 * @access  Private - Admin and Management only
 */
router.put('/dismiss-all', [
  auth,
  requireRole(['admin', 'management'])
], async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all active notifications
    const notifications = await AuditNotification.getActiveNotifications({});
    
    // Dismiss each one
    const dismissPromises = notifications.map(notification => 
      AuditNotification.dismiss(notification.id, userId)
    );
    
    await Promise.all(dismissPromises);

    res.json({
      success: true,
      message: `Dismissed ${notifications.length} notifications`,
      count: notifications.length
    });

  } catch (error) {
    console.error('❌ Error dismissing all notifications:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while dismissing notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/audit-notifications/cleanup
 * @desc    Cleanup expired notifications (admin utility)
 * @access  Private - Admin only
 */
router.post('/cleanup', [
  auth,
  requireRole(['admin'])
], async (req, res) => {
  try {
    const count = await AuditNotification.cleanupExpired();

    res.json({
      success: true,
      message: `Cleaned up ${count} expired notifications`,
      count
    });

  } catch (error) {
    console.error('❌ Error cleaning up notifications:', error);
    res.status(500).json({ 
      success: false,
      msg: 'Server error while cleaning up notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
