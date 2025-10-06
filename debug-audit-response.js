const axios = require('axios');

async function debugAuditResponse() {
  console.log('🧪 Debugging Audit Response...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('🔍 Testing audit endpoint...');
    
    const auditResponse = await axios.get(`${baseURL}/audit/logs?limit=3`, {
      headers: authHeaders
    });

    console.log('✅ Server responded!');
    console.log('📊 Response status:', auditResponse.status);
    console.log('📋 Response data structure:');
    console.log(JSON.stringify(auditResponse.data, null, 2));

    return true;

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running on port 5000');
      return false;
    } else {
      console.error('❌ Error details:');
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      console.error('   Message:', error.message);
      return false;
    }
  }
}

// Run the test
debugAuditResponse().then(success => {
  if (success) {
    console.log('\n🎉 Debug completed successfully!');
  } else {
    console.log('\n💥 Debug failed.');
  }
}).catch(error => {
  console.error('💥 Test script failed:', error);
});