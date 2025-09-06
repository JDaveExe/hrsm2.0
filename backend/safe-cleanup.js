const { sequelize } = require('./config/database');
const { Op } = require('sequelize');
const User = require('./models/User');
const Patient = require('./models/Patient');

const safecleanup = async () => {
  console.log('🧹 Safe cleanup: Remove only orphaned User accounts...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Use transaction for safety
    const transaction = await sequelize.transaction();

    try {
      // Find User accounts that are no longer referenced by any patient
      console.log('📋 Finding orphaned User accounts...');
      
      const orphanedUsers = await User.findAll({
        where: {
          [Op.and]: [
            // Must be patient role
            { role: 'patient' },
            // Must not be system accounts
            { 
              [Op.and]: [
                { email: { [Op.not]: 'admin@maybunga.healthcare' } },
                { email: { [Op.not]: 'doctor@maybunga.healthcare' } }
              ]
            },
            // Must not be referenced by any patient
            { 
              id: { 
                [Op.notIn]: sequelize.literal('(SELECT DISTINCT userId FROM patients WHERE userId IS NOT NULL)') 
              } 
            }
          ]
        },
        transaction
      });

      console.log(`Found ${orphanedUsers.length} orphaned user accounts:`);
      orphanedUsers.forEach(user => {
        console.log(`  - ${user.email || user.contactNumber} (ID: ${user.id}, Role: ${user.role})`);
      });

      if (orphanedUsers.length > 0) {
        console.log('\n🗑️  Deleting orphaned user accounts...');
        
        await User.destroy({
          where: { id: { [Op.in]: orphanedUsers.map(u => u.id) } },
          transaction
        });
        
        console.log(`✅ Deleted ${orphanedUsers.length} orphaned user accounts`);
      } else {
        console.log('✅ No orphaned user accounts found');
      }

      // Commit the transaction
      await transaction.commit();
      console.log('\n✅ Cleanup completed successfully!');

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }

  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

safecleanup();
