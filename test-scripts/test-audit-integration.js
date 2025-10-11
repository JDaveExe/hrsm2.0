// test-audit-integration.js
// Script to test which audit trail events are properly integrated

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const TEST_TOKEN = 'temp-admin-token'; // Using the temporary admin token

// Test configuration
const testConfig = {
  headers: {
    'Authorization': `Bearer ${TEST_TOKEN}`,
    'Content-Type': 'application/json'
  }
};

async function testAuditIntegration() {
  console.log('🔍 Testing Audit Trail Integration...\n');

  const testResults = [];

  // Test 1: Check current audit logs (this should work)
  console.log('1. Testing audit log viewing (should work)...');
  try {
    const response = await axios.get(`${BASE_URL}/audit/logs`, testConfig);
    console.log('✅ Audit log viewing works - found', response.data.logs.length, 'logs');
    testResults.push({ test: 'Audit Log Viewing', status: 'PASS', logs: response.data.logs.length });
  } catch (error) {
    console.log('❌ Audit log viewing failed:', error.message);
    testResults.push({ test: 'Audit Log Viewing', status: 'FAIL', error: error.message });
  }

  // Test 2: Try to trigger patient check-in (simulate)
  console.log('\n2. Testing patient check-in audit...');
  try {
    // This will likely fail but we want to see if audit is triggered
    const response = await axios.post(`${BASE_URL}/patients/check-in`, {
      patientId: 1,
      queuePosition: 1
    }, testConfig);
    console.log('✅ Patient check-in succeeded');
    testResults.push({ test: 'Patient Check-in', status: 'PASS' });
  } catch (error) {
    console.log('❌ Patient check-in failed:', error.response?.status, error.response?.data?.message || error.message);
    testResults.push({ test: 'Patient Check-in', status: 'FAIL', error: error.message });
  }

  // Test 3: Try user creation audit
  console.log('\n3. Testing user creation audit...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/register`, {
      username: 'testuser' + Date.now(),
      email: 'test@example.com',
      password: 'testpass123',
      firstName: 'Test',
      lastName: 'User',
      role: 'staff'
    }, testConfig);
    console.log('✅ User creation succeeded');
    testResults.push({ test: 'User Creation', status: 'PASS' });
  } catch (error) {
    console.log('❌ User creation failed:', error.response?.status, error.response?.data?.message || error.message);
    testResults.push({ test: 'User Creation', status: 'FAIL', error: error.message });
  }

  // Test 4: Try checkup start audit
  console.log('\n4. Testing checkup start audit...');
  try {
    const response = await axios.post(`${BASE_URL}/checkups/start`, {
      patientId: 1,
      doctorId: 2
    }, testConfig);
    console.log('✅ Checkup start succeeded');
    testResults.push({ test: 'Checkup Start', status: 'PASS' });
  } catch (error) {
    console.log('❌ Checkup start failed:', error.response?.status, error.response?.data?.message || error.message);
    testResults.push({ test: 'Checkup Start', status: 'FAIL', error: error.message });
  }

  // Test 5: Try vaccination audit
  console.log('\n5. Testing vaccination audit...');
  try {
    const response = await axios.post(`${BASE_URL}/vaccinations/administer`, {
      patientId: 1,
      vaccineId: 1,
      batchNumber: 'TEST-001'
    }, testConfig);
    console.log('✅ Vaccination succeeded');
    testResults.push({ test: 'Vaccination', status: 'PASS' });
  } catch (error) {
    console.log('❌ Vaccination failed:', error.response?.status, error.response?.data?.message || error.message);
    testResults.push({ test: 'Vaccination', status: 'FAIL', error: error.message });
  }

  // Test 6: Check if new audit logs were created
  console.log('\n6. Checking for new audit logs after tests...');
  try {
    const response = await axios.get(`${BASE_URL}/audit/logs`, testConfig);
    const newLogCount = response.data.logs.length;
    const initialLogCount = testResults.find(r => r.test === 'Audit Log Viewing')?.logs || 0;
    
    console.log(`📊 Initial logs: ${initialLogCount}, Current logs: ${newLogCount}`);
    console.log(`📊 New logs generated: ${newLogCount - initialLogCount}`);
    
    if (newLogCount > initialLogCount) {
      console.log('✅ Some audit events were tracked!');
    } else {
      console.log('❌ No new audit events were generated during tests');
    }
    
    testResults.push({ 
      test: 'New Audit Generation', 
      status: newLogCount > initialLogCount ? 'PASS' : 'FAIL',
      initialLogs: initialLogCount,
      finalLogs: newLogCount,
      newLogs: newLogCount - initialLogCount
    });
    
  } catch (error) {
    console.log('❌ Failed to check final audit logs:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 AUDIT INTEGRATION TEST SUMMARY');
  console.log('='.repeat(50));
  
  testResults.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.test}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.newLogs !== undefined) {
      console.log(`   New audit logs: ${result.newLogs}`);
    }
  });

  const passCount = testResults.filter(r => r.status === 'PASS').length;
  const totalTests = testResults.length;
  
  console.log(`\n🎯 Results: ${passCount}/${totalTests} tests passed`);
  
  if (passCount < totalTests) {
    console.log('\n🔧 ISSUES FOUND:');
    console.log('- Most likely, the backend routes are not calling audit logging functions');
    console.log('- Need to integrate auditLogger calls into route handlers');
    console.log('- Some API endpoints may not exist or have different paths');
  }
}

// Run the test
if (require.main === module) {
  testAuditIntegration().catch(console.error);
}

module.exports = { testAuditIntegration };