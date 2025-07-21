const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    unique: true,
    required: [true, 'Prescription ID is required']
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  medicalRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord',
    default: null
  },
  medications: [{
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
      maxlength: [100, 'Medication name cannot exceed 100 characters']
    },
    genericName: {
      type: String,
      trim: true,
      maxlength: [100, 'Generic name cannot exceed 100 characters']
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
      maxlength: [50, 'Dosage cannot exceed 50 characters']
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      trim: true,
      maxlength: [50, 'Frequency cannot exceed 50 characters']
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
      maxlength: [50, 'Duration cannot exceed 50 characters']
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [500, 'Instructions cannot exceed 500 characters']
    },
    quantity: {
      type: Number,
      min: [1, 'Quantity must be at least 1'],
      max: [1000, 'Quantity cannot exceed 1000']
    },
    refills: {
      type: Number,
      default: 0,
      min: [0, 'Refills cannot be negative'],
      max: [12, 'Refills cannot exceed 12']
    }
  }],
  dateIssued: {
    type: Date,
    required: [true, 'Date issued is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Date issued cannot be in the future'
    }
  },
  dateCompleted: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date >= this.dateIssued;
      },
      message: 'Date completed cannot be before date issued'
    }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'expired'],
    default: 'active'
  },
  pharmacy: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Pharmacy name cannot exceed 100 characters']
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, 'Pharmacy address cannot exceed 200 characters']
    },
    contactNumber: {
      type: String,
      trim: true,
      match: [/^[\+]?[0-9\s\-\(\)]+$/, 'Please enter a valid contact number']
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  allergies: [{
    type: String,
    trim: true,
    maxlength: [100, 'Each allergy cannot exceed 100 characters']
  }],
  warnings: [{
    type: String,
    trim: true,
    maxlength: [200, 'Each warning cannot exceed 200 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total number of medications
prescriptionSchema.virtual('medicationCount').get(function() {
  return this.medications ? this.medications.length : 0;
});

// Virtual for prescription duration
prescriptionSchema.virtual('totalDuration').get(function() {
  if (!this.medications || this.medications.length === 0) return null;
  
  // Find the medication with the longest duration
  let maxDuration = 0;
  
  this.medications.forEach(med => {
    if (med.duration) {
      // Extract number from duration string (e.g., "7 days" -> 7)
      const durationMatch = med.duration.match(/(\d+)/);
      if (durationMatch) {
        const duration = parseInt(durationMatch[1]);
        if (duration > maxDuration) {
          maxDuration = duration;
        }
      }
    }
  });
  
  return maxDuration > 0 ? `${maxDuration} days` : null;
});

// Virtual for expected completion date
prescriptionSchema.virtual('expectedCompletionDate').get(function() {
  const duration = this.totalDuration;
  if (!duration || !this.dateIssued) return null;
  
  const durationMatch = duration.match(/(\d+)/);
  if (!durationMatch) return null;
  
  const days = parseInt(durationMatch[1]);
  const completionDate = new Date(this.dateIssued);
  completionDate.setDate(completionDate.getDate() + days);
  
  return completionDate;
});

// Virtual for days remaining
prescriptionSchema.virtual('daysRemaining').get(function() {
  const expectedCompletion = this.expectedCompletionDate;
  if (!expectedCompletion || this.status !== 'active') return null;
  
  const now = new Date();
  const timeDiff = expectedCompletion.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysRemaining);
});

// Virtual for prescription status details
prescriptionSchema.virtual('statusDetails').get(function() {
  const now = new Date();
  const daysRemaining = this.daysRemaining;
  
  if (this.status === 'completed') {
    return { status: 'completed', message: 'Prescription completed' };
  }
  
  if (this.status === 'cancelled') {
    return { status: 'cancelled', message: 'Prescription cancelled' };
  }
  
  if (this.status === 'expired') {
    return { status: 'expired', message: 'Prescription expired' };
  }
  
  if (daysRemaining === null) {
    return { status: 'active', message: 'Active prescription' };
  }
  
  if (daysRemaining === 0) {
    return { status: 'expiring_today', message: 'Prescription expires today' };
  }
  
  if (daysRemaining <= 3) {
    return { status: 'expiring_soon', message: `Expires in ${daysRemaining} days` };
  }
  
  return { status: 'active', message: `${daysRemaining} days remaining` };
});

// Indexes for performance
prescriptionSchema.index({ prescriptionId: 1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ appointmentId: 1 });
prescriptionSchema.index({ medicalRecordId: 1 });
prescriptionSchema.index({ status: 1 });
prescriptionSchema.index({ dateIssued: -1 });
prescriptionSchema.index({ isActive: 1 });

// Compound indexes for common queries
prescriptionSchema.index({ patientId: 1, status: 1, dateIssued: -1 });
prescriptionSchema.index({ doctorId: 1, dateIssued: -1 });
prescriptionSchema.index({ patientId: 1, isActive: 1, status: 1 });

// Pre-save middleware to generate prescription ID
prescriptionSchema.pre('save', async function(next) {
  if (this.isNew && !this.prescriptionId) {
    try {
      // Generate prescription ID: RX-YYYYMMDD-XXXXX
      const date = new Date(this.dateIssued);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const datePrefix = `RX-${year}${month}${day}-`;
      
      // Find the last prescription ID for this date
      const lastPrescription = await this.constructor
        .findOne({ 
          prescriptionId: { $regex: `^${datePrefix}` }
        })
        .sort({ prescriptionId: -1 });
      
      let sequence = 1;
      if (lastPrescription) {
        const lastSequence = parseInt(lastPrescription.prescriptionId.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      // Pad sequence to 5 digits
      const paddedSequence = sequence.toString().padStart(5, '0');
      this.prescriptionId = `${datePrefix}${paddedSequence}`;
      
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to auto-update status based on expected completion date
prescriptionSchema.pre('save', function(next) {
  if (this.status === 'active') {
    const expectedCompletion = this.expectedCompletionDate;
    if (expectedCompletion) {
      const now = new Date();
      
      // Auto-expire if past expected completion date by more than 7 days
      const expiredThreshold = new Date(expectedCompletion);
      expiredThreshold.setDate(expiredThreshold.getDate() + 7);
      
      if (now > expiredThreshold) {
        this.status = 'expired';
      }
    }
  }
  next();
});

// Static method to find active prescriptions for patient
prescriptionSchema.statics.findActiveByPatient = function(patientId) {
  return this.find({
    patientId: patientId,
    status: 'active',
    isActive: true
  })
  .populate('doctorId', 'profile.firstName profile.lastName')
  .populate('appointmentId', 'appointmentId appointmentDate')
  .sort({ dateIssued: -1 });
};

// Static method to find prescriptions expiring soon
prescriptionSchema.statics.findExpiringSoon = function(days = 3, doctorId = null) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  const query = {
    status: 'active',
    isActive: true
  };
  
  if (doctorId) {
    query.doctorId = doctorId;
  }
  
  return this.find(query)
    .populate('patientId', 'patientId personalInfo')
    .populate('doctorId', 'profile.firstName profile.lastName')
    .sort({ dateIssued: -1 });
};

// Static method to get prescription history for patient
prescriptionSchema.statics.findHistoryByPatient = function(patientId, limit = 20) {
  return this.find({
    patientId: patientId,
    isActive: true
  })
  .populate('doctorId', 'profile.firstName profile.lastName')
  .populate('appointmentId', 'appointmentId appointmentDate type')
  .sort({ dateIssued: -1 })
  .limit(limit);
};

// Instance method to mark as completed
prescriptionSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.dateCompleted = new Date();
  return this.save();
};

// Instance method to cancel prescription
prescriptionSchema.methods.cancel = function(reason = null) {
  this.status = 'cancelled';
  if (reason) {
    this.notes = this.notes ? `${this.notes}\n\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`;
  }
  return this.save();
};

// Instance method to check for drug interactions
prescriptionSchema.methods.checkInteractions = async function() {
  // Get all active prescriptions for this patient
  const activePrescriptions = await this.constructor.findActiveByPatient(this.patientId);
  
  const interactions = [];
  const currentMedications = this.medications.map(med => med.name.toLowerCase());
  
  activePrescriptions.forEach(prescription => {
    if (prescription._id.toString() !== this._id.toString()) {
      prescription.medications.forEach(med => {
        const medName = med.name.toLowerCase();
        
        // Simple interaction check (in real implementation, use a drug interaction database)
        currentMedications.forEach(currentMed => {
          if (this.hasKnownInteraction(currentMed, medName)) {
            interactions.push({
              medication1: currentMed,
              medication2: medName,
              severity: 'moderate', // This would come from a drug database
              description: `Potential interaction between ${currentMed} and ${medName}`
            });
          }
        });
      });
    }
  });
  
  return interactions;
};

// Helper method for drug interaction checking
prescriptionSchema.methods.hasKnownInteraction = function(med1, med2) {
  // This is a simplified example. In a real system, you would use a comprehensive drug interaction database
  const knownInteractions = [
    ['warfarin', 'aspirin'],
    ['metformin', 'insulin'],
    ['digoxin', 'amiodarone']
  ];
  
  return knownInteractions.some(interaction => 
    (interaction.includes(med1) && interaction.includes(med2))
  );
};

module.exports = mongoose.model('Prescription', prescriptionSchema);
