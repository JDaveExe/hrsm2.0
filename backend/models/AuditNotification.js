const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Audit Notifications Model
 * Stores critical audit events that require immediate attention
 * These appear as banner alerts to admins/management
 */
const AuditNotification = sequelize.define('AuditNotification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  auditLogId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Reference to the audit log entry that triggered this notification'
  },
  severity: {
    type: DataTypes.ENUM('critical', 'high', 'medium'),
    allowNull: false,
    defaultValue: 'high',
    comment: 'Severity level: critical (deletions, security), high (creation), medium (changes)'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Short alert title'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Detailed alert message'
  },
  actionType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Type of action that triggered the alert'
  },
  performedBy: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Name of user who performed the action'
  },
  performedByRole: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Role of user who performed the action'
  },
  targetInfo: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Information about the target (patient name, user name, etc.)'
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether notification has been marked as read'
  },
  isDismissed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether notification has been dismissed'
  },
  dismissedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'User ID who dismissed the notification'
  },
  dismissedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When notification was dismissed'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Auto-dismiss after this time (default 24 hours)'
  }
}, {
  tableName: 'audit_alert_notifications',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    {
      fields: ['isRead', 'isDismissed']
    },
    {
      fields: ['severity']
    },
    {
      fields: ['actionType']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

/**
 * Create a notification for a critical audit event
 * @param {Object} auditLog - The audit log entry
 * @param {string} severity - Notification severity
 * @returns {Promise<AuditNotification>}
 */
AuditNotification.createFromAuditLog = async function(auditLog, severity = 'high') {
  // Auto-expire after 24 hours
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Create notification title and message based on action type
  let title, message;
  
  switch (auditLog.action) {
    case 'removed_patient':
    case 'deleted_patient':
      title = '🚨 Patient Record Deleted';
      message = `${auditLog.userName} deleted patient record: ${auditLog.targetName}`;
      severity = 'critical';
      break;
      
    case 'deleted_user':
      title = '⚠️ User Account Deleted';
      message = `${auditLog.userName} deleted user account: ${auditLog.targetName} (${auditLog.metadata?.deletedUserRole || 'unknown role'})`;
      severity = 'critical';
      break;
      
    case 'created_user':
    case 'added_new_user':
      title = '👤 New User Created';
      message = `${auditLog.userName} created new ${auditLog.metadata?.newUserRole || 'user'}: ${auditLog.targetName}`;
      severity = 'high';
      break;
      
    case 'failed_login':
      title = '🔐 Failed Login Attempt';
      message = `Failed login attempt for ${auditLog.targetName || 'unknown user'}`;
      severity = 'high';
      break;
      
    case 'transferred_patient':
      title = '🔄 Patient Transferred';
      message = `${auditLog.userName} transferred ${auditLog.targetName} to Dr. ${auditLog.metadata?.doctorName || 'unknown'}`;
      severity = 'medium';
      break;
      
    default:
      title = '📋 Audit Event';
      message = auditLog.actionDescription;
  }

  return await this.create({
    auditLogId: auditLog.id,
    severity,
    title,
    message,
    actionType: auditLog.action,
    performedBy: auditLog.userName,
    performedByRole: auditLog.userRole,
    targetInfo: {
      targetType: auditLog.targetType,
      targetId: auditLog.targetId,
      targetName: auditLog.targetName,
      metadata: auditLog.metadata
    },
    expiresAt
  });
};

/**
 * Get active notifications (not dismissed and not expired)
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
AuditNotification.getActiveNotifications = async function(options = {}) {
  const { severity, limit = 50 } = options;
  
  const where = {
    isDismissed: false,
    [require('sequelize').Op.or]: [
      { expiresAt: null },
      { expiresAt: { [require('sequelize').Op.gt]: new Date() } }
    ]
  };
  
  if (severity) {
    where.severity = severity;
  }
  
  return await this.findAll({
    where,
    order: [
      ['severity', 'DESC'], // critical first
      ['createdAt', 'DESC']
    ],
    limit
  });
};

/**
 * Dismiss a notification
 * @param {number} notificationId - Notification ID
 * @param {number} userId - User ID who dismissed it
 * @returns {Promise<AuditNotification>}
 */
AuditNotification.dismiss = async function(notificationId, userId) {
  const notification = await this.findByPk(notificationId);
  
  if (!notification) {
    throw new Error('Notification not found');
  }
  
  await notification.update({
    isDismissed: true,
    dismissedBy: userId,
    dismissedAt: new Date()
  });
  
  return notification;
};

/**
 * Mark notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<AuditNotification>}
 */
AuditNotification.markAsRead = async function(notificationId) {
  const notification = await this.findByPk(notificationId);
  
  if (!notification) {
    throw new Error('Notification not found');
  }
  
  await notification.update({ isRead: true });
  return notification;
};

/**
 * Auto-cleanup expired notifications
 */
AuditNotification.cleanupExpired = async function() {
  const now = new Date();
  
  const result = await this.update(
    { isDismissed: true },
    {
      where: {
        isDismissed: false,
        expiresAt: {
          [require('sequelize').Op.lt]: now
        }
      }
    }
  );
  
  return result[0]; // Returns count of updated records
};

module.exports = AuditNotification;
