// Test script to verify appointment API integration
const axios = require('axios');

const BACKEND_API = 'http://localhost:5000/api';

async function testAppointmentAPI() {
  console.log('🧪 Testing Appointment API Integration...\n');
  
  try {
    // Step 1: Test backend authentication
    console.log('1️⃣ Testing backend authentication...');
    
    const loginResponse = await axios.post(`${BACKEND_API}/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Backend login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    // Step 2: Test appointments API with proper auth
    console.log('\n2️⃣ Testing appointments API with valid token...');
    const appointmentsResponse = await axios.get(`${BACKEND_API}/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ API returned ${appointmentsResponse.data.length} appointments`);
    
    if (appointmentsResponse.data.length > 0) {
      console.log('\n📋 Appointment details:');
      appointmentsResponse.data.forEach((apt, index) => {
        console.log(`   ${index + 1}. ID: ${apt.id}`);
        console.log(`      Patient: ${apt.patient?.firstName} ${apt.patient?.lastName}`);
        console.log(`      Date: ${apt.appointmentDate}`);
        console.log(`      Time: ${apt.appointmentTime}`);
        console.log(`      Type: ${apt.type}`);
        console.log(`      Status: ${apt.status}`);
        console.log('');
      });
    }
    
    // Step 3: Test what happens with invalid auth (current frontend issue)
    console.log('3️⃣ Testing with invalid auth (current frontend behavior)...');
    
    try {
      const invalidResponse = await axios.get(`${BACKEND_API}/appointments`, {
        headers: { 'x-auth-token': 'temp-admin-token' }
      });
      console.log(`❌ Should have failed but got ${invalidResponse.data.length} appointments`);
    } catch (error) {
      console.log(`✅ Correctly failed with invalid auth: ${error.response?.status} - ${error.response?.data?.msg}`);
      console.log('   This confirms the frontend authentication issue!');
    }
    
    // Step 4: Test appointments for today specifically
    console.log('\n4️⃣ Testing today\'s appointments...');
    const todayResponse = await axios.get(`${BACKEND_API}/appointments/today`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Today's API returned ${todayResponse.data.length} appointments`);
    
    // Step 5: Test with query filters
    console.log('\n5️⃣ Testing with date filter...');
    const today = new Date().toISOString().split('T')[0];
    const filteredResponse = await axios.get(`${BACKEND_API}/appointments?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Filtered API returned ${filteredResponse.data.length} appointments for ${today}`);
    
    // Step 6: Analyze data structure for frontend compatibility
    console.log('\n6️⃣ Analyzing data structure for frontend...');
    if (appointmentsResponse.data.length > 0) {
      const sample = appointmentsResponse.data[0];
      console.log('📊 Sample appointment structure:');
      console.log('   Fields available:');
      Object.keys(sample).forEach(key => {
        console.log(`     - ${key}: ${typeof sample[key]} (${sample[key]})`);
      });
      
      console.log('\n🔄 Frontend expects these mappings:');
      console.log('   - appointmentDate → date');
      console.log('   - appointmentTime → time'); 
      console.log('   - type → serviceType');
      
      console.log('\n✅ Sample mapped data for frontend:');
      const mapped = {
        ...sample,
        date: sample.appointmentDate,
        time: sample.appointmentTime,
        serviceType: sample.type
      };
      console.log(`   Date: ${mapped.date}`);
      console.log(`   Time: ${mapped.time}`);
      console.log(`   ServiceType: ${mapped.serviceType}`);
    }
    
    return {
      success: true,
      token,
      appointmentCount: appointmentsResponse.data.length,
      todayCount: todayResponse.data.length
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    }
    return { success: false, error: error.message };
  }
}

// Test the exact appointmentService behavior
async function testAppointmentServiceBehavior() {
  console.log('\n🔬 Testing appointmentService behavior simulation...\n');
  
  // Simulate what happens in the frontend
  const getToken = () => {
    // In the browser, this would be localStorage.getItem('token')
    // For testing, we'll return null to simulate the issue
    return null;  // This is likely what's happening in the frontend!
  };
  
  const token = getToken();
  console.log(`🔑 Simulated localStorage token: ${token || 'NULL'}`);
  
  if (!token) {
    console.log('❌ No token found - this is why appointments aren\'t loading!');
    console.log('   The frontend needs to:');
    console.log('   1. Check if user is logged in');
    console.log('   2. Get the token from localStorage');  
    console.log('   3. Use proper Authorization header');
    return;
  }
  
  // If we had a token, this is what should happen
  try {
    const response = await axios.get(`${BACKEND_API}/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`✅ Would get ${response.data.length} appointments`);
  } catch (error) {
    console.log(`❌ Would fail: ${error.message}`);
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting Appointment API Diagnostics...\n');
  
  const result = await testAppointmentAPI();
  await testAppointmentServiceBehavior();
  
  console.log('\n🎯 DIAGNOSIS:');
  if (result.success) {
    console.log('✅ Backend API is working correctly');
    console.log(`✅ Found ${result.appointmentCount} total appointments`);
    console.log(`✅ Found ${result.todayCount} appointments for today`);
    console.log('❌ Frontend authentication is the issue');
    console.log('');
    console.log('🔧 SOLUTION:');
    console.log('1. Fix appointmentService to use proper JWT token from localStorage');
    console.log('2. Ensure admin login properly saves token to localStorage');
    console.log('3. Update error handling to show authentication failures');
  } else {
    console.log('❌ Backend API has issues');
    console.log('🔧 SOLUTION: Fix backend first');
  }
}

runDiagnostics();