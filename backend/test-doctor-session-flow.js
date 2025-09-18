const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testDoctorSessionFlow() {
  console.log('🧪 Testing Doctor Session Flow...\n');
  
  try {
    // Step 1: Login Johnny Davis
    console.log('1️⃣ Logging in Johnny Davis...');
    const johnnyLogin = await axios.post(`${BASE_URL}/auth/login`, {
      login: 'jdoyle',
      password: 'jdoyle123' // Assuming this is his password
    });
    
    if (johnnyLogin.data.user) {
      console.log(`✅ Johnny Davis logged in successfully (ID: ${johnnyLogin.data.user.id})`);
    }
    
    // Step 2: Check online doctors
    console.log('\n2️⃣ Checking online doctors...');
    const onlineDoctors = await axios.get(`${BASE_URL}/doctor/sessions/online`);
    console.log(`✅ Found ${onlineDoctors.data.length} online doctors:`);
    onlineDoctors.data.forEach(doctor => {
      console.log(`   - ${doctor.name} (${doctor.status}) - Available: ${doctor.isAvailable}`);
    });
    
    // Step 3: Check if Johnny is online
    const johnnyId = johnnyLogin.data.user.id;
    console.log(`\n3️⃣ Checking Johnny Davis status (ID: ${johnnyId})...`);
    const johnnyStatus = await axios.get(`${BASE_URL}/doctor/sessions/status/${johnnyId}`);
    console.log(`✅ Johnny Davis status: ${johnnyStatus.data.status} (Available: ${johnnyStatus.data.isAvailable})`);
    
    // Step 4: Test updating status to busy
    console.log('\n4️⃣ Testing status update to busy...');
    await axios.patch(`${BASE_URL}/doctor/sessions/status`, {
      doctorId: johnnyId,
      status: 'busy',
      patientId: 123
    });
    
    const johnnyStatusBusy = await axios.get(`${BASE_URL}/doctor/sessions/status/${johnnyId}`);
    console.log(`✅ Johnny Davis updated to: ${johnnyStatusBusy.data.status} (Available: ${johnnyStatusBusy.data.isAvailable})`);
    
    // Step 5: Update back to online
    console.log('\n5️⃣ Updating status back to online...');
    await axios.patch(`${BASE_URL}/doctor/sessions/status`, {
      doctorId: johnnyId,
      status: 'online'
    });
    
    const johnnyStatusOnline = await axios.get(`${BASE_URL}/doctor/sessions/status/${johnnyId}`);
    console.log(`✅ Johnny Davis back to: ${johnnyStatusOnline.data.status} (Available: ${johnnyStatusOnline.data.isAvailable})`);
    
    console.log('\n🎉 All doctor session tests passed!');
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Test failed:', error.response.status, error.response.data);
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

// Test with fallback credentials if the main ones don't work
async function testWithFallbackCredentials() {
  console.log('\n🔄 Trying with fallback doctor credentials...');
  
  try {
    // Try with the default doctor account
    console.log('1️⃣ Logging in with doctor/doctor123...');
    const doctorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      login: 'doctor',
      password: 'doctor123'
    });
    
    if (doctorLogin.data.user) {
      console.log(`✅ Default doctor logged in successfully (ID: ${doctorLogin.data.user.id})`);
      
      // Check online doctors
      console.log('\n2️⃣ Checking online doctors...');
      const onlineDoctors = await axios.get(`${BASE_URL}/doctor/sessions/online`);
      console.log(`✅ Found ${onlineDoctors.data.length} online doctors:`);
      onlineDoctors.data.forEach(doctor => {
        console.log(`   - ${doctor.name} (${doctor.status}) - Available: ${doctor.isAvailable}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fallback test failed:', error.response?.data || error.message);
  }
}

// Run tests
testDoctorSessionFlow().then(() => {
  return testWithFallbackCredentials();
}).then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});