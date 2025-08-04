'use strict';

const Family = require('./Family');
const Patient = require('./Patient');
const User = require('./User');

// Define associations
User.hasOne(Patient, { foreignKey: 'userId' });
Patient.belongsTo(User, { foreignKey: 'userId' });

// Family associations
Family.hasMany(Patient, { foreignKey: 'familyId', as: 'members' });
Patient.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });

module.exports = {
  Family,
  Patient,
  User
};
