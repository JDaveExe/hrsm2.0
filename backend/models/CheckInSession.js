const mongoose = require('mongoose');

const checkInSessionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  qrCode: {
    type: String,
    required: [true, 'QR code is required']
  },
  checkInDate: {
    type: Date,
    required: [true, 'Check-in date is required'],
    default: Date.now
  },
  sessionStatus: {
    type: String,
    enum: ['active', 'completed', 'expired', 'cancelled'],
    default: 'active'
  },
  selectedService: {
    type: String,
    enum: [
      'consultation',
      'dental-consultation',
      'dental-procedure',
      'dental-fluoride',
      'follow-up',
      'out-patient',
      'parental-consultation',
      'vaccination-bcg',
      'vaccination-hepatitis-b',
      'vaccination-polio',
      'vaccination-dtap',
      'vaccination-mmr',
      'vaccination-varicella',
      'vaccination-pneumococcal',
      'vaccination-hepatitis-a',
      'vaccination-influenza',
      'vaccination-rabies'
    ],
    required: [true, 'Selected service is required']
  },
  timeSlot: {
    type: String,
    enum: ['morning', 'afternoon'],
    required: [true, 'Time slot is required']
  },
  vitalSignsRequired: {
    type: Boolean,
    default: true
  },
  vitalSignsCompleted: {
    type: Boolean,
    default: false
  },
  vitalSignsCompletedAt: {
    type: Date
  },
  vitalSignsRecordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorNotified: {
    type: Boolean,
    default: false
  },
  doctorNotifiedAt: {
    type: Date
  },
  doctorNotifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  waitingTime: {
    type: Number, // in minutes
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by field is required']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: { expireAfterSeconds: 0 }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
checkInSessionSchema.index({ patientId: 1, checkInDate: 1 });
checkInSessionSchema.index({ sessionStatus: 1 });
checkInSessionSchema.index({ checkInDate: 1 });
checkInSessionSchema.index({ selectedService: 1 });
checkInSessionSchema.index({ vitalSignsRequired: 1, vitalSignsCompleted: 1 });
checkInSessionSchema.index({ doctorNotified: 1 });

// Compound index for today's active sessions
checkInSessionSchema.index({ 
  checkInDate: 1, 
  sessionStatus: 1 
});

// Update the updatedAt field before saving
checkInSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-update completion timestamps
  if (this.isModified('vitalSignsCompleted') && this.vitalSignsCompleted) {
    this.vitalSignsCompletedAt = new Date();
  }
  
  if (this.isModified('doctorNotified') && this.doctorNotified) {
    this.doctorNotifiedAt = new Date();
  }
  
  if (this.isModified('sessionStatus') && this.sessionStatus === 'completed') {
    this.completedAt = new Date();
  }
  
  if (this.isModified('sessionStatus') && this.sessionStatus === 'cancelled') {
    this.cancelledAt = new Date();
  }
  
  next();
});

// Virtual for session duration
checkInSessionSchema.virtual('sessionDuration').get(function() {
  if (this.completedAt) {
    return Math.round((this.completedAt - this.createdAt) / (1000 * 60)); // in minutes
  }
  return Math.round((new Date() - this.createdAt) / (1000 * 60)); // in minutes
});

// Virtual for waiting time calculation
checkInSessionSchema.virtual('currentWaitingTime').get(function() {
  if (this.doctorNotifiedAt) {
    return Math.round((new Date() - this.doctorNotifiedAt) / (1000 * 60)); // in minutes
  }
  return Math.round((new Date() - this.createdAt) / (1000 * 60)); // in minutes
});

// Virtual for session status display
checkInSessionSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'active': 'Active',
    'completed': 'Completed',
    'expired': 'Expired',
    'cancelled': 'Cancelled'
  };
  return statusMap[this.sessionStatus] || this.sessionStatus;
});

// Instance method to mark vital signs as completed
checkInSessionSchema.methods.completeVitalSigns = function(recordedBy) {
  this.vitalSignsCompleted = true;
  this.vitalSignsCompletedAt = new Date();
  this.vitalSignsRecordedBy = recordedBy;
  return this.save();
};

// Instance method to notify doctor
checkInSessionSchema.methods.notifyDoctor = function(notifiedBy) {
  this.doctorNotified = true;
  this.doctorNotifiedAt = new Date();
  this.doctorNotifiedBy = notifiedBy;
  return this.save();
};

// Instance method to complete session
checkInSessionSchema.methods.completeSession = function() {
  this.sessionStatus = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Instance method to cancel session
checkInSessionSchema.methods.cancelSession = function(cancelledBy, reason) {
  this.sessionStatus = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  return this.save();
};

// Static method to get today's active sessions
checkInSessionSchema.statics.getTodaysSessions = async function(status = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const query = {
    checkInDate: {
      $gte: today,
      $lt: tomorrow
    }
  };

  if (status) {
    query.sessionStatus = status;
  }

  return this.find(query)
    .populate({
      path: 'patientId',
      populate: {
        path: 'userId',
        select: 'profile'
      }
    })
    .populate('appointmentId')
    .populate('createdBy', 'profile')
    .sort({ createdAt: -1 });
};

// Static method to get sessions ready for doctor
checkInSessionSchema.statics.getReadyForDoctor = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    checkInDate: {
      $gte: today,
      $lt: tomorrow
    },
    sessionStatus: 'active',
    $or: [
      { vitalSignsRequired: false },
      { 
        vitalSignsRequired: true,
        vitalSignsCompleted: true 
      }
    ]
  })
  .populate({
    path: 'patientId',
    populate: {
      path: 'userId',
      select: 'profile'
    }
  })
  .populate('appointmentId')
  .sort({ createdAt: 1 });
};

// Static method to get sessions pending vital signs
checkInSessionSchema.statics.getPendingVitalSigns = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.find({
    checkInDate: {
      $gte: today,
      $lt: tomorrow
    },
    sessionStatus: 'active',
    vitalSignsRequired: true,
    vitalSignsCompleted: false
  })
  .populate({
    path: 'patientId',
    populate: {
      path: 'userId',
      select: 'profile'
    }
  })
  .populate('appointmentId')
  .sort({ createdAt: 1 });
};

// Transform output to include virtuals
checkInSessionSchema.set('toJSON', { virtuals: true });
checkInSessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CheckInSession', checkInSessionSchema);
