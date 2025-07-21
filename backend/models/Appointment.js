const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    unique: true,
    required: [true, 'Appointment ID is required']
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient ID is required']
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Doctor ID is required']
  },
  appointmentDate: {
    type: Date,
    required: [true, 'Appointment date is required'],
    validate: {
      validator: function(date) {
        // Appointments can only be scheduled for future dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
      },
      message: 'Appointment date must be today or in the future'
    }
  },
  appointmentTime: {
    type: String,
    required: [true, 'Appointment time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time format (HH:MM)']
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'checkup', 'emergency', 'dental'],
    required: [true, 'Appointment type is required']
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'ongoing', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  duration: {
    type: Number,
    default: 30,
    min: [15, 'Appointment duration must be at least 15 minutes'],
    max: [240, 'Appointment duration cannot exceed 4 hours']
  },
  reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  symptoms: [{
    type: String,
    trim: true,
    maxlength: [100, 'Each symptom cannot exceed 100 characters']
  }],
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  diagnosis: {
    type: String,
    trim: true,
    maxlength: [1000, 'Diagnosis cannot exceed 1000 characters']
  },
  treatment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Treatment cannot exceed 1000 characters']
  },
  followUpDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > this.appointmentDate;
      },
      message: 'Follow-up date must be after the appointment date'
    }
  },
  documents: [{
    type: String,
    trim: true
  }],
  reminderSent: {
    type: Boolean,
    default: false
  },
  cancelReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancel reason cannot exceed 500 characters'],
    validate: {
      validator: function(reason) {
        // Cancel reason is required only if status is cancelled
        return this.status !== 'cancelled' || (reason && reason.trim().length > 0);
      },
      message: 'Cancel reason is required when appointment is cancelled'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function() {
  if (!this.appointmentDate || !this.appointmentTime) return null;
  
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return date;
});

// Virtual for appointment end time
appointmentSchema.virtual('appointmentEndTime').get(function() {
  const startTime = this.appointmentDateTime;
  if (!startTime) return null;
  
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + this.duration);
  
  return endTime;
});

// Virtual for time until appointment
appointmentSchema.virtual('timeUntilAppointment').get(function() {
  const appointmentDateTime = this.appointmentDateTime;
  if (!appointmentDateTime) return null;
  
  const now = new Date();
  const timeDiff = appointmentDateTime.getTime() - now.getTime();
  
  if (timeDiff < 0) return { status: 'past' };
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { days, hours, minutes, status: 'upcoming' };
});

// Indexes for performance
appointmentSchema.index({ appointmentId: 1 });
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ type: 1 });
appointmentSchema.index({ priority: 1 });
appointmentSchema.index({ appointmentDate: 1, appointmentTime: 1 });

// Compound indexes for common queries
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, status: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: -1 });

// Pre-save middleware to generate appointment ID
appointmentSchema.pre('save', async function(next) {
  if (this.isNew && !this.appointmentId) {
    try {
      // Generate appointment ID: APT-YYYYMMDD-XXXXX
      const date = new Date(this.appointmentDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const datePrefix = `APT-${year}${month}${day}-`;
      
      // Find the last appointment ID for this date
      const lastAppointment = await this.constructor
        .findOne({ 
          appointmentId: { $regex: `^${datePrefix}` }
        })
        .sort({ appointmentId: -1 });
      
      let sequence = 1;
      if (lastAppointment) {
        const lastSequence = parseInt(lastAppointment.appointmentId.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      // Pad sequence to 5 digits
      const paddedSequence = sequence.toString().padStart(5, '0');
      this.appointmentId = `${datePrefix}${paddedSequence}`;
      
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to validate doctor availability
appointmentSchema.pre('save', async function(next) {
  if (this.isModified('appointmentDate') || this.isModified('appointmentTime') || this.isModified('doctorId')) {
    try {
      // Check if doctor has overlapping appointments
      const startTime = this.appointmentDateTime;
      const endTime = this.appointmentEndTime;
      
      if (!startTime || !endTime) return next();
      
      const overlappingAppointment = await this.constructor.findOne({
        _id: { $ne: this._id }, // Exclude current appointment if updating
        doctorId: this.doctorId,
        status: { $in: ['scheduled', 'confirmed', 'ongoing'] },
        $expr: {
          $and: [
            {
              $lt: [
                {
                  $dateFromString: {
                    dateString: {
                      $concat: [
                        { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
                        'T',
                        '$appointmentTime',
                        ':00.000Z'
                      ]
                    }
                  }
                },
                endTime
              ]
            },
            {
              $gt: [
                {
                  $add: [
                    {
                      $dateFromString: {
                        dateString: {
                          $concat: [
                            { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } },
                            'T',
                            '$appointmentTime',
                            ':00.000Z'
                          ]
                        }
                      }
                    },
                    { $multiply: ['$duration', 60000] } // Convert minutes to milliseconds
                  ]
                },
                startTime
              ]
            }
          ]
        }
      });
      
      if (overlappingAppointment) {
        const error = new Error('Doctor has a conflicting appointment at this time');
        error.name = 'ConflictError';
        return next(error);
      }
      
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Instance method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const appointmentDateTime = this.appointmentDateTime;
  
  if (!appointmentDateTime) return false;
  
  // Can only cancel if appointment is scheduled or confirmed
  if (!['scheduled', 'confirmed'].includes(this.status)) return false;
  
  // Can only cancel if appointment is at least 2 hours in the future
  const timeDiff = appointmentDateTime.getTime() - now.getTime();
  const twoHoursInMs = 2 * 60 * 60 * 1000;
  
  return timeDiff >= twoHoursInMs;
};

// Instance method to check if appointment can be rescheduled
appointmentSchema.methods.canBeRescheduled = function() {
  return this.canBeCancelled(); // Same rules as cancellation
};

// Static method to find appointments for today
appointmentSchema.statics.findTodaysAppointments = function(doctorId = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const query = {
    appointmentDate: {
      $gte: today,
      $lt: tomorrow
    },
    status: { $in: ['scheduled', 'confirmed', 'ongoing'] }
  };
  
  if (doctorId) {
    query.doctorId = doctorId;
  }
  
  return this.find(query)
    .populate('patientId', 'patientId personalInfo')
    .populate('doctorId', 'profile.firstName profile.lastName')
    .sort({ appointmentTime: 1 });
};

module.exports = mongoose.model('Appointment', appointmentSchema);
