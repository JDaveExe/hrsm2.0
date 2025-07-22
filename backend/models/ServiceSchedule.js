const mongoose = require('mongoose');

const serviceScheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    required: [true, 'Day of week is required']
  },
  timeSlot: {
    type: String,
    enum: ['morning', 'afternoon'],
    required: [true, 'Time slot is required']
  },
  availableServices: [{
    serviceType: {
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
      required: [true, 'Service type is required']
    },
    requiresVitalSigns: {
      type: Boolean,
      default: true
    },
    maxCapacity: {
      type: Number,
      default: 50,
      min: [1, 'Max capacity must be at least 1']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    estimatedDuration: {
      type: Number, // in minutes
      default: 30,
      min: [5, 'Estimated duration must be at least 5 minutes']
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
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

// Index for efficient queries
serviceScheduleSchema.index({ dayOfWeek: 1, timeSlot: 1 });
serviceScheduleSchema.index({ isActive: 1 });

// Update the updatedAt field before saving
serviceScheduleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get available services for a specific day and time
serviceScheduleSchema.statics.getAvailableServices = async function(dayOfWeek, timeSlot) {
  try {
    const schedule = await this.findOne({
      dayOfWeek: dayOfWeek.toLowerCase(),
      timeSlot: timeSlot.toLowerCase(),
      isActive: true
    });

    return schedule ? schedule.availableServices : [];
  } catch (error) {
    throw new Error('Error retrieving available services');
  }
};

// Static method to check if a service is available
serviceScheduleSchema.statics.isServiceAvailable = async function(dayOfWeek, timeSlot, serviceType) {
  try {
    const schedule = await this.findOne({
      dayOfWeek: dayOfWeek.toLowerCase(),
      timeSlot: timeSlot.toLowerCase(),
      isActive: true,
      'availableServices.serviceType': serviceType
    });

    return !!schedule;
  } catch (error) {
    throw new Error('Error checking service availability');
  }
};

// Instance method to add a new service
serviceScheduleSchema.methods.addService = function(serviceData) {
  this.availableServices.push(serviceData);
  return this.save();
};

// Instance method to remove a service
serviceScheduleSchema.methods.removeService = function(serviceType) {
  this.availableServices = this.availableServices.filter(
    service => service.serviceType !== serviceType
  );
  return this.save();
};

// Virtual for service count
serviceScheduleSchema.virtual('serviceCount').get(function() {
  return this.availableServices.length;
});

// Transform output to include virtuals
serviceScheduleSchema.set('toJSON', { virtuals: true });
serviceScheduleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ServiceSchedule', serviceScheduleSchema);
