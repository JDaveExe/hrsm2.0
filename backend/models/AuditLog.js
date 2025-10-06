const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of the user who performed the action'
  },
  userRole: {
    type: DataTypes.ENUM('admin', 'doctor', 'management', 'staff', 'patient'),
    allowNull: false,
    comment: 'Role of the user who performed the action'
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Full name of the user who performed the action'
  },
  action: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'The action performed (e.g., "removed_patient", "checked_in_patient")'
  },
  actionDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Human-readable description of the action'
  },
  targetType: {
    type: DataTypes.ENUM('patient', 'user', 'medication', 'vaccine', 'appointment', 'checkup', 'report'),
    allowNull: true,
    comment: 'Type of entity that was affected by the action'
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the entity that was affected'
  },
  targetName: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Name/identifier of the affected entity'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data related to the action (medications, vaccines, etc.)'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address of the user when action was performed'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Browser/client information'
  },
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Session ID when action was performed'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When the action was performed'
  }
}, {
  tableName: 'audit_logs',
  timestamps: false, // We're using custom timestamp field
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['userRole']
    },
    {
      fields: ['action']
    },
    {
      fields: ['targetType', 'targetId']
    },
    {
      fields: ['timestamp']
    },
    {
      fields: ['timestamp', 'userRole'] // Composite index for common queries
    }
  ]
});

// Static method to create audit log entries
AuditLog.logAction = async function(actionData) {
  try {
    // Validate required fields
    if (!actionData.userId || !actionData.userRole || !actionData.userName || !actionData.action || !actionData.actionDescription) {
      throw new Error('Missing required audit log fields');
    }

    // Create the audit log entry
    const auditEntry = await this.create({
      userId: actionData.userId,
      userRole: actionData.userRole,
      userName: actionData.userName,
      action: actionData.action,
      actionDescription: actionData.actionDescription,
      targetType: actionData.targetType || null,
      targetId: actionData.targetId || null,
      targetName: actionData.targetName || null,
      metadata: actionData.metadata || null,
      ipAddress: actionData.ipAddress || null,
      userAgent: actionData.userAgent || null,
      sessionId: actionData.sessionId || null,
      timestamp: actionData.timestamp || new Date()
    });

    console.log(`✅ Audit log created: ${actionData.action} by ${actionData.userName}`);
    return auditEntry;
  } catch (error) {
    console.error('❌ Failed to create audit log:', error);
    // Don't throw error to prevent disrupting the main application flow
    return null;
  }
};

// Static method to get audit logs with filtering and pagination
AuditLog.getAuditLogs = async function(options = {}) {
  try {
    const {
      page = 1,
      limit = 50,
      userRole = null,
      action = null,
      targetType = null,
      startDate = null,
      endDate = null,
      search = null
    } = options;

    const whereClause = {};
    
    if (userRole) {
      whereClause.userRole = userRole;
    }
    
    if (action) {
      whereClause.action = action;
    }
    
    if (targetType) {
      whereClause.targetType = targetType;
    }
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        [sequelize.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.timestamp = {
        [sequelize.Sequelize.Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.timestamp = {
        [sequelize.Sequelize.Op.lte]: new Date(endDate)
      };
    }
    
    if (search) {
      whereClause[sequelize.Sequelize.Op.or] = [
        { userName: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
        { actionDescription: { [sequelize.Sequelize.Op.like]: `%${search}%` } },
        { targetName: { [sequelize.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const result = await this.findAndCountAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      auditLogs: result.rows,
      totalCount: result.count,
      totalPages: Math.ceil(result.count / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(result.count / limit),
      hasPreviousPage: page > 1
    };
  } catch (error) {
    console.error('❌ Failed to retrieve audit logs:', error);
    throw error;
  }
};

module.exports = AuditLog;
