const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    unique: true,
    required: [true, 'Record ID is required']
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
  recordType: {
    type: String,
    enum: ['treatment', 'dental', 'immunization', 'laboratory', 'imaging'],
    required: [true, 'Record type is required']
  },
  date: {
    type: Date,
    required: [true, 'Record date is required'],
    validate: {
      validator: function(date) {
        return date <= new Date();
      },
      message: 'Record date cannot be in the future'
    }
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
  medications: [{
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
      maxlength: [100, 'Medication name cannot exceed 100 characters']
    },
    dosage: {
      type: String,
      required: [true, 'Medication dosage is required'],
      trim: true,
      maxlength: [50, 'Dosage cannot exceed 50 characters']
    },
    frequency: {
      type: String,
      required: [true, 'Medication frequency is required'],
      trim: true,
      maxlength: [50, 'Frequency cannot exceed 50 characters']
    },
    duration: {
      type: String,
      required: [true, 'Medication duration is required'],
      trim: true,
      maxlength: [50, 'Duration cannot exceed 50 characters']
    }
  }],
  // Specific fields for dental records
  dentalInfo: {
    procedure: {
      type: String,
      trim: true,
      maxlength: [200, 'Dental procedure cannot exceed 200 characters'],
      validate: {
        validator: function(procedure) {
          return this.recordType !== 'dental' || (procedure && procedure.trim().length > 0);
        },
        message: 'Dental procedure is required for dental records'
      }
    },
    toothNumber: {
      type: String,
      trim: true,
      maxlength: [10, 'Tooth number cannot exceed 10 characters']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Dental notes cannot exceed 500 characters']
    }
  },
  // Specific fields for immunization records
  immunizationInfo: {
    vaccine: {
      type: String,
      trim: true,
      maxlength: [100, 'Vaccine name cannot exceed 100 characters'],
      validate: {
        validator: function(vaccine) {
          return this.recordType !== 'immunization' || (vaccine && vaccine.trim().length > 0);
        },
        message: 'Vaccine name is required for immunization records'
      }
    },
    lotNumber: {
      type: String,
      trim: true,
      maxlength: [50, 'Lot number cannot exceed 50 characters']
    },
    manufacturer: {
      type: String,
      trim: true,
      maxlength: [100, 'Manufacturer cannot exceed 100 characters']
    },
    administeredBy: {
      type: String,
      trim: true,
      maxlength: [100, 'Administered by cannot exceed 100 characters']
    },
    nextDueDate: {
      type: Date,
      validate: {
        validator: function(date) {
          return !date || date > this.date;
        },
        message: 'Next due date must be after the administration date'
      }
    }
  },
  // Specific fields for laboratory records
  laboratoryInfo: {
    testType: {
      type: String,
      trim: true,
      maxlength: [100, 'Test type cannot exceed 100 characters'],
      validate: {
        validator: function(testType) {
          return this.recordType !== 'laboratory' || (testType && testType.trim().length > 0);
        },
        message: 'Test type is required for laboratory records'
      }
    },
    results: {
      type: String,
      trim: true,
      maxlength: [1000, 'Test results cannot exceed 1000 characters']
    },
    normalRange: {
      type: String,
      trim: true,
      maxlength: [200, 'Normal range cannot exceed 200 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'abnormal'],
      default: 'pending',
      validate: {
        validator: function(status) {
          return this.recordType !== 'laboratory' || status;
        },
        message: 'Status is required for laboratory records'
      }
    }
  },
  vitals: {
    bloodPressure: {
      type: String,
      trim: true,
      match: [/^\d{2,3}\/\d{2,3}$/, 'Blood pressure must be in format XXX/XX']
    },
    temperature: {
      type: Number,
      min: [30, 'Temperature must be at least 30°C'],
      max: [45, 'Temperature cannot exceed 45°C']
    },
    weight: {
      type: Number,
      min: [0.5, 'Weight must be at least 0.5 kg'],
      max: [500, 'Weight cannot exceed 500 kg']
    },
    height: {
      type: Number,
      min: [30, 'Height must be at least 30 cm'],
      max: [250, 'Height cannot exceed 250 cm']
    },
    heartRate: {
      type: Number,
      min: [30, 'Heart rate must be at least 30 bpm'],
      max: [200, 'Heart rate cannot exceed 200 bpm']
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters']
  },
  documents: [{
    type: String,
    trim: true
  }],
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date > this.date;
      },
      message: 'Follow-up date must be after the record date'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for BMI calculation
medicalRecordSchema.virtual('bmi').get(function() {
  if (!this.vitals.weight || !this.vitals.height) return null;
  
  const heightInMeters = this.vitals.height / 100;
  const bmi = this.vitals.weight / (heightInMeters * heightInMeters);
  
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
});

// Virtual for BMI category
medicalRecordSchema.virtual('bmiCategory').get(function() {
  const bmi = this.bmi;
  if (!bmi) return null;
  
  if (bmi < 18.5) return 'Underweight';
  if (bmi >= 18.5 && bmi < 25) return 'Normal weight';
  if (bmi >= 25 && bmi < 30) return 'Overweight';
  return 'Obese';
});

// Virtual for follow-up status
medicalRecordSchema.virtual('followUpStatus').get(function() {
  if (!this.followUpRequired) return 'not_required';
  if (!this.followUpDate) return 'scheduled_required';
  
  const now = new Date();
  if (this.followUpDate < now) return 'overdue';
  if (this.followUpDate.toDateString() === now.toDateString()) return 'due_today';
  
  return 'scheduled';
});

// Indexes for performance
medicalRecordSchema.index({ recordId: 1 });
medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ doctorId: 1 });
medicalRecordSchema.index({ appointmentId: 1 });
medicalRecordSchema.index({ recordType: 1 });
medicalRecordSchema.index({ date: -1 });
medicalRecordSchema.index({ isActive: 1 });

// Compound indexes for common queries
medicalRecordSchema.index({ patientId: 1, date: -1 });
medicalRecordSchema.index({ patientId: 1, recordType: 1, date: -1 });
medicalRecordSchema.index({ doctorId: 1, date: -1 });

// Pre-save middleware to generate record ID
medicalRecordSchema.pre('save', async function(next) {
  if (this.isNew && !this.recordId) {
    try {
      // Generate record ID: MR-YYYYMMDD-XXXXX
      const date = new Date(this.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const datePrefix = `MR-${year}${month}${day}-`;
      
      // Find the last record ID for this date
      const lastRecord = await this.constructor
        .findOne({ 
          recordId: { $regex: `^${datePrefix}` }
        })
        .sort({ recordId: -1 });
      
      let sequence = 1;
      if (lastRecord) {
        const lastSequence = parseInt(lastRecord.recordId.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      // Pad sequence to 5 digits
      const paddedSequence = sequence.toString().padStart(5, '0');
      this.recordId = `${datePrefix}${paddedSequence}`;
      
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to find records by patient and type
medicalRecordSchema.statics.findByPatientAndType = function(patientId, recordType = null, limit = 10) {
  const query = { 
    patientId: patientId,
    isActive: true 
  };
  
  if (recordType) {
    query.recordType = recordType;
  }
  
  return this.find(query)
    .populate('doctorId', 'profile.firstName profile.lastName')
    .populate('appointmentId', 'appointmentId type')
    .sort({ date: -1 })
    .limit(limit);
};

// Static method to find upcoming follow-ups
medicalRecordSchema.statics.findUpcomingFollowUps = function(doctorId = null, days = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  const query = {
    followUpRequired: true,
    followUpDate: {
      $gte: now,
      $lte: futureDate
    },
    isActive: true
  };
  
  if (doctorId) {
    query.doctorId = doctorId;
  }
  
  return this.find(query)
    .populate('patientId', 'patientId personalInfo')
    .populate('doctorId', 'profile.firstName profile.lastName')
    .sort({ followUpDate: 1 });
};

// Instance method to create follow-up appointment
medicalRecordSchema.methods.createFollowUpAppointment = async function() {
  if (!this.followUpRequired || !this.followUpDate) {
    throw new Error('No follow-up required or date not set');
  }
  
  const Appointment = require('./Appointment');
  
  const appointment = new Appointment({
    patientId: this.patientId,
    doctorId: this.doctorId,
    appointmentDate: this.followUpDate,
    appointmentTime: '09:00', // Default time, can be customized
    type: 'follow-up',
    reason: `Follow-up for ${this.recordType} record ${this.recordId}`,
    notes: `Automatic follow-up appointment created from medical record`
  });
  
  return await appointment.save();
};

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
