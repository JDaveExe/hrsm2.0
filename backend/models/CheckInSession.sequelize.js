const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CheckInSession = sequelize.define('CheckInSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Patients',
      key: 'id'
    },
  },
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Appointments',
      key: 'id'
    },
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  serviceType: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'General Checkup',
  },
  priority: {
    type: DataTypes.ENUM('Normal', 'High', 'Emergency'),
    defaultValue: 'Normal',
  },
  status: {
    type: DataTypes.ENUM(
      'checked-in', 
      'vitals-recorded', 
      'doctor-notified', 
      'in-progress', 
      'transferred',
      'started',
      'completed', 
      'vaccination-completed',
      'cancelled'
    ),
    defaultValue: 'checked-in',
  },
  checkInMethod: {
    type: DataTypes.ENUM('qr-code', 'qr-scan', 'staff-assisted', 'online'),
    defaultValue: 'staff-assisted',
  },
  vitalSigns: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string containing vital signs data',
  },
  vitalSignsTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  doctorNotified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  notifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  assignedDoctor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  prescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  vaccination: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON string containing vaccination data',
  },
  doctorNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  chiefComplaint: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Primary reason for patient visit',
  },
  presentSymptoms: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Current symptoms described by patient',
  },
  treatmentPlan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Prescribed treatment plan',
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
  },
}, {
  tableName: 'check_in_sessions',
  timestamps: true,
  indexes: [
    {
      fields: ['patientId']
    },
    {
      fields: ['checkInTime']
    },
    {
      fields: ['status']
    },
    {
      fields: ['appointmentId']
    }
  ]
});

module.exports = CheckInSession;