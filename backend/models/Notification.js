const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient ID is required']
  },
  type: {
    type: String,
    enum: ['appointment', 'prescription', 'result', 'system', 'reminder'],
    required: [true, 'Notification type is required']
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  channels: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: true
    },
    inApp: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: null
  },
  readAt: {
    type: Date,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  scheduledFor: {
    type: Date,
    default: null,
    validate: {
      validator: function(date) {
        return !date || date >= new Date();
      },
      message: 'Scheduled time cannot be in the past'
    }
  },
  expiresAt: {
    type: Date,
    default: null,
    validate: {
      validator: function(date) {
        return !date || date > new Date();
      },
      message: 'Expiry time must be in the future'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffMs = now - created;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return created.toLocaleDateString();
});

// Virtual for notification icon based on type
notificationSchema.virtual('icon').get(function() {
  const iconMap = {
    appointment: 'calendar',
    prescription: 'pills',
    result: 'file-medical',
    system: 'cog',
    reminder: 'bell'
  };
  
  return iconMap[this.type] || 'info-circle';
});

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Virtual for should be sent now
notificationSchema.virtual('shouldBeSent').get(function() {
  if (this.status !== 'pending') return false;
  if (this.isExpired) return false;
  if (!this.scheduledFor) return true;
  
  return new Date() >= this.scheduledFor;
});

// Indexes for performance
notificationSchema.index({ recipientId: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ createdAt: -1 });

// Compound indexes for common queries
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });

// Pre-save middleware to set sentAt when status changes to sent
notificationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'sent' && !this.sentAt) {
    this.sentAt = new Date();
  }
  next();
});

// Pre-save middleware to set readAt when isRead changes to true
notificationSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method to create appointment reminder
notificationSchema.statics.createAppointmentReminder = function(appointment, reminderTime = 24) {
  const reminderDate = new Date(appointment.appointmentDateTime);
  reminderDate.setHours(reminderDate.getHours() - reminderTime);
  
  return this.create({
    recipientId: appointment.patientId.userId,
    type: 'appointment',
    title: 'Appointment Reminder',
    message: `You have an appointment scheduled for ${appointment.appointmentDate.toLocaleDateString()} at ${appointment.appointmentTime}`,
    data: {
      appointmentId: appointment._id,
      appointmentType: appointment.type,
      doctorName: appointment.doctorId.profile.fullName
    },
    scheduledFor: reminderDate,
    priority: appointment.priority === 'urgent' ? 'high' : 'normal'
  });
};

// Static method to create prescription reminder
notificationSchema.statics.createPrescriptionReminder = function(prescription, reminderType = 'refill') {
  let title, message, scheduledFor;
  
  if (reminderType === 'refill') {
    title = 'Prescription Refill Reminder';
    message = `Your prescription is running low and may need a refill soon.`;
    scheduledFor = new Date(); // Send immediately
  } else if (reminderType === 'expiring') {
    title = 'Prescription Expiring';
    message = `Your prescription will expire soon. Please consult your doctor for renewal.`;
    const expiryDate = prescription.expectedCompletionDate;
    scheduledFor = new Date(expiryDate);
    scheduledFor.setDate(scheduledFor.getDate() - 3); // 3 days before expiry
  }
  
  return this.create({
    recipientId: prescription.patientId.userId,
    type: 'prescription',
    title: title,
    message: message,
    data: {
      prescriptionId: prescription._id,
      medications: prescription.medications.map(med => med.name)
    },
    scheduledFor: scheduledFor,
    priority: 'normal'
  });
};

// Static method to create system notification
notificationSchema.statics.createSystemNotification = function(userId, title, message, priority = 'normal') {
  return this.create({
    recipientId: userId,
    type: 'system',
    title: title,
    message: message,
    data: {},
    priority: priority,
    channels: {
      email: false,
      sms: false,
      push: true,
      inApp: true
    }
  });
};

// Static method to get unread notifications for user
notificationSchema.statics.getUnreadForUser = function(userId, limit = 20) {
  return this.find({
    recipientId: userId,
    isRead: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  })
  .sort({ priority: -1, createdAt: -1 })
  .limit(limit);
};

// Static method to get notifications due for sending
notificationSchema.statics.getDueForSending = function() {
  const now = new Date();
  
  return this.find({
    status: 'pending',
    $or: [
      { scheduledFor: null },
      { scheduledFor: { $lte: now } }
    ],
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: now } }
    ]
  })
  .populate('recipientId', 'email profile preferences')
  .sort({ priority: -1, scheduledFor: 1 });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to mark as sent
notificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Instance method to mark as delivered
notificationSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  return this.save();
};

// Instance method to mark as failed
notificationSchema.methods.markAsFailed = function(reason = null) {
  this.status = 'failed';
  if (reason) {
    this.data.failureReason = reason;
  }
  return this.save();
};

// Instance method to check if user wants this notification channel
notificationSchema.methods.shouldSendViaChannel = function(channel) {
  // Check notification channel settings
  if (!this.channels[channel]) return false;
  
  // Check user preferences if populated
  if (this.recipientId && this.recipientId.preferences) {
    const userPrefs = this.recipientId.preferences.notifications;
    
    // Map channels to user preference keys
    const channelMap = {
      email: 'email',
      sms: 'sms',
      push: 'push',
      inApp: 'push' // In-app uses push preference
    };
    
    const prefKey = channelMap[channel];
    if (prefKey && userPrefs[prefKey] !== undefined) {
      return userPrefs[prefKey];
    }
  }
  
  return this.channels[channel];
};

// Instance method to get notification content for specific channel
notificationSchema.methods.getContentForChannel = function(channel) {
  const baseContent = {
    title: this.title,
    message: this.message,
    data: this.data
  };
  
  // Customize content based on channel
  switch (channel) {
    case 'email':
      return {
        ...baseContent,
        subject: this.title,
        html: `
          <h2>${this.title}</h2>
          <p>${this.message}</p>
          ${this.data.appointmentId ? `<p><strong>Appointment ID:</strong> ${this.data.appointmentId}</p>` : ''}
          ${this.data.prescriptionId ? `<p><strong>Prescription ID:</strong> ${this.data.prescriptionId}</p>` : ''}
        `
      };
      
    case 'sms':
      return {
        message: `${this.title}: ${this.message}`
      };
      
    case 'push':
    case 'inApp':
    default:
      return baseContent;
  }
};

module.exports = mongoose.model('Notification', notificationSchema);
