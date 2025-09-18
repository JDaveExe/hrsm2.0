const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DoctorSession = sequelize.define('DoctorSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('online', 'offline', 'busy'),
    defaultValue: 'offline',
    allowNull: false
  },
  loginTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  logoutTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastActivity: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW
  },
  currentPatientId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of patient currently being attended by doctor'
  },
  sessionToken: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Session token to track active sessions'
  }
}, {
  tableName: 'doctor_sessions',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['doctorId', 'status'],
      where: {
        status: ['online', 'busy']
      },
      name: 'unique_active_doctor_session'
    }
  ]
});

module.exports = DoctorSession;