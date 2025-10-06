const axios = require('axios');

async function testUserNameResolution() {
  console.log('🧪 Testing user name resolution in audit logs...\n');

  try {
    // First, let's check the current auth resolution
    console.log('1. Testing auth token resolution...');
    
    const authTestResponse = await axios.get('http://localhost:3001/api/admin/audit-logs', {
      headers: {
        'Authorization': 'Bearer temp-admin-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Auth test successful');

    // Wait a moment then check the most recent audit log
    await new Promise(resolve => setTimeout(resolve, 1000));

    const auditResponse = await axios.get('http://localhost:3001/api/admin/audit-logs?limit=1', {
      headers: {
        'Authorization': 'Bearer temp-admin-token',
        'Content-Type': 'application/json'
      }
    });

    if (auditResponse.data.auditLogs && auditResponse.data.auditLogs.length > 0) {
      const latestLog = auditResponse.data.auditLogs[0];
      console.log('\n📋 Latest audit log entry:');
      console.log(`   User: ${latestLog.userName}`);
      console.log(`   User ID: ${latestLog.userId}`);
      console.log(`   Action: ${latestLog.action}`);
      console.log(`   IP Address: ${latestLog.ipAddress || 'N/A'}`);
      console.log(`   Timestamp: ${latestLog.timestamp}`);

      if (latestLog.userName.includes('Jelly Test')) {
        console.log('\n✅ SUCCESS: User name resolution is now working correctly!');
        console.log('   Showing "Jelly Test" instead of "System Administrator"');
      } else if (latestLog.userName === 'System Administrator') {
        console.log('\n❌ ISSUE: Still showing "System Administrator"');
        console.log('   The auth middleware fix may not be working');
      } else {
        console.log(`\n🔍 INFO: User name is "${latestLog.userName}"`);
      }
    } else {
      console.log('\n⚠️  No audit logs found');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running. Please start the backend server first.');
      console.log('   Run: cd backend && node server.js');
    } else {
      console.error('❌ Error testing user name resolution:', error.message);
    }
  }
}

testUserNameResolution();
