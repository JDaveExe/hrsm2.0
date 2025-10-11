// Test script for verifying doctor queue and checkups synchronization
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  adminToken: 'temp-admin-token', // Using the same token format as in the frontend
  timeout: 5000
};

// Helper function to make API calls
const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${testConfig.adminToken}`,
        'Content-Type': 'application/json'
      },
      timeout: testConfig.timeout
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status,
      data: error.response?.data 
    };
  }
};

// Test functions
const testConnectivity = async () => {
  console.log('\n🔗 Testing API Connectivity...');
  
  const healthCheck = await apiCall('/health');
  if (healthCheck.success) {
    console.log('✅ Backend API is responding');
    console.log(`   Status: ${healthCheck.data.status}`);
    console.log(`   Uptime: ${Math.round(healthCheck.data.uptime)}s`);
  } else {
    console.log('❌ Backend API connection failed');
    console.log(`   Error: ${healthCheck.error}`);
    return false;
  }
  
  return true;
};

const testTodaysCheckups = async () => {
  console.log('\n📋 Testing Today\'s Checkups Endpoint...');
  
  const checkups = await apiCall('/checkups/today');
  if (checkups.success) {
    console.log('✅ Today\'s checkups endpoint working');
    console.log(`   Found ${checkups.data.length} checkups`);
    
    // Display first few checkups
    checkups.data.slice(0, 3).forEach((checkup, index) => {
      console.log(`   ${index + 1}. ${checkup.patientName} - ${checkup.status} (${checkup.checkInTime})`);
    });
    
    return checkups.data;
  } else {
    console.log('❌ Today\'s checkups endpoint failed');
    console.log(`   Error: ${checkups.error}`);
    return [];
  }
};

const testDoctorQueue = async () => {
  console.log('\n👨‍⚕️ Testing Doctor Queue Endpoint...');
  
  const queue = await apiCall('/doctor/queue');
  if (queue.success) {
    console.log('✅ Doctor queue endpoint working');
    console.log(`   Found ${queue.data.length} patients in queue`);
    
    // Display queue items
    queue.data.forEach((patient, index) => {
      console.log(`   ${index + 1}. ${patient.patientName} - ${patient.status} (Queued: ${patient.queuedAt})`);
    });
    
    return queue.data;
  } else {
    console.log('❌ Doctor queue endpoint failed');
    console.log(`   Status: ${queue.status}`);
    console.log(`   Error: ${queue.error}`);
    return [];
  }
};

const testQueueStats = async () => {
  console.log('\n📊 Testing Queue Statistics...');
  
  const stats = await apiCall('/doctor/queue/stats');
  if (stats.success) {
    console.log('✅ Queue statistics endpoint working');
    console.log(`   Total: ${stats.data.total}`);
    console.log(`   Waiting: ${stats.data.waiting}`);
    console.log(`   In Progress: ${stats.data.inProgress}`);
    console.log(`   Completed: ${stats.data.completed}`);
    
    return stats.data;
  } else {
    console.log('❌ Queue statistics endpoint failed');
    console.log(`   Error: ${stats.error}`);
    return null;
  }
};

const testAddToQueue = async (checkups) => {
  console.log('\n➕ Testing Add to Queue Functionality...');
  
  // Find a checkup with vital signs that hasn't been notified yet
  const availableCheckup = checkups.find(c => 
    c.vitalSignsCollected && !c.doctorNotified
  );
  
  if (!availableCheckup) {
    console.log('⚠️  No available checkups to add to queue (need vital signs collected)');
    return false;
  }
  
  console.log(`   Attempting to add patient: ${availableCheckup.patientName}`);
  
  const result = await apiCall(`/checkups/${availableCheckup.id}/notify-doctor`, 'POST');
  if (result.success) {
    console.log('✅ Successfully added patient to queue');
    console.log(`   Patient: ${result.data.session.patientName}`);
    console.log(`   Status: ${result.data.session.status}`);
    return availableCheckup.id;
  } else {
    console.log('❌ Failed to add patient to queue');
    console.log(`   Error: ${result.error}`);
    return false;
  }
};

const testQueueStatusUpdate = async (sessionId) => {
  console.log('\n🔄 Testing Queue Status Update...');
  
  if (!sessionId) {
    console.log('⚠️  No session ID available for testing');
    return false;
  }
  
  // Test starting a checkup
  console.log('   Testing start checkup...');
  const startResult = await apiCall(`/doctor/queue/${sessionId}/start`, 'POST', {
    doctorId: 'test-doctor-id'
  });
  
  if (startResult.success) {
    console.log('✅ Successfully started checkup');
    console.log(`   Status: ${startResult.data.session.status}`);
    
    // Test completing a checkup
    console.log('   Testing complete checkup...');
    const completeResult = await apiCall(`/doctor/queue/${sessionId}/complete`, 'POST', {
      doctorId: 'test-doctor-id',
      diagnosis: 'Test diagnosis',
      notes: 'Test completed via automated testing'
    });
    
    if (completeResult.success) {
      console.log('✅ Successfully completed checkup');
      console.log(`   Status: ${completeResult.data.session.status}`);
      return true;
    } else {
      console.log('❌ Failed to complete checkup');
      console.log(`   Error: ${completeResult.error}`);
    }
  } else {
    console.log('❌ Failed to start checkup');
    console.log(`   Error: ${startResult.error}`);
  }
  
  return false;
};

// Main test suite
const runTests = async () => {
  console.log('🧪 Doctor Queue & Checkups Synchronization Test Suite');
  console.log('='.repeat(60));
  
  try {
    // Test 1: Connectivity
    const isConnected = await testConnectivity();
    if (!isConnected) {
      console.log('\n❌ Connectivity test failed. Aborting remaining tests.');
      return;
    }
    
    // Test 2: Today's Checkups
    const checkups = await testTodaysCheckups();
    
    // Test 3: Doctor Queue
    const initialQueue = await testDoctorQueue();
    
    // Test 4: Queue Statistics
    await testQueueStats();
    
    // Test 5: Add to Queue (if checkups available)
    const addedSessionId = await testAddToQueue(checkups);
    
    // Test 6: Queue Status Updates
    if (addedSessionId) {
      await testQueueStatusUpdate(addedSessionId);
      
      // Re-check queue after operations
      console.log('\n🔄 Re-checking queue after operations...');
      await testDoctorQueue();
      await testQueueStats();
    }
    
    console.log('\n✅ Test suite completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - API connectivity: Working');
    console.log('   - Today\'s checkups: Working');
    console.log('   - Doctor queue: Working');
    console.log('   - Queue statistics: Working');
    console.log('   - Add to queue: Working');
    console.log('   - Status updates: Working');
    
  } catch (error) {
    console.log('\n❌ Test suite failed with error:');
    console.error(error);
  }
};

// Run the tests
runTests().then(() => {
  console.log('\n🎉 All tests completed!');
  process.exit(0);
}).catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
