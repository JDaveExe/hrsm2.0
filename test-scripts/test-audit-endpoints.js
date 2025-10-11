/**
 * Test audit API endpoints directly
 */

const axios = require('axios');

async function testEndpoints() {
  try {
    console.log('🧪 Testing Audit API Endpoints\n');

    // You'll need to replace this with a real token from your app
    const token = 'YOUR_TOKEN_HERE'; // Get this from localStorage in browser console

    // Test actions endpoint
    console.log('📡 GET /api/audit/actions');
    try {
      const actionsResponse = await axios.get('http://localhost:5000/api/audit/actions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Actions Response:', actionsResponse.data);
    } catch (err) {
      console.log('❌ Actions Error:', err.response?.data || err.message);
    }

    // Test target-types endpoint
    console.log('\n📡 GET /api/audit/target-types');
    try {
      const typesResponse = await axios.get('http://localhost:5000/api/audit/target-types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Target Types Response:', typesResponse.data);
    } catch (err) {
      console.log('❌ Target Types Error:', err.response?.data || err.message);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

console.log('⚠️  To test the API endpoints:');
console.log('1. Make sure backend server is running (node server.js)');
console.log('2. Login to the app and get your token from browser console:');
console.log('   localStorage.getItem("token")');
console.log('3. Replace YOUR_TOKEN_HERE in this file with your actual token');
console.log('4. Run this script again\n');

// Uncomment below to run the test
// testEndpoints();
