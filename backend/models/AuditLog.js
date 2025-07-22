const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // User who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      // User Management
      'user_created', 'user_updated', 'user_deleted', 'user_password_changed',
      'user_role_changed', 'user_status_changed',
      
      // Patient Management
      'patient_created', 'patient_updated', 'patient_deleted', 'patient_assigned_family',
      'patient_removed_family', 'patient_auto_sorted',
      
      // Family Management
      'family_created', 'family_updated', 'family_deleted', 'family_merged',
      
      // Appointment Management
      'appointment_created', 'appointment_updated', 'appointment_cancelled',
      'appointment_completed', 'appointment_rescheduled',
      
      // Medical Records
      'medical_record_created', 'medical_record_updated', 'medical_record_deleted',
      
      // System Actions
      'system_login', 'system_logout', 'system_password_reset',
      'system_config_changed', 'bulk_operation_performed',
      
      // QR Code & Check-in
      'qr_code_generated', 'patient_checked_in', 'vital_signs_recorded',
      
      // Authentication
      'login_success', 'login_failed', 'logout', 'token_refresh',
      'password_reset_requested', 'password_reset_completed'
    ]
  },
  
  // Resource affected
  resourceType: {
    type: String,
    required: true,
    enum: ['User', 'Patient', 'Family', 'Appointment', 'MedicalRecord', 'System', 'CheckInSession']
  },
  
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Some actions may not have a specific resource
  },
  
  // Details of the action
  details: {
    description: String,
    oldValues: mongoose.Schema.Types.Mixed,
    newValues: mongoose.Schema.Types.Mixed,
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  
  // Request information
  ipAddress: String,
  userAgent: String,
  requestMethod: String,
  requestUrl: String,
  
  // Result
  result: {
    type: String,
    enum: ['success', 'failure', 'partial'],
    default: 'success'
  },
  
  errorMessage: String,
  
  // Metadata
  sessionId: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ ipAddress: 1 });

// Virtual for formatted timestamp
auditLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toISOString();
});

// Static method to log an action
auditLogSchema.statics.logAction = async function(data) {
  try {
    const auditLog = new this(data);
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Audit log error:', error);
    // Don't throw error to prevent disrupting main operations
    return null;
  }
};

// Static method to get user activity
auditLogSchema.statics.getUserActivity = async function(userId, options = {}) {
  const { 
    limit = 50, 
    startDate, 
    endDate, 
    actions = [],
    resourceTypes = [] 
  } = options;
  
  const filter = { userId };
  
  if (startDate && endDate) {
    filter.timestamp = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  
  if (actions.length > 0) {
    filter.action = { $in: actions };
  }
  
  if (resourceTypes.length > 0) {
    filter.resourceType = { $in: resourceTypes };
  }
  
  return this.find(filter)
    .populate('userId', 'firstName lastName email role')
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get system activity summary
auditLogSchema.statics.getSystemActivity = async function(options = {}) {
  const {
    startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    endDate = new Date()
  } = options;
  
  const pipeline = [
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];
  
  return this.aggregate(pipeline);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
