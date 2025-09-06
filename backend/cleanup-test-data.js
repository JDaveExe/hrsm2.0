const { sequelize } = require('./config/database');
const { Op } = require('sequelize');
const User = require('./models/User');
const Patient = require('./models/Patient');

const cleanupTestData = async () => {
  console.log('🧹 Cleaning up test patient data...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Use transaction for safety
    const transaction = await sequelize.transaction();

    try {
      // 1. Find all test patients (those created during testing)
      console.log('📋 Finding test patients...');
      
      const testPatients = await Patient.findAll({
        where: {
          // Find patients with test emails or names
          [Op.or]: [
            { firstName: { [Op.like]: 'Test%' } },
            { firstName: { [Op.like]: 'Debug%' } },
            { lastName: { [Op.like]: 'Scenario%' } },
            { lastName: { [Op.like]: 'Patient%' } },
            { lastName: { [Op.like]: 'Test%' } },
            { lastName: { [Op.like]: 'Banner%' } }
          ]
        },
        transaction
      });

      console.log(`Found ${testPatients.length} test patients:`);
      testPatients.forEach(p => {
        console.log(`  - ${p.firstName} ${p.lastName} (ID: ${p.id}, UserID: ${p.userId})`);
      });

      // 2. Find test users by email patterns
      console.log('\n📋 Finding test user accounts...');
      
      const testUsers = await User.findAll({
        where: {
          [Op.or]: [
            { email: { [Op.like]: '%test%' } },
            { email: { [Op.like]: '%example.com%' } },
            { email: { [Op.like]: '%debug%' } },
            { email: { [Op.like]: '%scenario%' } },
            // Exclude important system accounts
            { email: { [Op.notLike]: '%@maybunga.healthcare%' } },
            { email: { [Op.notLike]: '%@brgymaybunga.health%' } }
          ],
          // Only target patient role users, not admin/doctor
          role: 'patient'
        },
        transaction
      });

      console.log(`Found ${testUsers.length} test user accounts:`);
      testUsers.forEach(u => {
        console.log(`  - ${u.email || u.contactNumber} (ID: ${u.id}, Role: ${u.role})`);
      });

      // 3. Confirm before deletion
      console.log('\n⚠️  About to delete:');
      console.log(`   - ${testPatients.length} test patients`);
      console.log(`   - ${testUsers.length} test user accounts`);
      console.log('   - Families will be preserved');
      console.log('   - System accounts (admin/doctor) will be preserved\n');

      // 4. Delete test patients first (this will also handle foreign key constraints)
      if (testPatients.length > 0) {
        const patientIds = testPatients.map(p => p.id);
        await Patient.destroy({
          where: { id: { [Op.in]: patientIds } },
          transaction
        });
        console.log(`✅ Deleted ${testPatients.length} test patients`);
      }

      // 5. Delete test user accounts
      if (testUsers.length > 0) {
        const userIds = testUsers.map(u => u.id);
        await User.destroy({
          where: { id: { [Op.in]: userIds } },
          transaction
        });
        console.log(`✅ Deleted ${testUsers.length} test user accounts`);
      }

      // 6. Also clean up any orphaned User accounts (users without patients)
      console.log('\n🔍 Checking for orphaned user accounts...');
      const orphanedUsers = await User.findAll({
        where: {
          role: 'patient',
          id: { [Op.notIn]: sequelize.literal('(SELECT DISTINCT userId FROM patients WHERE userId IS NOT NULL)') }
        },
        transaction
      });

      if (orphanedUsers.length > 0) {
        console.log(`Found ${orphanedUsers.length} orphaned user accounts:`);
        orphanedUsers.forEach(u => {
          console.log(`  - ${u.email || u.contactNumber} (ID: ${u.id})`);
        });

        await User.destroy({
          where: { id: { [Op.in]: orphanedUsers.map(u => u.id) } },
          transaction
        });
        console.log(`✅ Deleted ${orphanedUsers.length} orphaned user accounts`);
      }

      // Commit the transaction
      await transaction.commit();
      console.log('\n🎉 Cleanup completed successfully!');

      // 7. Show final counts
      const remainingPatients = await Patient.count();
      const remainingUsers = await User.count({ where: { role: 'patient' } });
      const totalFamilies = await sequelize.models.Family.count();

      console.log('\n📊 Final counts:');
      console.log(`   - Patients: ${remainingPatients}`);
      console.log(`   - Patient User accounts: ${remainingUsers}`);
      console.log(`   - Families: ${totalFamilies} (preserved)`);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await sequelize.close();
  }
};

cleanupTestData();
