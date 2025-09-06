const { sequelize } = require('./config/database');
const User = require('./models/User');

async function safeRemoveConflictingAccounts() {
    try {
        await sequelize.authenticate();
        console.log('🧹 Safely removing conflicting admin/doctor accounts...\n');

        // Find the conflicting accounts
        const conflictingAccounts = await User.findAll({
            where: {
                id: [1, 2, 6, 14, 15, 46] // IDs from the analysis
            }
        });

        if (conflictingAccounts.length === 0) {
            console.log('✅ No conflicting accounts found');
            return;
        }

        console.log('🔍 Found conflicting accounts:');
        conflictingAccounts.forEach(user => {
            console.log(`  ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
        });

        console.log('\n⚠️  These accounts conflict with hardcoded test accounts or are unnecessary duplicates');
        console.log('🗑️  Removing them...\n');

        // Remove them
        for (const user of conflictingAccounts) {
            await user.destroy();
            console.log(`✅ Removed: ID ${user.id} - ${user.email} (${user.role})`);
        }

        console.log('\n🎉 Cleanup completed!');
        console.log('💡 Now hardcoded test accounts (100001-100003) can be used without conflicts');
        
        await sequelize.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

safeRemoveConflictingAccounts();
