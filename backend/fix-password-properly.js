const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const fixPasswordProperly = async () => {
  console.log('🔧 Fixing password properly...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Find the user
    const user = await User.findOne({
      where: { email: 'testpatient238787@example.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ Found user:', user.email);
    console.log('Current hash:', user.password);

    // Generate the correct password
    const correctPassword = '15-05-1990';
    console.log('Correct password should be:', correctPassword);

    // Don't hash it ourselves - let the Sequelize hook do it
    console.log('Setting plaintext password - letting Sequelize hook hash it...');

    // Update with plaintext password (the hook will hash it)
    await user.update({ password: correctPassword });
    console.log('✅ User password updated (hook will hash it)');

    // Fetch the user again to verify
    const updatedUser = await User.findOne({
      where: { email: 'testpatient238787@example.com' }
    });

    console.log('Updated hash in database:', updatedUser.password);

    // Test the updated password
    const finalTest = await bcrypt.compare(correctPassword, updatedUser.password);
    console.log('Final test:', finalTest ? '✅ SUCCESS!' : '❌ Still broken');

    if (!finalTest) {
      console.log('❌ Database update failed somehow');
    }

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await sequelize.close();
  }
};

fixPasswordProperly();
