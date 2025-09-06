const { sequelize } = require('./config/database');
const { Op } = require('sequelize');

const wipeAllPatientsComprehensive = async () => {
  console.log('🧹 COMPREHENSIVE: Wiping ALL patient records and dependencies...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Use transaction for safety
    const transaction = await sequelize.transaction();

    try {
      // 1. Get all current patients
      console.log('📋 Finding all patients...');
      const allPatients = await sequelize.query(
        'SELECT id, firstName, lastName, userId FROM patients',
        { 
          type: sequelize.QueryTypes.SELECT,
          transaction 
        }
      );

      console.log(`Found ${allPatients.length} patients to remove:`);
      allPatients.slice(0, 5).forEach(patient => {
        console.log(`  - ${patient.firstName} ${patient.lastName} (ID: ${patient.id}${patient.userId ? `, UserID: ${patient.userId}` : ', No user account'})`);
      });
      if (allPatients.length > 5) {
        console.log(`  ... and ${allPatients.length - 5} more`);
      }

      if (allPatients.length === 0) {
        console.log('✅ No patients found - database is already clean');
        await transaction.commit();
        return;
      }

      const patientIds = allPatients.map(p => p.id);
      const userIds = allPatients.filter(p => p.userId).map(p => p.userId);

      // 2. Delete dependencies in the right order
      console.log('\n🗑️  Step 1: Deleting patient dependencies...');
      
      // Delete check-in sessions
      const deletedSessions = await sequelize.query(
        'DELETE FROM check_in_sessions WHERE patientId IN (?)',
        { 
          replacements: [patientIds],
          transaction 
        }
      );
      console.log(`   ✅ Deleted check-in sessions: ${deletedSessions[0].affectedRows || 0}`);

      // Delete appointments
      const deletedAppointments = await sequelize.query(
        'DELETE FROM appointments WHERE patientId IN (?)',
        { 
          replacements: [patientIds],
          transaction 
        }
      );
      console.log(`   ✅ Deleted appointments: ${deletedAppointments[0].affectedRows || 0}`);

      // Delete medical records
      const deletedRecords = await sequelize.query(
        'DELETE FROM medical_records WHERE patientId IN (?)',
        { 
          replacements: [patientIds],
          transaction 
        }
      );
      console.log(`   ✅ Deleted medical records: ${deletedRecords[0].affectedRows || 0}`);

      // Delete prescriptions
      const deletedPrescriptions = await sequelize.query(
        'DELETE FROM prescriptions WHERE patientId IN (?)',
        { 
          replacements: [patientIds],
          transaction 
        }
      );
      console.log(`   ✅ Deleted prescriptions: ${deletedPrescriptions[0].affectedRows || 0}`);

      // Delete vaccinations
      const deletedVaccinations = await sequelize.query(
        'DELETE FROM vaccinations WHERE patientId IN (?)',
        { 
          replacements: [patientIds],
          transaction 
        }
      );
      console.log(`   ✅ Deleted vaccinations: ${deletedVaccinations[0].affectedRows || 0}`);

      // Delete vital signs
      const deletedVitalSigns = await sequelize.query(
        'DELETE FROM vital_signs WHERE patientId IN (?)',
        { 
          replacements: [patientIds],
          transaction 
        }
      );
      console.log(`   ✅ Deleted vital signs: ${deletedVitalSigns[0].affectedRows || 0}`);

      // 3. Delete patients
      console.log('\n🗑️  Step 2: Deleting patient records...');
      const deletedPatients = await sequelize.query(
        'DELETE FROM patients WHERE id IN (?)',
        { 
          replacements: [patientIds],
          transaction 
        }
      );
      console.log(`   ✅ Deleted patients: ${deletedPatients[0].affectedRows || 0}`);

      // 4. Delete associated User accounts
      if (userIds.length > 0) {
        console.log('\n🗑️  Step 3: Deleting patient user accounts...');
        const deletedUsers = await sequelize.query(
          'DELETE FROM users WHERE id IN (?) AND role = "patient"',
          { 
            replacements: [userIds],
            transaction 
          }
        );
        console.log(`   ✅ Deleted user accounts: ${deletedUsers[0].affectedRows || 0}`);
      }

      // 5. Clean up any remaining orphaned patient accounts
      console.log('\n🧹 Step 4: Final cleanup of orphaned patient accounts...');
      const orphanedCleanup = await sequelize.query(
        'DELETE FROM users WHERE role = "patient" AND email NOT IN ("admin@maybunga.healthcare", "doctor@maybunga.healthcare")',
        { transaction }
      );
      console.log(`   ✅ Cleaned up orphaned accounts: ${orphanedCleanup[0].affectedRows || 0}`);

      // Commit the transaction
      await transaction.commit();
      console.log('\n🎉 COMPLETE DATABASE RESET SUCCESSFUL!');
      console.log('📝 All patient data and dependencies removed');
      console.log('🛡️  Families and system accounts preserved');
      console.log('🆕 Ready for fresh patient registration testing');

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Comprehensive wipe failed:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

// Ask for confirmation before running
console.log('⚠️  WARNING: This will delete ALL patient data and related records!');
console.log('⚠️  This includes: patients, appointments, medical records, prescriptions, etc.');
console.log('⚠️  Families will be preserved, but all patients will be removed.');
console.log('⚠️  This is intended for testing purposes only.');
console.log('\n💡 To proceed, run: node comprehensive-wipe.js --confirm');

if (process.argv.includes('--confirm')) {
  wipeAllPatientsComprehensive();
} else {
  console.log('\n❌ Cancelled - missing --confirm flag');
  process.exit(0);
}
