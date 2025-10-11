/**
 * Test Doctor Checkup Isolation Validation
 * 
 * This script tests if the new validation prevents doctors from having
 * multiple concurrent checkups (in-progress or started status).
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Mock authentication token (replace with valid token in real test)
const AUTH_TOKEN = 'test-token';

const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
};

const testDoctorIsolation = async () => {
  console.log('🔬 Testing Doctor Checkup Isolation Validation');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Check current doctor checkups
    console.log('\n1️⃣ Checking current doctor checkups...');
    const checkupsResult = await apiCall('/api/checkups/doctor');
    
    if (checkupsResult.success) {
      const inProgressCheckups = checkupsResult.data.filter(c => 
        c.status === 'in-progress' || c.status === 'started'
      );
      console.log(`✅ Found ${checkupsResult.data.length} total checkups`);
      console.log(`   ${inProgressCheckups.length} in-progress checkups`);
      
      if (inProgressCheckups.length > 0) {
        console.log('⚠️  Doctor already has in-progress checkups:');
        inProgressCheckups.forEach(checkup => {
          console.log(`   - ${checkup.patientName} (Status: ${checkup.status})`);
        });
      }
    } else {
      console.log('❌ Failed to fetch current checkups');
      console.log(`   Error: ${checkupsResult.error}`);
    }

    // Step 2: Try to create a new checkup (should fail if doctor has in-progress checkups)
    console.log('\n2️⃣ Attempting to create a new checkup...');
    const newCheckupData = {
      patientId: 999,
      patientName: 'Test Patient',
      age: 25,
      gender: 'Female',
      contactNumber: '09123456789',
      serviceType: 'General Checkup',
      priority: 'Normal',
      notes: 'Test checkup for isolation validation'
    };

    const createResult = await apiCall('/api/checkups', 'POST', newCheckupData);
    
    if (createResult.success) {
      console.log('✅ Checkup created successfully');
      console.log(`   Checkup ID: ${createResult.data.id}`);
      console.log('   This means either:');
      console.log('   - Doctor had no in-progress checkups (validation working)');
      console.log('   - Or validation needs to be checked');
    } else {
      if (createResult.status === 400 && createResult.error.includes('already have a checkup in progress')) {
        console.log('✅ Validation working correctly!');
        console.log(`   Error: ${createResult.error}`);
        console.log('   Doctor isolation is preventing multiple concurrent checkups');
      } else {
        console.log('❌ Unexpected error');
        console.log(`   Error: ${createResult.error}`);
      }
    }

    // Step 3: Try another approach - simulate the queue start endpoint
    console.log('\n3️⃣ Testing queue start endpoint validation...');
    
    // First get today's checkups to find a session we can try to start
    const todayResult = await apiCall('/api/checkups/today');
    
    if (todayResult.success && todayResult.data.length > 0) {
      const availableSession = todayResult.data.find(session => 
        session.status === 'doctor-notified' || session.status === 'vitals-recorded'
      );
      
      if (availableSession) {
        console.log(`   Found available session: ${availableSession.patientName}`);
        
        const startResult = await apiCall(`/api/doctor/queue/${availableSession.id}/start`, 'POST', {
          doctorId: 'test-doctor-123'
        });
        
        if (startResult.success) {
          console.log('✅ Queue start successful');
          console.log('   This means doctor had no in-progress checkups');
        } else {
          if (startResult.status === 400 && startResult.error.includes('already have a checkup in progress')) {
            console.log('✅ Queue start validation working correctly!');
            console.log(`   Error: ${startResult.error}`);
          } else {
            console.log('⚠️  Other validation issue');
            console.log(`   Error: ${startResult.error}`);
          }
        }
      } else {
        console.log('   No available sessions to test queue start');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  console.log('\n🏁 Doctor isolation test completed');
};

// Run the test
testDoctorIsolation().catch(console.error);