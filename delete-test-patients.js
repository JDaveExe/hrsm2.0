require('dotenv').config({ path: './backend/.env' });
const { Patient, CheckInSession, Appointment, VitalSigns, DoctorSession, Vaccination } = require('./backend/models');
const { Op } = require('sequelize');

async function deleteTestPatients() {
  try {
    console.log('🔍 Searching for test patients...');
    
    // Find all patients with 'test' in their firstName or lastName
    const testPatients = await Patient.findAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.like]: '%test%' } },
          { lastName: { [Op.like]: '%test%' } },
          { firstName: { [Op.like]: '%Test%' } },
          { lastName: { [Op.like]: '%Test%' } }
        ]
      }
    });

    if (testPatients.length === 0) {
      console.log('✅ No test patients found in the database.');
      return;
    }

    console.log(`\n📋 Found ${testPatients.length} test patient(s):`);
    testPatients.forEach((patient, index) => {
      console.log(`${index + 1}. ID: ${patient.id} - ${patient.firstName} ${patient.lastName} (${patient.email || 'No email'})`);
    });

    const testPatientIds = testPatients.map(p => p.id);
    
    // Delete related records first to avoid foreign key constraint errors
    console.log('\n🗑️ Deleting related records...');
    
    // Delete check-in sessions
    const checkInDeleted = await CheckInSession.destroy({
      where: { patientId: { [Op.in]: testPatientIds } }
    });
    console.log(`   Deleted ${checkInDeleted} check-in session(s)`);
    
    // Delete appointments
    const appointmentsDeleted = await Appointment.destroy({
      where: { patientId: { [Op.in]: testPatientIds } }
    });
    console.log(`   Deleted ${appointmentsDeleted} appointment(s)`);
    
    // Delete doctor sessions (if they reference patients)
    const doctorSessionsDeleted = await DoctorSession.destroy({
      where: { patientId: { [Op.in]: testPatientIds } }
    }).catch(() => 0); // Ignore if no patientId column
    console.log(`   Deleted ${doctorSessionsDeleted} doctor session(s)`);
    
    // Delete vaccinations
    const vaccinationsDeleted = await Vaccination.destroy({
      where: { patientId: { [Op.in]: testPatientIds } }
    });
    console.log(`   Deleted ${vaccinationsDeleted} vaccination(s)`);
    
    // Delete vital signs
    const vitalSignsDeleted = await VitalSigns.destroy({
      where: { patientId: { [Op.in]: testPatientIds } }
    });
    console.log(`   Deleted ${vitalSignsDeleted} vital sign(s)`);

    // Now delete test patients
    console.log('\n🗑️ Deleting test patients...');
    const deleteResult = await Patient.destroy({
      where: {
        [Op.or]: [
          { firstName: { [Op.like]: '%test%' } },
          { lastName: { [Op.like]: '%test%' } },
          { firstName: { [Op.like]: '%Test%' } },
          { lastName: { [Op.like]: '%Test%' } }
        ]
      }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult} test patient(s) from the database.`);
    console.log('🎉 Database cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error deleting test patients:', error);
  } finally {
    process.exit(0);
  }
}

deleteTestPatients();
