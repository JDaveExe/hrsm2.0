require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./backend/config/database');
// Import models with associations
require('./backend/models');
const Appointment = require('./backend/models/Appointment');
const Patient = require('./backend/models/Patient');

async function checkAppointments() {
  try {
    console.log('🔍 Checking appointments database...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Get all appointments with patient data
    const appointments = await Appointment.findAll({
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'contactNumber']
        }
      ],
      order: [['appointmentDate', 'DESC']]
    });
    
    console.log(`\n📊 Found ${appointments.length} appointments in database:`);
    
    appointments.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.patient ? apt.patient.firstName + ' ' + apt.patient.lastName : 'Unknown Patient'}`);
      console.log(`   Date: ${apt.appointmentDate}, Time: ${apt.appointmentTime}`);
      console.log(`   Type: ${apt.type}, Status: ${apt.status}`);
      console.log(`   ID: ${apt.id}, Patient ID: ${apt.patientId}\n`);
    });
    
    // Check for Ricardo specifically
    const ricardoAppointments = appointments.filter(apt => 
      apt.patient && (
        apt.patient.firstName.includes('Ricardo') || 
        apt.patient.lastName.includes('Aquino')
      )
    );
    
    if (ricardoAppointments.length > 0) {
      console.log(`❌ Found ${ricardoAppointments.length} Ricardo Aquino appointments:`);
      ricardoAppointments.forEach(apt => {
        console.log(`   - ID: ${apt.id}, Patient: ${apt.patient.firstName} ${apt.patient.lastName}`);
      });
    } else {
      console.log('✅ No Ricardo Aquino appointments found in database.');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error checking appointments:', error);
  }
}

checkAppointments();