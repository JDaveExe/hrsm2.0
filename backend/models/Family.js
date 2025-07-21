const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  familyId: {
    type: String,
    unique: true,
    required: [true, 'Family ID is required']
  },
  familyName: {
    type: String,
    required: [true, 'Family name is required'],
    trim: true,
    maxlength: [100, 'Family name cannot exceed 100 characters']
  },
  headOfFamily: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Head of family is required']
  },
  members: [{
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: [true, 'Patient ID is required']
    },
    relationship: {
      type: String,
      required: [true, 'Relationship is required'],
      trim: true,
      maxlength: [50, 'Relationship cannot exceed 50 characters']
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  address: {
    street: {
      type: String,
      trim: true,
      maxlength: [200, 'Street address cannot exceed 200 characters']
    },
    barangay: {
      type: String,
      required: [true, 'Barangay is required'],
      trim: true,
      maxlength: [100, 'Barangay cannot exceed 100 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters']
    },
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true,
      maxlength: [100, 'Province cannot exceed 100 characters']
    },
    zipCode: {
      type: String,
      trim: true,
      match: [/^\d{4}$/, 'Zip code must be 4 digits']
    }
  },
  contactNumber: {
    type: String,
    trim: true,
    match: [/^[\+]?[0-9\s\-\(\)]+$/, 'Please enter a valid contact number']
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Emergency contact name cannot exceed 100 characters']
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: [50, 'Emergency contact relationship cannot exceed 50 characters']
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[\+]?[0-9\s\-\(\)]+$/, 'Please enter a valid phone number']
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
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

// Virtual for member count
familySchema.virtual('memberCount').get(function() {
  return this.members ? this.members.length : 0;
});

// Virtual for full address
familySchema.virtual('fullAddress').get(function() {
  const address = this.address;
  if (!address) return null;
  
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.barangay) parts.push(`Brgy. ${address.barangay}`);
  if (address.city) parts.push(address.city);
  if (address.province) parts.push(address.province);
  if (address.zipCode) parts.push(address.zipCode);
  
  return parts.join(', ');
});

// Virtual for active members
familySchema.virtual('activeMembers').get(function() {
  return this.members ? this.members.filter(member => member.patientId) : [];
});

// Indexes for performance
familySchema.index({ familyId: 1 });
familySchema.index({ familyName: 1 });
familySchema.index({ headOfFamily: 1 });
familySchema.index({ 'members.patientId': 1 });
familySchema.index({ 'address.barangay': 1 });
familySchema.index({ 'address.city': 1 });
familySchema.index({ isActive: 1 });

// Pre-save middleware to generate family ID
familySchema.pre('save', async function(next) {
  if (this.isNew && !this.familyId) {
    try {
      // Generate family ID: FAM-YYYY-XXXXXX
      const currentYear = new Date().getFullYear();
      const prefix = `FAM-${currentYear}-`;
      
      // Find the last family ID for this year
      const lastFamily = await this.constructor
        .findOne({ 
          familyId: { $regex: `^${prefix}` }
        })
        .sort({ familyId: -1 });
      
      let sequence = 1;
      if (lastFamily) {
        const lastSequence = parseInt(lastFamily.familyId.split('-')[2]);
        sequence = lastSequence + 1;
      }
      
      // Pad sequence to 6 digits
      const paddedSequence = sequence.toString().padStart(6, '0');
      this.familyId = `${prefix}${paddedSequence}`;
      
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to ensure head of family is in members
familySchema.pre('save', function(next) {
  if (this.headOfFamily) {
    // Check if head of family is in members array
    const headInMembers = this.members.some(member => 
      member.patientId && member.patientId.toString() === this.headOfFamily.toString()
    );
    
    if (!headInMembers) {
      this.members.push({
        patientId: this.headOfFamily,
        relationship: 'Head of Family',
        isPrimary: true
      });
    } else {
      // Ensure head of family is marked as primary
      this.members.forEach(member => {
        if (member.patientId && member.patientId.toString() === this.headOfFamily.toString()) {
          member.isPrimary = true;
        }
      });
    }
  }
  next();
});

// Static method to find families by barangay
familySchema.statics.findByBarangay = function(barangay) {
  return this.find({
    'address.barangay': { $regex: new RegExp(barangay, 'i') },
    isActive: true
  })
  .populate('headOfFamily', 'patientId personalInfo')
  .populate('members.patientId', 'patientId personalInfo')
  .sort({ familyName: 1 });
};

// Static method to find families by city
familySchema.statics.findByCity = function(city) {
  return this.find({
    'address.city': { $regex: new RegExp(city, 'i') },
    isActive: true
  })
  .populate('headOfFamily', 'patientId personalInfo')
  .populate('members.patientId', 'patientId personalInfo')
  .sort({ familyName: 1 });
};

// Static method to search families
familySchema.statics.searchFamilies = function(searchTerm, limit = 20) {
  const searchRegex = new RegExp(searchTerm, 'i');
  
  return this.find({
    $or: [
      { familyName: searchRegex },
      { familyId: searchRegex },
      { 'address.barangay': searchRegex },
      { 'address.city': searchRegex }
    ],
    isActive: true
  })
  .populate('headOfFamily', 'patientId personalInfo')
  .populate('members.patientId', 'patientId personalInfo')
  .sort({ familyName: 1 })
  .limit(limit);
};

// Instance method to add family member
familySchema.methods.addMember = function(patientId, relationship, isPrimary = false) {
  // Check if patient is already a member
  const existingMember = this.members.find(member => 
    member.patientId && member.patientId.toString() === patientId.toString()
  );
  
  if (existingMember) {
    throw new Error('Patient is already a member of this family');
  }
  
  this.members.push({
    patientId: patientId,
    relationship: relationship,
    isPrimary: isPrimary
  });
  
  return this.save();
};

// Instance method to remove family member
familySchema.methods.removeMember = function(patientId) {
  // Cannot remove head of family
  if (this.headOfFamily && this.headOfFamily.toString() === patientId.toString()) {
    throw new Error('Cannot remove head of family. Transfer headship first.');
  }
  
  this.members = this.members.filter(member => 
    !member.patientId || member.patientId.toString() !== patientId.toString()
  );
  
  return this.save();
};

// Instance method to transfer headship
familySchema.methods.transferHeadship = function(newHeadPatientId) {
  // Check if new head is a family member
  const newHeadMember = this.members.find(member => 
    member.patientId && member.patientId.toString() === newHeadPatientId.toString()
  );
  
  if (!newHeadMember) {
    throw new Error('New head must be a family member');
  }
  
  // Update old head to regular member
  if (this.headOfFamily) {
    this.members.forEach(member => {
      if (member.patientId && member.patientId.toString() === this.headOfFamily.toString()) {
        member.isPrimary = false;
        member.relationship = 'Former Head';
      }
    });
  }
  
  // Set new head
  this.headOfFamily = newHeadPatientId;
  newHeadMember.isPrimary = true;
  newHeadMember.relationship = 'Head of Family';
  
  return this.save();
};

// Instance method to get family statistics
familySchema.methods.getStatistics = async function() {
  await this.populate('members.patientId');
  
  const stats = {
    totalMembers: this.memberCount,
    ageGroups: {
      children: 0,    // 0-17 years
      adults: 0,      // 18-64 years
      seniors: 0      // 65+ years
    },
    genderDistribution: {
      male: 0,
      female: 0
    }
  };
  
  this.members.forEach(member => {
    if (member.patientId && member.patientId.personalInfo) {
      const patient = member.patientId;
      
      // Calculate age
      if (patient.personalInfo.birthDate) {
        const today = new Date();
        const birthDate = new Date(patient.personalInfo.birthDate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        
        if (age < 18) stats.ageGroups.children++;
        else if (age < 65) stats.ageGroups.adults++;
        else stats.ageGroups.seniors++;
      }
      
      // Count gender
      if (patient.personalInfo.gender) {
        if (patient.personalInfo.gender.toLowerCase() === 'male') {
          stats.genderDistribution.male++;
        } else if (patient.personalInfo.gender.toLowerCase() === 'female') {
          stats.genderDistribution.female++;
        }
      }
    }
  });
  
  return stats;
};

module.exports = mongoose.model('Family', familySchema);
