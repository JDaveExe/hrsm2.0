const axios = require('axios');

// Test 1: Admin Patient Check-in
async function testAdminPatientCheckIn() {
  console.log('🧪 Testing Admin Patient Check-in Audit Logging...\n');
  
  const baseURL = 'http://localhost:3001/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('1️⃣  Testing admin manual patient check-in...');
    
    // Test admin manual check-in (if such endpoint exists)
    // First let's see what check-in endpoints are available
    console.log('🔍 Testing available check-in endpoints...');
    
    // Try QR check-in first (since we know this exists)
    const qrCheckInData = {
      patientId: 1,
      patientName: "John Doe",
      serviceType: "General Checkup",
      priority: "Normal",
      checkInMethod: "Admin Manual"
    };

    const qrResponse = await axios.post(`${baseURL}/checkups/qr-checkin`, qrCheckInData, {
      headers: authHeaders
    });

    console.log('✅ QR Check-in successful:', qrResponse.data.message);
    console.log(`   Session ID: ${qrResponse.data.session?.id}`);
    console.log(`   Patient: ${qrResponse.data.session?.patientName}`);
    console.log(`   Method: ${qrResponse.data.session?.checkInMethod}`);

    // Wait for audit log to be written
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check audit logs for this action
    console.log('\n📋 Checking audit logs...');
    const auditResponse = await axios.get(`${baseURL}/admin/audit-logs?limit=5`, {
      headers: authHeaders
    });

    const recentLogs = auditResponse.data.auditLogs.slice(0, 3);
    console.log(`Found ${auditResponse.data.auditLogs.length} total audit logs, showing recent:`);
    
    recentLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.action} - ${log.actionDescription}`);
      console.log(`   User: ${log.userName} (ID: ${log.userId})`);
      console.log(`   IP: ${log.ipAddress || 'N/A'}`);
      console.log(`   Time: ${log.timestamp}`);
      if (log.targetType && log.targetName) {
        console.log(`   Target: ${log.targetType} - ${log.targetName}`);
      }
    });

    console.log('\n✅ Admin Patient Check-in test completed!');
    return true;

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running. Please start the backend server first.');
      console.log('   Run: cd backend && node server.js');
      return false;
    } else {
      console.error('❌ Error testing admin patient check-in:', error.response?.data || error.message);
      return false;
    }
  }
}

// Run the test
testAdminPatientCheckIn().then(success => {
  if (success) {
    console.log('\n🎉 Test completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Verify user name shows correctly (should show actual admin name)');
    console.log('   2. Check if IP address is captured properly');
    console.log('   3. Verify patient check-in audit log details');
  } else {
    console.log('\n💥 Test failed. Please check server status and try again.');
  }
}).catch(error => {
  console.error('💥 Test script failed:', error);
});