require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./backend/config/database');
// Import models with associations
require('./backend/models');
const Appointment = require('./backend/models/Appointment');
const Patient = require('./backend/models/Patient');

async function cleanupSampleData() {
  try {
    console.log('🧹 Starting cleanup of Ricardo Aquino sample data...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Start transaction for safe cleanup
    const transaction = await sequelize.transaction();
    
    try {
      console.log('\n🔍 Finding Ricardo Aquino data...');
      
      // Find Ricardo Aquino patient
      const ricardoPatient = await Patient.findOne({
        where: {
          firstName: 'Ricardo',
          lastName: 'Aquino'
        },
        transaction
      });
      
      if (!ricardoPatient) {
        console.log('✅ No Ricardo Aquino patient found. Nothing to clean up.');
        await transaction.rollback();
        await sequelize.close();
        return;
      }
      
      // Find all related data for this patient
      const appointments = await Appointment.findAll({
        where: { patientId: ricardoPatient.id },
        transaction
      });
      
      // Find check-in sessions
      const CheckInSession = require('./backend/models/CheckInSession.sequelize');
      const checkInSessions = await CheckInSession.findAll({
        where: { patientId: ricardoPatient.id },
        transaction
      });
      
      console.log(`\n📋 Found data to remove:`);
      console.log(`   Patient: ${ricardoPatient.firstName} ${ricardoPatient.lastName} (ID: ${ricardoPatient.id})`);
      console.log(`   Appointments: ${appointments.length} records (IDs: ${appointments.map(a => a.id).join(', ')})`);
      console.log(`   Check-in Sessions: ${checkInSessions.length} records (IDs: ${checkInSessions.map(s => s.id).join(', ')})`);
      
      // Delete check-in sessions first
      if (checkInSessions.length > 0) {
        console.log(`\n🗑️  Deleting ${checkInSessions.length} check-in sessions...`);
        const deletedSessions = await CheckInSession.destroy({
          where: { patientId: ricardoPatient.id },
          transaction
        });
        console.log(`✅ Deleted ${deletedSessions} check-in session records.`);
      }
      
      // Delete appointments
      if (appointments.length > 0) {
        console.log(`\n🗑️  Deleting ${appointments.length} appointments...`);
        const deletedAppointments = await Appointment.destroy({
          where: { patientId: ricardoPatient.id },
          transaction
        });
        console.log(`✅ Deleted ${deletedAppointments} appointment records.`);
      }
      
      // Delete patient record
      console.log(`\n🗑️  Deleting patient record...`);
      const deletedPatient = await Patient.destroy({
        where: { 
          id: ricardoPatient.id,
          firstName: 'Ricardo',
          lastName: 'Aquino'
        },
        transaction
      });
      console.log(`✅ Deleted ${deletedPatient} patient record.`);
      
      // Commit transaction
      await transaction.commit();
      
      console.log(`\n🎉 Sample data cleanup completed successfully!`);
      console.log(`   - Removed ${deletedAppointments} appointments`);
      console.log(`   - Removed ${deletedPatient} patient record`);
      console.log(`\n✨ The appointments list should now show only real data.`);
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.log('\n⚠️  Database transaction was rolled back. Data is unchanged.');
  }
}

cleanupSampleData();