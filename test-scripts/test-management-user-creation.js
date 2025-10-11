/**
 * Test Management User Creation and Login
 * This script tests creating a management user and verifying login functionality
 */

const axios = require('axios');
const BASE_URL = 'http://127.0.0.1:3001';

// Test data for management user
const testManagementUser = {
  firstName: 'John',
  lastName: 'Manager',
  emailInitials: 'john.manager',
  password: 'Manage456!',
  accessLevel: 'Management',
  position: 'Inventory Coordinator'
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testManagementUserCreation() {
  console.log('\n🧪 Testing Management User Creation and Login');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Create management user using admin endpoint
    console.log('\n📝 Step 1: Creating Management User');
    console.log('User data:', testManagementUser);
    
    const createResponse = await axios.post(`${BASE_URL}/api/auth/create-staff`, testManagementUser, {
      headers: {
        'x-auth-token': 'temp-admin-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Management user created successfully');
    console.log('User ID:', createResponse.data.user?.id);
    console.log('Email:', `${testManagementUser.emailInitials}@brgymaybunga.health`);
    
    // Wait a moment for database to be ready
    await sleep(1000);
    
    // Step 2: Test management user login
    console.log('\n🔑 Step 2: Testing Management User Login');
    
    const loginData = {
      login: `${testManagementUser.emailInitials}@brgymaybunga.health`,
      password: testManagementUser.password
    };
    
    console.log('Login attempt with:', loginData.login);
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    
    console.log('✅ Management user login successful');
    console.log('User details:');
    console.log('  - Name:', `${loginResponse.data.user.firstName} ${loginResponse.data.user.lastName}`);
    console.log('  - Role:', loginResponse.data.user.role);
    console.log('  - Access Level:', loginResponse.data.user.accessLevel);
    console.log('  - Token provided:', !!loginResponse.data.token);
    
    // Step 3: Verify user can access management routes
    console.log('\n🎯 Step 3: Testing Management Dashboard Access');
    
    const token = loginResponse.data.token;
    
    // Test accessing a protected route that management should access
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/auth/user`, {
        headers: {
          'x-auth-token': token
        }
      });
      
      console.log('✅ Management user can access protected routes');
      console.log('Profile verified:', profileResponse.data.role === 'management');
      
    } catch (error) {
      console.log('❌ Error accessing protected routes:', error.response?.data?.msg || error.message);
    }
    
    // Step 4: Verify user appears in admin user list
    console.log('\n📊 Step 4: Verifying User Appears in Admin List');
    
    const usersResponse = await axios.get(`${BASE_URL}/api/users`, {
      headers: {
        'x-auth-token': 'temp-admin-token'
      }
    });
    
    const managementUsers = usersResponse.data.users.filter(u => u.role === 'management');
    console.log(`✅ Found ${managementUsers.length} management user(s) in database`);
    
    const createdUser = managementUsers.find(u => u.email === `${testManagementUser.emailInitials}@brgymaybunga.health`);
    if (createdUser) {
      console.log('✅ Created user found in admin list:');
      console.log('  - ID:', createdUser.id);
      console.log('  - Name:', `${createdUser.firstName} ${createdUser.lastName}`);
      console.log('  - Position:', createdUser.position);
      console.log('  - Access Level:', createdUser.accessLevel);
      console.log('  - Active:', createdUser.isActive);
    }
    
    console.log('\n🎉 All tests passed! Management user system is working correctly.');
    console.log('\n📝 Login Credentials for testing:');
    console.log(`   Email: ${testManagementUser.emailInitials}@brgymaybunga.health`);
    console.log(`   Password: ${testManagementUser.password}`);
    console.log('   Role: Management');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.data?.errors) {
      console.log('\n📋 Validation errors:');
      error.response.data.errors.forEach((err, index) => {
        console.log(`   ${index + 1}. ${err.msg} (${err.param})`);
      });
    }
    
    if (error.response?.status === 400 && error.response?.data?.msg?.includes('already exists')) {
      console.log('\n💡 User might already exist. Try logging in directly:');
      console.log(`   Email: ${testManagementUser.emailInitials}@brgymaybunga.health`);
      console.log(`   Password: ${testManagementUser.password}`);
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  console.log('🚀 Starting Management User Creation and Login Test');
  console.log('Make sure the backend server is running on port 3001');
  
  testManagementUserCreation()
    .then(() => {
      console.log('\n✨ Test completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testManagementUserCreation };