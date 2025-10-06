const axios = require('axios');

async function testWithDebugOutput() {
  console.log('🧪 Testing Patient Check-in with Debug Output...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    // Use the other Mike Cruz (ID: 136) since 115 is already checked in
    console.log('1️⃣  Attempting check-in for Mike Cruz (ID: 136)...');
    
    const qrCheckInData = {
      patientId: 136,
      patientName: "Mike Cruz",
      serviceType: "General Checkup",
      priority: "Normal",
      checkInMethod: "Debug Test"
    };

    console.log('📋 Check-in data:', JSON.stringify(qrCheckInData, null, 2));
    console.log('\n🔍 Watch for debug output in server console...\n');

    const checkInResponse = await axios.post(`${baseURL}/checkups/qr-checkin`, qrCheckInData, {
      headers: authHeaders
    });

    console.log('✅ Check-in response:', checkInResponse.data);
    
    console.log('\n⏳ Waiting for audit log to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n2️⃣  Checking for audit logs...');
    const auditResponse = await axios.get(`${baseURL}/audit/logs?limit=10`, {
      headers: authHeaders
    });

    const logs = auditResponse.data.data.auditLogs;
    const recentLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      return logTime > oneMinuteAgo;
    });

    console.log(`📋 Recent logs (last minute): ${recentLogs.length}`);
    
    if (recentLogs.length > 0) {
      recentLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Action: ${log.action}`);
        console.log(`   Description: ${log.actionDescription}`);
        console.log(`   User: ${log.userName}`);
        console.log(`   Target: ${log.targetName || 'N/A'}`);
      });
    } else {
      console.log('   No recent logs found');
    }

    return true;

  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Patient already checked in. Expected for testing.');
      return false;
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Run the test
testWithDebugOutput().then(success => {
  console.log(`\n📝 Debug test completed. Success: ${success}`);
  console.log('\n💡 Check the server console for debug messages:');
  console.log('   - "🔍 About to call AuditLogger.logPatientCheckIn..."');
  console.log('   - "🔍 AuditLogger.logPatientCheckIn called with:"');
  console.log('   - "✅ Audit log created: patient_check_in by [User]"');
}).catch(error => {
  console.error('💥 Debug test failed:', error);
});