// Test the debug endpoint
const axios = require('axios');

const testDebug = async () => {
  try {
    console.log('🔍 Testing debug endpoint...');
    
    // First get a session ID
    const checkups = await axios.get('http://localhost:5000/api/checkups/today', {
      headers: { 'Authorization': 'Bearer temp-admin-token' }
    });
    
    if (checkups.data.length === 0) {
      console.log('No checkups found');
      return;
    }
    
    const sessionId = checkups.data[0].id;
    console.log(`Testing with session ID: ${sessionId}`);
    
    // Test the debug endpoint
    const debugResult = await axios.post(`http://localhost:5000/api/checkups/debug/test-session/${sessionId}`, {}, {
      headers: { 'Authorization': 'Bearer temp-admin-token' }
    });
    
    console.log('✅ Debug test passed!');
    console.log('Result:', debugResult.data);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
};

testDebug();
