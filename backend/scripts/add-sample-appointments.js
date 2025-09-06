const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'hrsm_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false
  }
);

// Define models (simplified versions)
const Patient = sequelize.define('Patient', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: DataTypes.STRING,
  contactNumber: DataTypes.STRING,
  dateOfBirth: DataTypes.DATE,
  gender: DataTypes.STRING
}, { tableName: 'patients' });

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: DataTypes.STRING,
  email: DataTypes.STRING,
  role: DataTypes.STRING,
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING
}, { tableName: 'users' });

const Appointment = sequelize.define('Appointment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  patientId: { type: DataTypes.INTEGER, allowNull: false },
  doctorId: { type: DataTypes.INTEGER, allowNull: false },
  appointmentDate: { type: DataTypes.DATEONLY, allowNull: false },
  appointmentTime: { type: DataTypes.TIME, allowNull: false },
  duration: { type: DataTypes.INTEGER, defaultValue: 30 },
  type: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'Scheduled' },
  priority: { type: DataTypes.STRING, defaultValue: 'Normal' },
  notes: DataTypes.TEXT,
  symptoms: DataTypes.TEXT
}, { tableName: 'appointments' });

async function addSampleAppointments() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // Get existing patients and doctors
    const patients = await Patient.findAll();
    const doctors = await User.findAll({ where: { role: 'Doctor' } });
    
    console.log(`📋 Found ${patients.length} patients and ${doctors.length} doctors`);

    if (patients.length === 0 || doctors.length === 0) {
      console.log('❌ Need patients and doctors to create appointments');
      return;
    }

    // Create sample appointments for different dates
    const today = new Date();
    const sampleAppointments = [];

    // Helper function to create date
    const createDate = (daysFromToday) => {
      const date = new Date(today);
      date.setDate(date.getDate() + daysFromToday);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    // Today's appointments
    sampleAppointments.push(
      {
        patientId: patients[0]?.id,
        doctorId: doctors[0]?.id,
        appointmentDate: createDate(0),
        appointmentTime: '09:00:00',
        type: 'Check-up',
        status: 'Confirmed',
        priority: 'Normal',
        notes: 'Regular health checkup',
        symptoms: 'None, routine visit'
      },
      {
        patientId: patients[1]?.id,
        doctorId: doctors[0]?.id,
        appointmentDate: createDate(0),
        appointmentTime: '10:30:00',
        type: 'Follow-up',
        status: 'Scheduled',
        priority: 'Normal',
        notes: 'Blood pressure follow-up',
        symptoms: 'Mild headaches'
      },
      {
        patientId: patients[2]?.id,
        doctorId: doctors[0]?.id,
        appointmentDate: createDate(0),
        appointmentTime: '14:00:00',
        type: 'Consultation',
        status: 'Confirmed',
        priority: 'High',
        notes: 'Diabetes management consultation',
        symptoms: 'Increased thirst, frequent urination'
      }
    );

    // Tomorrow's appointments
    sampleAppointments.push(
      {
        patientId: patients[3]?.id,
        doctorId: doctors[0]?.id,
        appointmentDate: createDate(1),
        appointmentTime: '08:30:00',
        type: 'Emergency',
        status: 'Scheduled',
        priority: 'Emergency',
        notes: 'Chest pain evaluation',
        symptoms: 'Chest pain, shortness of breath'
      },
      {
        patientId: patients[4]?.id,
        doctorId: doctors[0]?.id,
        appointmentDate: createDate(1),
        appointmentTime: '11:00:00',
        type: 'Vaccination',
        status: 'Confirmed',
        priority: 'Low',
        notes: 'Annual flu vaccination',
        symptoms: 'None'
      }
    );

    // Day after tomorrow
    sampleAppointments.push(
      {
        patientId: patients[5]?.id,
        doctorId: doctors[0]?.id,
        appointmentDate: createDate(2),
        appointmentTime: '09:30:00',
        type: 'Follow-up',
        status: 'Scheduled',
        priority: 'Normal',
        notes: 'Post-surgery rehabilitation',
        symptoms: 'Limited mobility in left arm'
      }
    );

    // Next week appointments
    sampleAppointments.push(
      {
        patientId: patients[6]?.id,
        doctorId: doctors[0]?.id,
        appointmentDate: createDate(7),
        appointmentTime: '10:00:00',
        type: 'Consultation',
        status: 'Scheduled',
        priority: 'Normal',
        notes: 'Anxiety management session',
        symptoms: 'Anxiety, sleep issues'
      },
      {
        patientId: patients[0]?.id,
        doctorId: doctors[0]?.id,
        appointmentDate: createDate(7),
        appointmentTime: '15:30:00',
        type: 'Lab Test',
        status: 'Scheduled',
        priority: 'Low',
        notes: 'Review recent blood work results',
        symptoms: 'Follow-up on lab tests'
      }
    );

    // Add appointments to different dates this month
    for (let i = 3; i < 25; i += 3) {
      const patientIndex = i % patients.length;
      const doctorIndex = i % doctors.length;
      
      sampleAppointments.push({
        patientId: patients[patientIndex]?.id,
        doctorId: doctors[doctorIndex]?.id,
        appointmentDate: createDate(i),
        appointmentTime: `${9 + (i % 6)}:${(i % 2) * 30}0:00`,
        type: ['Check-up', 'Follow-up', 'Consultation', 'Vaccination'][i % 4],
        status: ['Scheduled', 'Confirmed'][i % 2],
        priority: ['Low', 'Normal', 'High'][i % 3],
        notes: `Appointment for ${patients[patientIndex]?.firstName}`,
        symptoms: 'Various symptoms'
      });
    }

    console.log(`📅 Creating ${sampleAppointments.length} sample appointments...`);

    // Insert appointments
    for (const appointment of sampleAppointments) {
      if (appointment.patientId && appointment.doctorId) {
        await Appointment.create(appointment);
        console.log(`✅ Created appointment for ${appointment.appointmentDate} at ${appointment.appointmentTime}`);
      }
    }

    console.log('🎉 Sample appointments added successfully!');
    
    // Show summary
    const totalAppointments = await Appointment.count();
    console.log(`📊 Total appointments in database: ${totalAppointments}`);

  } catch (error) {
    console.error('❌ Error adding sample appointments:', error);
  } finally {
    await sequelize.close();
  }
}

addSampleAppointments();
