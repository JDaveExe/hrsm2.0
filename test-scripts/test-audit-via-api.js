// test-audit-via-api.js
// Test audit events by making real API calls to the backend server

const axios = require('axios');

// Try different ports that the backend might be running on
const POSSIBLE_PORTS = [3000, 3001, 5000, 8000];
let BASE_URL = '';

async function findBackendPort() {
  for (const port of POSSIBLE_PORTS) {
    try {
      const url = `http://localhost:${port}`;
      await axios.get(`${url}/api/health`, { timeout: 2000 });
      BASE_URL = `${url}/api`;
      console.log(`✅ Found backend server at port ${port}`);
      return true;
    } catch (error) {
      // Try next port
    }
  }
  
  // Try without /api
  for (const port of POSSIBLE_PORTS) {
    try {
      const url = `http://localhost:${port}`;
      await axios.get(url, { timeout: 2000 });
      BASE_URL = url;
      console.log(`✅ Found backend server at port ${port} (no /api prefix)`);
      return true;
    } catch (error) {
      // Try next port
    }
  }
  
  console.log('❌ Could not find backend server on any common port');
  return false;
}

async function testAuditViaAPI() {
  console.log('🔍 Testing Audit Trail via Real API Calls...\n');

  // Find backend server
  if (!(await findBackendPort())) {
    console.log('Please start the backend server first.');
    return;
  }

  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  // Test 1: Check if audit endpoint exists
  console.log('1. Testing audit endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/audit/logs`, { headers: authHeaders });
    const initialLogCount = response.data.logs.length;
    console.log(`✅ Audit endpoint works - found ${initialLogCount} existing logs`);
    
    // Show the types of existing logs
    const actionCounts = {};
    response.data.logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    
    console.log('   Current audit log types:');
    Object.entries(actionCounts).forEach(([action, count]) => {
      console.log(`   - ${action}: ${count} times`);
    });
    
  } catch (error) {
    console.log(`❌ Audit endpoint failed: ${error.response?.status} ${error.message}`);
    return;
  }

  console.log('\n2. Testing available API endpoints...');
  
  // Test different endpoints to see what exists
  const endpointsToTest = [
    { method: 'GET', path: '/patients', description: 'List patients' },
    { method: 'GET', path: '/users', description: 'List users' },
    { method: 'GET', path: '/checkups', description: 'List checkups' },
    { method: 'GET', path: '/vaccinations', description: 'List vaccinations' },
    { method: 'GET', path: '/medications', description: 'List medications' },
    { method: 'GET', path: '/admin/patients', description: 'Admin patients' },
    { method: 'GET', path: '/auth/users', description: 'Auth users' }
  ];

  const workingEndpoints = [];
  
  for (const endpoint of endpointsToTest) {
    try {
      const response = await axios({
        method: endpoint.method.toLowerCase(),
        url: `${BASE_URL}${endpoint.path}`,
        headers: authHeaders,
        timeout: 5000
      });
      console.log(`   ✅ ${endpoint.description}: ${response.status}`);
      workingEndpoints.push(endpoint);
    } catch (error) {
      const status = error.response?.status || 'TIMEOUT';
      console.log(`   ❌ ${endpoint.description}: ${status}`);
    }
  }

  console.log('\n3. Creating test data to trigger audit events...');
  
  // Try to create a test user (should trigger audit)
  console.log('   Testing user creation audit...');
  try {
    const userData = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'User',
      role: 'staff',
      accessLevel: 'staff'
    };
    
    const response = await axios.post(`${BASE_URL}/auth/register`, userData, { headers: authHeaders });
    console.log(`   ✅ User creation successful: ${response.status}`);
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    const message = error.response?.data?.message || error.message;
    console.log(`   ❌ User creation failed: ${status} - ${message}`);
  }

  // Try to trigger other audit events
  console.log('   Testing patient operations...');
  
  // Test patient check-in
  try {
    const response = await axios.post(`${BASE_URL}/patients/check-in`, {
      patientId: 1
    }, { headers: authHeaders });
    console.log(`   ✅ Patient check-in successful: ${response.status}`);
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    console.log(`   ❌ Patient check-in failed: ${status}`);
  }

  // Test vaccination
  try {
    const response = await axios.post(`${BASE_URL}/vaccinations/administer`, {
      patientId: 1,
      vaccineId: 1,
      batchNumber: 'TEST-BATCH-001'
    }, { headers: authHeaders });
    console.log(`   ✅ Vaccination successful: ${response.status}`);
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    console.log(`   ❌ Vaccination failed: ${status}`);
  }

  // Wait a moment for audit logs to be created
  console.log('\n4. Waiting for audit logs to be processed...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check for new audit logs
  console.log('\n5. Checking for new audit logs...');
  try {
    const response = await axios.get(`${BASE_URL}/audit/logs`, { headers: authHeaders });
    const finalLogCount = response.data.logs.length;
    
    console.log(`📊 Final log count: ${finalLogCount}`);
    
    // Show recent logs
    const recentLogs = response.data.logs.slice(0, 10); // Show last 10 logs
    console.log('\n   Recent audit logs:');
    recentLogs.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      console.log(`   ${index + 1}. [${timestamp}] ${log.userName} - ${log.action}`);
      console.log(`      Description: ${log.actionDescription}`);
      console.log('');
    });
    
  } catch (error) {
    console.log(`❌ Failed to fetch final audit logs: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 AUDIT API TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Working endpoints: ${workingEndpoints.length}/${endpointsToTest.length}`);
  console.log('🔧 Next steps:');
  console.log('- Check which routes are missing audit integration');
  console.log('- Add audit logging to routes that handle user actions');
  console.log('- Test each action from the frontend UI');
}

if (require.main === module) {
  testAuditViaAPI().catch(console.error);
}

module.exports = { testAuditViaAPI };