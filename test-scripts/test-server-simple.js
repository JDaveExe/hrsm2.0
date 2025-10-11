const axios = require('axios');

async function testServerAndAuth() {
  console.log('🧪 Testing Server Connection and Auth...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('1️⃣  Testing server connection...');
    
    // Test simple endpoint first
    const auditResponse = await axios.get(`${baseURL}/audit/logs?limit=3`, {
      headers: authHeaders
    });

    console.log('✅ Server is responding!');
    console.log(`📋 Found ${auditResponse.data.auditLogs.length} audit logs`);
    
    if (auditResponse.data.auditLogs.length > 0) {
      const latestLog = auditResponse.data.auditLogs[0];
      console.log('\n📝 Latest audit log:');
      console.log(`   Action: ${latestLog.action}`);
      console.log(`   User: ${latestLog.userName} (ID: ${latestLog.userId})`);
      console.log(`   Time: ${latestLog.timestamp}`);
      console.log(`   Description: ${latestLog.actionDescription}`);
    }

    return true;

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running on port 3001');
      return false;
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Run the test
testServerAndAuth().then(success => {
  if (success) {
    console.log('\n🎉 Server and auth are working!');
  } else {
    console.log('\n💥 Server connection failed.');
  }
}).catch(error => {
  console.error('💥 Test script failed:', error);
});