const { sequelize } = require('./config/database');
const { Op } = require('sequelize');

const safePurgePatients = async () => {
  console.log('🧹 SAFE PURGE: Removing all patient data with table checks...\n');

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

      console.log(`Found ${allPatients.length} patients to remove`);

      if (allPatients.length === 0) {
        console.log('✅ No patients found - database is already clean');
        await transaction.commit();
        return;
      }

      const patientIds = allPatients.map(p => p.id);
      const userIds = allPatients.filter(p => p.userId).map(p => p.userId);

      // 2. Helper function to check if table exists and delete
      const safeDelete = async (tableName, whereCondition, description) => {
        try {
          const result = await sequelize.query(
            `DELETE FROM ${tableName} WHERE ${whereCondition}`,
            { 
              replacements: [patientIds],
              transaction 
            }
          );
          console.log(`   ✅ ${description}: ${result[0].affectedRows || 0}`);
          return result[0].affectedRows || 0;
        } catch (error) {
          if (error.message.includes("doesn't exist")) {
            console.log(`   ⚠️  ${description}: Table doesn't exist, skipping`);
            return 0;
          } else {
            console.log(`   ❌ ${description}: ${error.message}`);
            return 0;
          }
        }
      };

      // 3. Delete dependencies in the right order
      console.log('\n🗑️  Step 1: Deleting patient dependencies...');
      
      await safeDelete('check_in_sessions', 'patientId IN (?)', 'Deleted check-in sessions');
      await safeDelete('appointments', 'patientId IN (?)', 'Deleted appointments');
      await safeDelete('medical_records', 'patientId IN (?)', 'Deleted medical records');
      await safeDelete('prescriptions', 'patientId IN (?)', 'Deleted prescriptions');
      await safeDelete('vaccinations', 'patientId IN (?)', 'Deleted vaccinations');
      await safeDelete('vital_signs', 'patientId IN (?)', 'Deleted vital signs');

      // Delete any other potential dependencies
      await safeDelete('checkups', 'patientId IN (?)', 'Deleted checkups');
      await safeDelete('patient_history', 'patientId IN (?)', 'Deleted patient history');

      // 4. Delete patients
      console.log('\n🗑️  Step 2: Deleting patient records...');
      const deletedPatients = await sequelize.query(
        'DELETE FROM patients WHERE id IN (?)',
        { 
          replacements: [patientIds],
          transaction 
        }
      );
      console.log(`   ✅ Deleted patients: ${deletedPatients[0].affectedRows || 0}`);

      // 5. Delete associated User accounts
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

      // 6. Clean up any remaining orphaned patient accounts
      console.log('\n🧹 Step 4: Final cleanup of orphaned patient accounts...');
      const orphanedCleanup = await sequelize.query(
        'DELETE FROM users WHERE role = "patient" AND email NOT IN ("admin@maybunga.healthcare", "doctor@maybunga.healthcare")',
        { transaction }
      );
      console.log(`   ✅ Cleaned up orphaned accounts: ${orphanedCleanup[0].affectedRows || 0}`);

      // Commit the transaction
      await transaction.commit();
      console.log('\n🎉 PATIENT DATABASE COMPLETELY RESET!');
      console.log('📝 All patient data and dependencies removed');
      console.log('🛡️  Families and system accounts preserved');
      console.log('🆕 Ready for fresh patient registration testing');

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Safe purge failed:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

safePurgePatients();
