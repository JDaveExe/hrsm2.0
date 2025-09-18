const axios = require('axios');

async function testJosukeLogin() {
  console.log('🔐 Testing Josuke login scenarios...\n');

  const baseURL = 'http://localhost:5000';
  
  // Test 1: Check database users for Josuke
  try {
    console.log('📋 Step 1: Testing admin login to check database...');
    const adminLogin = await axios.post(`${baseURL}/api/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Admin login successful');
    const adminToken = adminLogin.data.token;
    
    // Get all users to see if Josuke exists in database
    try {
      const usersResponse = await axios.get(`${baseURL}/api/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('\n📋 Database users:');
      const josukeUsers = usersResponse.data.filter(user => 
        user.firstName?.toLowerCase().includes('josuke') || 
        user.lastName?.toLowerCase().includes('joestar')
      );
      
      if (josukeUsers.length > 0) {
        console.log('✅ Found Josuke users in database:');
        josukeUsers.forEach(user => {
          console.log(`   - User ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
        });
      } else {
        console.log('❌ No Josuke users found in database');
      }
      
    } catch (error) {
      console.log('❌ Could not fetch users:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ Admin login failed:', error.response?.data || error.message);
  }

  // Test 2: Try default patient credentials
  console.log('\n📋 Step 2: Testing default patient credentials...');
  try {
    const patientLogin = await axios.post(`${baseURL}/api/auth/login`, {
      login: 'patient',
      password: 'patient123'
    });
    
    console.log('✅ Default patient login successful:');
    console.log('   User ID:', patientLogin.data.user.id);
    console.log('   Patient ID:', patientLogin.data.user.patientId);
    console.log('   Name:', patientLogin.data.user.firstName, patientLogin.data.user.lastName);
    
  } catch (error) {
    console.log('❌ Default patient login failed:', error.response?.data || error.message);
  }

  // Test 3: Try common Josuke variations
  console.log('\n📋 Step 3: Testing Josuke variations...');
  const josukeVariations = [
    { login: 'josuke', password: 'josuke123' },
    { login: 'josuke.joestar', password: 'josuke123' },
    { login: 'josuke@test.com', password: 'josuke123' },
    { login: 'josuke', password: 'password' },
    { login: 'josuke', password: '123456' }
  ];
  
  for (const creds of josukeVariations) {
    try {
      const response = await axios.post(`${baseURL}/api/auth/login`, creds);
      console.log(`✅ Login successful with ${creds.login}/${creds.password}:`);
      console.log('   User ID:', response.data.user.id);
      console.log('   Patient ID:', response.data.user.patientId);
      console.log('   Name:', response.data.user.firstName, response.data.user.lastName);
      break; // Stop if we find working credentials
    } catch (error) {
      console.log(`❌ Login failed for ${creds.login}/${creds.password}`);
    }
  }
}

testJosukeLogin().catch(console.error);
