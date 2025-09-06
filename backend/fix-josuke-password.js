const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function fixJosukePassword() {
    try {
        await sequelize.authenticate();
        console.log('🔧 Fixing Josuke\'s password...\n');

        const correctPassword = '21-02-1992';
        
        // Find Josuke's user account
        const user = await User.findOne({
            where: { email: 'jojojosuke@gmail.com' }
        });

        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ Found user:', user.email);
        console.log('Current password hash:', user.password.substring(0, 30) + '...');

        // Update the password directly (this will trigger the beforeUpdate hook)
        await user.update({ password: correctPassword });

        console.log('✅ Password updated successfully!');
        console.log('New password hash:', user.password.substring(0, 30) + '...');

        // Test the password
        const isValid = await bcrypt.compare(correctPassword, user.password);
        console.log('Password verification test:', isValid ? '✅ PASSED' : '❌ FAILED');

        await sequelize.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

fixJosukePassword();
