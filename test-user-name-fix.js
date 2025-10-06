// test-user-name-fix.js
// Simple test to verify the user name resolution is working

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const authHeaders = {
  'Authorization': 'Bearer temp-admin-token',
  'Content-Type': 'application/json'
};

async function testUserNameFix() {
  console.log('🔍 Testing User Name Resolution Fix...\n');

  // Trigger an audit event by viewing audit logs
  console.log('1. Triggering audit event (viewing audit logs)...');
  try {
    const response = await axios.get(`${BASE_URL}/audit/logs`, { headers: authHeaders });
    console.log('✅ Audit endpoint successful');
  } catch (error) {
    console.log('❌ Audit endpoint failed:', error.message);
    return;
  }

  // Check the latest audit log to see if user name is fixed
  console.log('\n2. Checking latest audit log for user name...');
  try {
    const response = await axios.get(`${BASE_URL}/audit/logs?limit=1`, { headers: authHeaders });
    const logs = response.data.data?.auditLogs || [];
    
    if (logs.length > 0) {
      const latestLog = logs[0];
      console.log('📊 Latest audit log:');
      console.log(`   User Name: "${latestLog.userName}"`);
      console.log(`   Action: ${latestLog.action}`);
      console.log(`   Timestamp: ${latestLog.timestamp}`);
      console.log(`   Description: ${latestLog.actionDescription}`);
      
      if (latestLog.userName === 'undefined undefined') {
        console.log('❌ User name is still showing "undefined undefined"');
      } else if (latestLog.userName && latestLog.userName !== 'Unknown User') {
        console.log('✅ User name resolution is working!');
      } else {
        console.log('⚠️  User name shows as:', latestLog.userName);
      }
    } else {
      console.log('❌ No audit logs found');
    }
  } catch (error) {
    console.log('❌ Failed to check audit logs:', error.message);
  }
}

if (require.main === module) {
  testUserNameFix().catch(console.error);
}

module.exports = { testUserNameFix };