const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const testLogin = async () => {
  console.log('🔐 Testing login after password fix...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    const email = 'testpatient238787@example.com';
    const password = '15-05-1990';

    // Find user
    const user = await User.findOne({
      where: { email: email }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.email);
    console.log('🔐 Current password hash:', user.password);

    // Test password
    const isValid = await bcrypt.compare(password, user.password);
    console.log(`🧪 Password "${password}" validation:`, isValid ? '✅ SUCCESS' : '❌ FAILED');

    if (isValid) {
      console.log('🎉 LOGIN SHOULD WORK NOW!');
    } else {
      console.log('❌ Login will still fail');
      
      // Let's create a completely new hash and test it
      console.log('\n🔄 Creating fresh password hash...');
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(password, salt);
      console.log('New hash:', newHash);
      
      const newTest = await bcrypt.compare(password, newHash);
      console.log('New hash test:', newTest ? '✅ Works' : '❌ Broken');
      
      // Update with the new hash
      await user.update({ password: newHash });
      console.log('✅ Updated user with fresh hash');
      
      // Final test
      const finalUser = await User.findByPk(user.id);
      const finalTest = await bcrypt.compare(password, finalUser.password);
      console.log('🎯 Final test:', finalTest ? '✅ SUCCESS!' : '❌ Still broken');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
};

testLogin();
