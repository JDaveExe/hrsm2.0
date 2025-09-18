require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./backend/config/database');
// Import models with associations
require('./backend/models');
const Appointment = require('./backend/models/Appointment');
const Patient = require('./backend/models/Patient');

async function checkSampleData() {
  try {
    console.log('🔍 Checking for Ricardo Aquino sample data...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Find Ricardo Aquino patient
    const ricardoPatient = await Patient.findOne({
      where: {
        firstName: 'Ricardo',
        lastName: 'Aquino'
      }
    });
    
    if (ricardoPatient) {
      console.log(`\n👤 Found Ricardo Aquino patient:`);
      console.log(`   ID: ${ricardoPatient.id}`);
      console.log(`   Name: ${ricardoPatient.firstName} ${ricardoPatient.lastName}`);
      console.log(`   Contact: ${ricardoPatient.contactNumber}`);
      console.log(`   Created: ${ricardoPatient.createdAt}`);
      
      // Get all appointments for this patient
      const appointments = await Appointment.findAll({
        where: { patientId: ricardoPatient.id },
        order: [['appointmentDate', 'ASC']]
      });
      
      console.log(`\n📅 Found ${appointments.length} appointments for Ricardo Aquino:`);
      appointments.forEach(apt => {
        console.log(`   - ID: ${apt.id}, Date: ${apt.appointmentDate}, Time: ${apt.appointmentTime}, Type: ${apt.type}, Status: ${apt.status}`);
      });
      
      console.log(`\n⚠️  This appears to be sample data that needs to be removed.`);
      console.log(`\n🗑️  To clean up, we need to:`);
      console.log(`   1. Delete ${appointments.length} appointments (IDs: ${appointments.map(a => a.id).join(', ')})`);
      console.log(`   2. Delete patient record (ID: ${ricardoPatient.id})`);
      
    } else {
      console.log('✅ No Ricardo Aquino patient found in database.');
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error checking sample data:', error);
  }
}

checkSampleData();