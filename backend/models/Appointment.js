const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  appointmentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  appointmentTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 30, // minutes
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM(
      'Consultation',
      'Follow-up',
      'Check-up',
      'Vaccination',
      'Dental Consultation',
      'Dental Procedure',
      'Out-Patient',
      'Emergency',
      'Lab Test'
    ),
    allowNull: false,
    defaultValue: 'Consultation'
  },
  serviceType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Specific service type for the appointment'
  },
  status: {
    type: DataTypes.ENUM(
      'Scheduled',
      'Confirmed',
      'In Progress',
      'Completed',
      'Cancelled',
      'No Show'
    ),
    allowNull: false,
    defaultValue: 'Scheduled'
  },
  isEmergency: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Flag indicating if this is an emergency appointment'
  },
  emergencyReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Detailed reason for emergency appointment'
  },
  emergencyReasonCategory: {
    type: DataTypes.ENUM(
      'Severe Pain',
      'High Fever (>39°C)',
      'Injury/Accident',
      'Breathing Difficulty',
      'Severe Allergic Reaction',
      'Other Critical'
    ),
    allowNull: true,
    comment: 'Category of emergency reason'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Normal', 'High', 'Emergency'),
    allowNull: false,
    defaultValue: 'Normal'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  symptoms: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  treatment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  prescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  vitalSignsRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  vitalSignsCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  doctorNotified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when patient accepted the appointment'
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when patient rejected the appointment'
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Timestamp when appointment was completed'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'appointments',
  timestamps: true,
  underscored: false
});

// Model associations will be defined in index.js
module.exports = Appointment;