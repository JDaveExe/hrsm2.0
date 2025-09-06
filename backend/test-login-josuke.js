const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testLogin() {
    try {
        await sequelize.authenticate();
        console.log('🔍 Testing login for Josuke Joestar...\n');

        // Test data from the banner
        const testEmail = 'jojojosuke@gmail.com';
        const testPhone = '09167674206';
        const testPassword = '21-02-1992';

        console.log('Test credentials:');
        console.log('Email:', testEmail);
        console.log('Phone:', testPhone);
        console.log('Password:', testPassword);
        console.log('');

        // Find the user
        const user = await User.findOne({
            where: { email: testEmail }
        });

        if (!user) {
            console.log('❌ User not found with email:', testEmail);
            return;
        }

        console.log('✅ User found:');
        console.log('- ID:', user.id);
        console.log('- Email:', user.email);
        console.log('- Phone:', user.contactNumber);
        console.log('- Role:', user.role);
        console.log('- Password hash:', user.password ? user.password.substring(0, 30) + '...' : 'NULL');
        console.log('');

        // Test password verification with email login
        console.log('🔐 Testing password verification...');
        const isPasswordValid = await bcrypt.compare(testPassword, user.password);
        console.log('Password valid with email login:', isPasswordValid ? '✅ YES' : '❌ NO');

        // Also test if we can find by phone
        const userByPhone = await User.findOne({
            where: { contactNumber: testPhone }
        });

        if (userByPhone) {
            console.log('✅ User also found by phone number');
            const isPasswordValidPhone = await bcrypt.compare(testPassword, userByPhone.password);
            console.log('Password valid with phone login:', isPasswordValidPhone ? '✅ YES' : '❌ NO');
        }

        // Check raw password storage (for debugging)
        console.log('');
        console.log('🔍 Raw password debugging:');
        console.log('Expected password:', testPassword);
        console.log('Stored hash starts with:', user.password ? user.password.substring(0, 10) : 'NULL');
        console.log('Hash length:', user.password ? user.password.length : 0);

        await sequelize.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

testLogin();
