// Simple test for basic database operations
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testBasic = async () => {
  try {
    console.log('🧪 Testing basic database operations...');
    
    // Test 1: Simple health check
    console.log('1. Health check...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', health.data.status);
    
    // Test 2: Get checkups without any modifications
    console.log('\n2. Get today\'s checkups...');
    const checkups = await axios.get(`${BASE_URL}/checkups/today`, {
      headers: { 'Authorization': 'Bearer temp-admin-token' }
    });
    console.log(`✅ Found ${checkups.data.length} checkups`);
    
    if (checkups.data.length > 0) {
      console.log('First checkup:', checkups.data[0].patientName, 'Status:', checkups.data[0].status);
      
      // Test 3: Try a simple update without includes
      console.log('\n3. Testing simple database update...');
      const sessionId = checkups.data[0].id;
      
      try {
        // Just try to update the session directly using raw query
        const updateResult = await axios.post(`${BASE_URL}/debug/update-session`, {
          sessionId: sessionId,
          field: 'doctorNotified',
          value: true
        }, {
          headers: { 'Authorization': 'Bearer temp-admin-token' }
        });
        
        console.log('✅ Direct update worked');
      } catch (updateError) {
        console.log('❌ Direct update failed:', updateError.response?.status, updateError.response?.data?.error);
        
        // Let's try a different approach - create a test endpoint
        console.log('\n4. Testing notify-doctor with debug info...');
        const debugResult = await axios.post(`${BASE_URL}/checkups/${sessionId}/notify-doctor`, {
          debug: true
        }, {
          headers: { 'Authorization': 'Bearer temp-admin-token' }
        });
        
        console.log('Debug result:', debugResult.data);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

testBasic();
