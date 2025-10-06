const { User } = require('./backend/models');

async function checkAdminUsers() {
  try {
    console.log('🔍 Checking admin users in database...');
    
    // Find all admin users
    const adminUsers = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'role', 'position']
    });

    console.log(`📊 Found ${adminUsers.length} admin users:`);
    adminUsers.forEach(user => {
      console.log(`   ID: ${user.id} | ${user.firstName} ${user.lastName} | ${user.username} | ${user.email}`);
    });

    // Check for specific user like "Jelly Test"
    const jellyUser = await User.findOne({
      where: { firstName: 'Jelly', lastName: 'Test' }
    });

    if (jellyUser) {
      console.log(`\n✅ Found Jelly Test user: ID ${jellyUser.id}`);
      console.log(`   Full details: ${JSON.stringify(jellyUser.toJSON(), null, 2)}`);
    } else {
      console.log(`\n❌ No "Jelly Test" user found`);
    }

    // Check current temp-admin-token behavior
    console.log('\n🔧 Current temp-admin-token should use the first admin user or ID 10029 if available');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
    process.exit(1);
  }
}

checkAdminUsers();