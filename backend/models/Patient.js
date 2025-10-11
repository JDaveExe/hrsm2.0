const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  middleName: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  suffix: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  gender: {
    type: DataTypes.ENUM('Male', 'Female', 'Other'),
    allowNull: false,
  },
  civilStatus: {
    type: DataTypes.ENUM('Single', 'Married', 'Divorced', 'Widowed'),
    allowNull: true,
  },
  contactNumber: {
    type: DataTypes.STRING,
    // Remove unique constraint - will add indexes separately
    allowNull: true,
    validate: {
      customValidator(value) {
        // Allow null or undefined
        if (value === null || value === undefined) {
          return;
        }
        // If value is provided, it must be exactly 11 digits
        if (typeof value === 'string' && value.length > 0) {
          if (value.length !== 11) {
            throw new Error('Contact number must be exactly 11 digits');
          }
          if (!/^\d+$/.test(value)) {
            throw new Error('Contact number must contain only numbers');
          }
        }
      }
    }
  },
  email: {
    type: DataTypes.STRING,
    // Remove unique constraint - will add indexes separately
    allowNull: true,
    validate: {
      customValidator(value) {
        // Allow null, undefined, or empty string
        if (value === null || value === undefined || value === '') {
          return;
        }
        
        // Convert "N/A" to null before validation
        if (typeof value === 'string' && (value.toLowerCase() === 'n/a' || value.toLowerCase() === 'na')) {
          return;
        }
        
        // If value is provided and not empty, validate email format
        if (typeof value === 'string' && value.length > 0) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            throw new Error('Must be a valid email address or "N/A"');
          }
        }
      }
    },
    set(value) {
      // Convert "N/A" to null when setting the value
      if (value && typeof value === 'string' && (value.toLowerCase() === 'n/a' || value.toLowerCase() === 'na')) {
        this.setDataValue('email', null);
      } else if (value === '') {
        this.setDataValue('email', null);
      } else {
        this.setDataValue('email', value);
      }
    }
  },
  address: {
    type: DataTypes.STRING,
  },
  houseNo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  street: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  purok: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  region: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  philHealthNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    // Remove unique constraint
  },
  bloodType: {
    type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
    allowNull: true,
  },
  medicalConditions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  emergencyContact: {
    type: DataTypes.JSON,
  },
  familyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  qrCode: {
    type: DataTypes.STRING,
    // Remove unique constraint
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  // Add indexes explicitly instead of unique constraints on individual fields
  indexes: [
    {
      unique: true,
      fields: ['contactNumber'],
      // We'll handle null values in the application logic
      name: 'patients_contact_number_unique'
    },
    {
      unique: true,
      fields: ['email'],
      name: 'patients_email_unique'
    },
    {
      unique: true,
      fields: ['qrCode'],
      name: 'patients_qr_code_unique'
    },
    {
      unique: true,
      fields: ['philHealthNumber'],
      name: 'patients_phil_health_number_unique'
    }
  ]
});

module.exports = Patient;
