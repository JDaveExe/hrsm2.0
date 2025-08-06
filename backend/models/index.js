'use strict';

const Family = require('./Family');
const Patient = require('./Patient');
const User = require('./User');
const VitalSigns = require('./VitalSigns');

// Define associations
User.hasOne(Patient, { foreignKey: 'userId' });
Patient.belongsTo(User, { foreignKey: 'userId' });

// Family associations
Family.hasMany(Patient, { foreignKey: 'familyId', as: 'members' });
Patient.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });

// VitalSigns associations
Patient.hasMany(VitalSigns, { foreignKey: 'patientId', as: 'vitalSigns' });
VitalSigns.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

module.exports = {
  Family,
  Patient,
  User,
  VitalSigns
};
