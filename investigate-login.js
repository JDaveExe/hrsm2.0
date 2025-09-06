const { sequelize } = require('./backend/config/database');
const User = require('./backend/models/User');
const bcrypt = require('bcryptjs');

const investigateLoginIssue = async () => {
  console.log('🔍 Deep Investigation: Patient Login Issue\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Check if User record exists
    const email = 'testpatient238787@example.com';
    const password = '15-05-1990';
    
    console.log('📋 Searching for user in database...');
    const user = await User.findOne({
      where: {
        email: email
      }
    });

    if (user) {
      console.log('✅ User found in Users table:');
      console.log(`  - User ID: ${user.id}`);
      console.log(`  - Username: ${user.username}`);
      console.log(`  - Email: ${user.email}`);
      console.log(`  - Contact: ${user.contactNumber}`);
      console.log(`  - Role: ${user.role}`);
      console.log(`  - First Name: ${user.firstName}`);
      console.log(`  - Last Name: ${user.lastName}`);
      console.log(`  - Password Hash: ${user.password}`);
      console.log(`  - Created: ${user.createdAt}`);

      // Test password verification
      console.log('\n🔐 Testing password verification...');
      console.log(`Expected password: "${password}"`);
      
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      console.log(`Password verification result: ${isPasswordMatch}`);
      
      if (!isPasswordMatch) {
        console.log('❌ Password does not match stored hash');
        
        // Let's test what password would work
        console.log('\n🧪 Testing different password formats...');
        const testPasswords = [
          '15-05-1990',
          '15051990',
          '1990-05-15',
          '05-15-1990'
        ];
        
        for (const testPwd of testPasswords) {
          const testResult = await bcrypt.compare(testPwd, user.password);
          console.log(`  "${testPwd}": ${testResult ? '✅ MATCH' : '❌ No match'}`);
        }
      } else {
        console.log('✅ Password matches stored hash');
      }
      
    } else {
      console.log('❌ User not found in Users table');
      
      // Check by contact number instead
      const userByPhone = await User.findOne({
        where: {
          contactNumber: '09238787890'
        }
      });
      
      if (userByPhone) {
        console.log('✅ User found by phone number:');
        console.log(`  - User ID: ${userByPhone.id}`);
        console.log(`  - Username: ${userByPhone.username}`);
        console.log(`  - Email: ${userByPhone.email}`);
        console.log(`  - Contact: ${userByPhone.contactNumber}`);
      } else {
        console.log('❌ User not found by phone number either');
      }
    }

  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await sequelize.close();
  }
};

investigateLoginIssue();
