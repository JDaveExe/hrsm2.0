const axios = require('axios');

async function testDirectAuditLogging() {
  console.log('🧪 Testing Direct Audit Logging...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('1️⃣  Getting current audit count...');
    
    const initialResponse = await axios.get(`${baseURL}/audit/logs?limit=1`, {
      headers: authHeaders
    });
    
    const initialCount = initialResponse.data.data.totalCount;
    console.log(`📊 Current audit count: ${initialCount}`);

    console.log('\n2️⃣  Testing an operation that SHOULD create an audit log...');
    
    // Let's try creating a user since we know that creates audit logs
    const testUserData = {
      firstName: 'Audit',
      lastName: 'Test',
      email: `audittest${Date.now()}@example.com`,
      username: `audittest${Date.now()}`,
      password: 'temppass123',
      role: 'staff',
      position: 'Test Position',
      dateOfBirth: '1990-01-01',
      gender: 'Male'
    };

    console.log('👤 Creating test user to verify audit system...');
    
    const userResponse = await axios.post(`${baseURL}/auth/register`, testUserData, {
      headers: authHeaders
    });

    console.log('✅ User created:', userResponse.data.message || 'Success');

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n3️⃣  Checking for new audit logs...');
    
    const newResponse = await axios.get(`${baseURL}/audit/logs?limit=5`, {
      headers: authHeaders
    });
    
    const newCount = newResponse.data.data.totalCount;
    console.log(`📊 New audit count: ${newCount}`);
    console.log(`📈 Difference: +${newCount - initialCount}`);

    if (newCount > initialCount) {
      console.log('\n🎯 New audit logs found:');
      const newLogs = newResponse.data.data.auditLogs.slice(0, newCount - initialCount);
      newLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Action: ${log.action}`);
        console.log(`   Description: ${log.actionDescription}`);
        console.log(`   User: ${log.userName}`);
        console.log(`   Target: ${log.targetName || 'N/A'}`);
        console.log(`   Time: ${log.timestamp}`);
      });
      
      console.log('\n✅ Audit system is working for user creation!');
      console.log('🔍 This means the issue is specifically with patient check-in logging.');
      
    } else {
      console.log('\n⚠️  No new audit logs found. Audit system may have a broader issue.');
    }

    return newCount > initialCount;

  } catch (error) {
    console.error('❌ Error testing direct audit logging:', error.response?.data || error.message);
    return false;
  }
}

// Run the test
testDirectAuditLogging().then(success => {
  if (success) {
    console.log('\n🎉 Audit system is working for some operations!');
    console.log('🔧 Need to fix patient check-in specific audit logging.');
  } else {
    console.log('\n💥 Audit system has broader issues.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});