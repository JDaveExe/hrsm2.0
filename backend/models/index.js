'use strict';

const Family = require('./Family');
const Patient = require('./Patient');
const User = require('./User');
const VitalSigns = require('./VitalSigns');
const Appointment = require('./Appointment');
const CheckInSession = require('./CheckInSession.sequelize');
const DoctorSession = require('./DoctorSession');
const Vaccination = require('./Vaccination');

// Define associations
User.hasOne(Patient, { foreignKey: 'userId' });
Patient.belongsTo(User, { foreignKey: 'userId' });

// Family associations
Family.hasMany(Patient, { foreignKey: 'familyId', as: 'members' });
Patient.belongsTo(Family, { foreignKey: 'familyId', as: 'family' });

// VitalSigns associations
Patient.hasMany(VitalSigns, { foreignKey: 'patientId', as: 'vitalSigns' });
VitalSigns.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

// Appointment associations
Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(Appointment, { foreignKey: 'doctorId', as: 'doctorAppointments' });
Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

User.hasMany(Appointment, { foreignKey: 'createdBy', as: 'createdAppointments' });
Appointment.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });

// CheckInSession associations
Patient.hasMany(CheckInSession, { foreignKey: 'patientId', as: 'checkInSessions' });
CheckInSession.belongsTo(Patient, { foreignKey: 'patientId', as: 'Patient' });

Appointment.hasOne(CheckInSession, { foreignKey: 'appointmentId', as: 'checkInSession' });
CheckInSession.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'Appointment' });

User.hasMany(CheckInSession, { foreignKey: 'createdBy', as: 'createdCheckIns' });
CheckInSession.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

User.hasMany(CheckInSession, { foreignKey: 'assignedDoctor', as: 'assignedCheckIns' });
CheckInSession.belongsTo(User, { foreignKey: 'assignedDoctor', as: 'assignedDoctorUser' });

// DoctorSession associations
User.hasMany(DoctorSession, { foreignKey: 'doctorId', as: 'doctorSessions' });
DoctorSession.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

// Vaccination associations
Patient.hasMany(Vaccination, { foreignKey: 'patientId', as: 'vaccinations' });
Vaccination.belongsTo(Patient, { foreignKey: 'patientId', as: 'Patient' });

User.hasMany(Vaccination, { foreignKey: 'createdBy', as: 'createdVaccinations' });
Vaccination.belongsTo(User, { foreignKey: 'createdBy', as: 'CreatedBy' });

module.exports = {
  Family,
  Patient,
  User,
  VitalSigns,
  Appointment,
  CheckInSession,
  DoctorSession,
  Vaccination
};
