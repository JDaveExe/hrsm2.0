const { sequelize } = require('./config/database');
const { Op } = require('sequelize');
const User = require('./models/User');
const Patient = require('./models/Patient');

const wipeAllPatients = async () => {
  console.log('🧹 CAREFUL: Wiping ALL patient records for fresh registration testing...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Use transaction for safety
    const transaction = await sequelize.transaction();

    try {
      // 1. Get all current patients
      console.log('📋 Finding all patients...');
      const allPatients = await Patient.findAll({
        attributes: ['id', 'firstName', 'lastName', 'userId'],
        transaction
      });

      console.log(`Found ${allPatients.length} patients to remove:`);
      allPatients.forEach(patient => {
        console.log(`  - ${patient.firstName} ${patient.lastName} (ID: ${patient.id}${patient.userId ? `, UserID: ${patient.userId}` : ', No user account'})`);
      });

      if (allPatients.length === 0) {
        console.log('✅ No patients found - database is already clean');
        await transaction.commit();
        return;
      }

      // 2. Get User IDs that are linked to patients
      const userIds = allPatients
        .filter(patient => patient.userId)
        .map(patient => patient.userId);

      console.log(`\n📋 Found ${userIds.length} patient user accounts to remove`);

      // 3. Show what will be preserved
      console.log('\n🛡️  PRESERVED DATA:');
      console.log('   ✅ All families and family structure');
      console.log('   ✅ System accounts (admin, doctor)');
      console.log('   ✅ All other non-patient data');

      console.log('\n🗑️  WILL BE DELETED:');
      console.log(`   ❌ ${allPatients.length} patient records`);
      console.log(`   ❌ ${userIds.length} patient user accounts`);

      // 4. Delete all patients first (this removes foreign key references)
      console.log('\n🗑️  Step 1: Deleting all patient records...');
      const deletedPatients = await Patient.destroy({
        where: {},
        transaction
      });
      console.log(`✅ Deleted ${deletedPatients} patient records`);

      // 5. Delete associated User accounts (only patient role accounts)
      if (userIds.length > 0) {
        console.log('\n🗑️  Step 2: Deleting patient user accounts...');
        const deletedUsers = await User.destroy({
          where: {
            [Op.and]: [
              { id: { [Op.in]: userIds } },
              { role: 'patient' } // Extra safety: only delete patient role accounts
            ]
          },
          transaction
        });
        console.log(`✅ Deleted ${deletedUsers} patient user accounts`);
      }

      // 6. Clean up any orphaned patient user accounts (just to be thorough)
      console.log('\n🧹 Step 3: Cleaning up any remaining orphaned patient accounts...');
      const orphanedUsers = await User.destroy({
        where: {
          [Op.and]: [
            { role: 'patient' },
            { email: { [Op.not]: 'admin@maybunga.healthcare' } },
            { email: { [Op.not]: 'doctor@maybunga.healthcare' } }
          ]
        },
        transaction
      });
      
      if (orphanedUsers > 0) {
        console.log(`✅ Cleaned up ${orphanedUsers} orphaned patient accounts`);
      } else {
        console.log('✅ No orphaned accounts found');
      }

      // Commit the transaction
      await transaction.commit();
      console.log('\n🎉 PATIENT DATABASE RESET COMPLETE!');
      console.log('📝 Ready for fresh patient registration testing');

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Wipe failed:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

// Ask for confirmation before running
console.log('⚠️  WARNING: This will delete ALL patient data!');
console.log('⚠️  Families will be preserved, but all patients will be removed.');
console.log('⚠️  This is intended for testing purposes only.');
console.log('\n💡 To proceed, run: node wipe-all-patients.js --confirm');

if (process.argv.includes('--confirm')) {
  wipeAllPatients();
} else {
  console.log('\n❌ Cancelled - missing --confirm flag');
  process.exit(0);
}
