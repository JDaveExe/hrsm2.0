// simple-audit-test.js
// Simple script to test audit functionality step by step

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const authHeaders = {
  'Authorization': 'Bearer temp-admin-token',
  'Content-Type': 'application/json'
};

async function simpleAuditTest() {
  console.log('🔍 Simple Audit Test...\n');

  // Test 1: Check audit endpoint structure
  console.log('1. Testing audit endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/audit/logs`, { headers: authHeaders });
    console.log('✅ Audit endpoint response:', {
      status: response.status,
      dataKeys: Object.keys(response.data),
      hasData: !!response.data.data,
      dataKeys2: response.data.data ? Object.keys(response.data.data) : 'N/A',
      auditLogsLength: response.data.data?.auditLogs?.length || 0
    });
    
    if (response.data.data?.auditLogs && response.data.data.auditLogs.length > 0) {
      console.log('   Sample log entry:', response.data.data.auditLogs[0]);
    }
  } catch (error) {
    console.log('❌ Audit endpoint error:', error.response?.data || error.message);
  }

  // Test 2: Try to trigger a simple audit event
  console.log('\n2. Triggering audit event by viewing audit logs again...');
  try {
    const response = await axios.get(`${BASE_URL}/audit/logs`, { headers: authHeaders });
    console.log('✅ Second audit request successful');
  } catch (error) {
    console.log('❌ Second audit request failed:', error.message);
  }

  // Test 3: Check if new audit log was created
  console.log('\n3. Checking for new audit logs...');
  try {
    const response = await axios.get(`${BASE_URL}/audit/logs`, { headers: authHeaders });
    const logs = response.data.data?.auditLogs || [];
    console.log(`📊 Total logs found: ${logs.length}`);
    
    if (logs.length > 0) {
      // Show recent logs
      console.log('\n   Recent audit logs:');
      logs.slice(0, 5).forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} by ${log.userName} at ${log.timestamp}`);
        console.log(`      ${log.actionDescription}`);
      });
    }
  } catch (error) {
    console.log('❌ Failed to check audit logs:', error.message);
  }

  // Test 4: Check what endpoints are available
  console.log('\n4. Testing basic endpoints...');
  const endpoints = [
    '/patients',
    '/users', 
    '/auth/users',
    '/admin/patients',
    '/checkups'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`, { headers: authHeaders });
      console.log(`   ✅ ${endpoint}: ${response.status} (${response.data?.length || 'N/A'} items)`);
    } catch (error) {
      const status = error.response?.status || 'ERROR';
      console.log(`   ❌ ${endpoint}: ${status}`);
    }
  }

  // Test 5: Try creating a user to test audit
  console.log('\n5. Testing user creation (should trigger audit)...');
  try {
    const userData = {
      username: `audit_test_${Date.now()}`,
      email: `audit_test_${Date.now()}@test.com`,
      password: 'testpass123',
      firstName: 'Audit',
      lastName: 'Test',
      role: 'staff'
    };
    
    const response = await axios.post(`${BASE_URL}/auth/register`, userData, { headers: authHeaders });
    console.log('✅ User creation response:', response.status, response.data?.message || 'Success');
    
    // Check for new audit log immediately
    setTimeout(async () => {
      try {
        const auditResponse = await axios.get(`${BASE_URL}/audit/logs`, { headers: authHeaders });
        const logs = auditResponse.data.data?.auditLogs || [];
        const userCreationLogs = logs.filter(log => log.action === 'added_new_user');
        console.log(`   📊 User creation audit logs found: ${userCreationLogs.length}`);
        
        if (userCreationLogs.length > 0) {
          console.log('   ✅ Latest user creation log:', userCreationLogs[0].actionDescription);
        }
      } catch (error) {
        console.log('   ❌ Failed to check audit after user creation');
      }
    }, 1000);
    
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    const message = error.response?.data?.message || error.message;
    console.log(`❌ User creation failed: ${status} - ${message}`);
  }
}

if (require.main === module) {
  simpleAuditTest().catch(console.error);
}