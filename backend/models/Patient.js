const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  patientId: {
    type: String,
    unique: true,
    required: [true, 'Patient ID is required']
  },
  personalInfo: {
    birthDate: {
      type: Date,
      required: [true, 'Birth date is required'],
      validate: {
        validator: function(date) {
          return date <= new Date();
        },
        message: 'Birth date cannot be in the future'
      }
    },
    gender: {
      type: String,
      enum: ['Male', 'Female'],
      required: [true, 'Gender is required']
    },
    bloodType: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: null
    },
    emergencyContact: {
      name: {
        type: String,
        required: [true, 'Emergency contact name is required'],
        trim: true,
        maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
      },
      relationship: {
        type: String,
        trim: true,
        maxlength: [50, 'Relationship cannot exceed 50 characters']
      },
      phoneNumber: {
        type: String,
        required: [true, 'Emergency contact phone number is required'],
        trim: true,
        match: [/^[\+]?[0-9\s\-\(\)]+$/, 'Please enter a valid phone number']
      }
    },
    insurance: {
      provider: {
        type: String,
        trim: true,
        maxlength: [100, 'Insurance provider name cannot exceed 100 characters']
      },
      policyNumber: {
        type: String,
        trim: true,
        maxlength: [50, 'Policy number cannot exceed 50 characters']
      },
      expiryDate: {
        type: Date,
        validate: {
          validator: function(date) {
            return !date || date >= new Date();
          },
          message: 'Insurance expiry date must be in the future'
        }
      }
    }
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    default: null
  },
  medicalHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MedicalRecord'
  }],
  prescriptions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  }],
  appointments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  }],
  qrCode: {
    type: String,
    unique: true,
    sparse: true // Allows null values while maintaining uniqueness
  },
  qrCodeGeneratedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for age calculation
patientSchema.virtual('age').get(function() {
  if (!this.personalInfo.birthDate) return null;
  
  const today = new Date();
  const birthDate = new Date(this.personalInfo.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for QR code status
patientSchema.virtual('qrCodeStatus').get(function() {
  if (!this.qrCode || !this.qrCodeGeneratedAt) return 'not_generated';
  
  // QR codes expire after 30 days
  const expiryDate = new Date(this.qrCodeGeneratedAt);
  expiryDate.setDate(expiryDate.getDate() + 30);
  
  return new Date() > expiryDate ? 'expired' : 'active';
});

// Indexes for performance
patientSchema.index({ userId: 1 });
patientSchema.index({ patientId: 1 });
patientSchema.index({ familyId: 1 });
patientSchema.index({ qrCode: 1 });
patientSchema.index({ 'personalInfo.birthDate': 1 });
patientSchema.index({ isActive: 1 });

// Pre-save middleware to generate patient ID
patientSchema.pre('save', async function(next) {
  if (this.isNew && !this.patientId) {
    try {
      // Generate patient ID: MHC-YYYY-XXXXXX (Maybunga Healthcare - Year - 6 digit sequence)
      const currentYear = new Date().getFullYear();
      const prefix = `MHC-${currentYear}-`;
      
      // Find the last patient ID for this year
      const lastPatient = await this.constructor
        .findOne({ 
          patientId: { $regex: `^${prefix}` }
        })
        .sort({ patientId: -1 });
      
      let sequence = 1;
      if (lastPatient) {
        const lastSequence = parseInt(lastPatient.patientId.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      // Pad sequence to 6 digits
      const paddedSequence = sequence.toString().padStart(6, '0');
      this.patientId = `${prefix}${paddedSequence}`;
      
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Instance method to generate QR code
patientSchema.methods.generateQRCode = async function() {
  const crypto = require('crypto');
  
  // Generate unique QR code
  const qrData = {
    patientId: this.patientId,
    userId: this.userId,
    timestamp: Date.now()
  };
  
  const qrString = JSON.stringify(qrData);
  const qrCode = crypto
    .createHash('sha256')
    .update(qrString)
    .digest('hex')
    .substring(0, 16); // Use first 16 characters
  
  this.qrCode = qrCode;
  this.qrCodeGeneratedAt = new Date();
  
  return qrCode;
};

// Instance method to check if QR code is valid
patientSchema.methods.isQRCodeValid = function() {
  if (!this.qrCode || !this.qrCodeGeneratedAt) return false;
  
  // QR codes expire after 30 days
  const expiryDate = new Date(this.qrCodeGeneratedAt);
  expiryDate.setDate(expiryDate.getDate() + 30);
  
  return new Date() <= expiryDate;
};

// Static method to find by QR code
patientSchema.statics.findByQRCode = async function(qrCode) {
  const patient = await this.findOne({ 
    qrCode: qrCode,
    isActive: true 
  }).populate('userId', 'profile.firstName profile.lastName email');
  
  if (!patient) {
    throw new Error('Invalid QR code');
  }
  
  if (!patient.isQRCodeValid()) {
    throw new Error('QR code has expired');
  }
  
  return patient;
};

module.exports = mongoose.model('Patient', patientSchema);
