const axios = require('axios');

// Test Admin Patient Check-in
async function testAdminPatientCheckIn() {
  console.log('🧪 Testing Admin Patient Check-in Audit Logging...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('1️⃣  Getting current audit log count...');
    
    // Get current audit log count
    const initialAuditResponse = await axios.get(`${baseURL}/audit/logs?limit=1`, {
      headers: authHeaders
    });
    
    const initialCount = initialAuditResponse.data.data.totalCount;
    console.log(`📊 Current audit log count: ${initialCount}`);

    console.log('\n2️⃣  Testing patient check-in...');
    
    // Test QR check-in (we know this endpoint exists)
    const qrCheckInData = {
      patientId: 105,
      patientName: "Miguel Cruz",
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
    console.log('\n⏳ Waiting for audit log to be written...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n3️⃣  Checking for new audit logs...');
    const newAuditResponse = await axios.get(`${baseURL}/audit/logs?limit=5`, {
      headers: authHeaders
    });

    const newCount = newAuditResponse.data.data.totalCount;
    console.log(`📊 New audit log count: ${newCount}`);
    console.log(`📈 Difference: +${newCount - initialCount} new logs`);

    const recentLogs = newAuditResponse.data.data.auditLogs.slice(0, 3);
    console.log(`\n📋 Recent audit logs:`);
    
    recentLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. ${log.action} - ${log.actionDescription}`);
      console.log(`   User: ${log.userName} (ID: ${log.userId})`);
      console.log(`   IP: ${log.ipAddress || 'N/A'}`);
      console.log(`   Time: ${log.timestamp}`);
      if (log.targetType && log.targetName) {
        console.log(`   Target: ${log.targetType} - ${log.targetName}`);
      }
      if (log.metadata) {
        try {
          const metadata = JSON.parse(log.metadata);
          console.log(`   Metadata: ${JSON.stringify(metadata, null, 4)}`);
        } catch (e) {
          console.log(`   Metadata (raw): ${log.metadata}`);
        }
      }
    });

    // Look for check-in related logs
    const checkInLogs = recentLogs.filter(log => 
      log.action.includes('check') || 
      log.action.includes('patient') ||
      log.actionDescription.toLowerCase().includes('check') ||
      log.actionDescription.toLowerCase().includes('miguel')
    );

    if (checkInLogs.length > 0) {
      console.log('\n🎯 Found check-in related logs:');
      checkInLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action}: ${log.actionDescription}`);
      });
    } else {
      console.log('\n⚠️  No check-in related logs found in recent entries');
    }

    console.log('\n✅ Admin Patient Check-in test completed!');
    return { success: true, newLogs: newCount - initialCount };

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running. Please start the backend server first.');
      return { success: false, error: 'Server not running' };
    } else {
      console.error('❌ Error testing admin patient check-in:');
      console.error('   Status:', error.response?.status);
      console.error('   Data:', error.response?.data);
      console.error('   Message:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Run the test
testAdminPatientCheckIn().then(result => {
  if (result.success) {
    console.log('\n🎉 Test completed successfully!');
    console.log(`📝 Results: ${result.newLogs || 0} new audit logs created`);
    console.log('✅ Next steps:');
    console.log('   1. Verify user name shows correctly (should show "Jelly Test")');
    console.log('   2. Check if patient check-in audit logging is working');
    console.log('   3. Test other patient operations');
  } else {
    console.log('\n💥 Test failed:', result.error);
  }
}).catch(error => {
  console.error('💥 Test script failed:', error);
});