const User = require('./backend/models/User');
const { sequelize } = require('./backend/config/database');

async function testAdminUserLookup() {
  try {
    console.log('🔍 Testing admin user lookup...\n');

    // Check all admin users
    const adminUsers = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'username', 'email', 'role', 'firstName', 'lastName', 'position', 'isActive'],
      order: [['id', 'ASC']]
    });

    console.log('📋 All admin users in database:');
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id} | ${user.firstName} ${user.lastName} | ${user.username} | Active: ${user.isActive}`);
    });

    // Test current lookup logic
    console.log('\n🔍 Testing current lookup logic...');
    const currentLookup = await User.findOne({ 
      where: { role: 'admin', isActive: true },
      attributes: ['id', 'username', 'email', 'role', 'firstName', 'lastName', 'position']
    });

    if (currentLookup) {
      console.log(`✅ Current lookup finds: ${currentLookup.firstName} ${currentLookup.lastName} (ID: ${currentLookup.id})`);
    } else {
      console.log('❌ Current lookup finds no active admin user');
    }

    // Test finding specific user (like Jelly Test)
    console.log('\n🔍 Looking for user with firstName containing "Jelly"...');
    const jellyUser = await User.findOne({
      where: { 
        firstName: { [require('sequelize').Op.like]: '%Jelly%' },
        role: 'admin'
      },
      attributes: ['id', 'username', 'email', 'role', 'firstName', 'lastName', 'position', 'isActive']
    });

    if (jellyUser) {
      console.log(`✅ Found Jelly user: ${jellyUser.firstName} ${jellyUser.lastName} (ID: ${jellyUser.id}) | Active: ${jellyUser.isActive}`);
    } else {
      console.log('❌ No Jelly user found');
    }

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error testing admin lookup:', error);
  }
}

testAdminUserLookup();