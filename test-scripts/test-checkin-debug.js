const axios = require('axios');

async function testPatientCheckInWithDebug() {
  console.log('🧪 Testing Patient Check-in with Debug Logging...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    // Use a patient that's not already checked in - let's try Mike Cruz (ID: 115)
    console.log('1️⃣  Attempting check-in for Mike Cruz...');
    
    const qrCheckInData = {
      patientId: 115,
      patientName: "Mike Cruz",
      serviceType: "General Checkup",
      priority: "Normal",
      checkInMethod: "Admin Manual Debug"
    };

    console.log('📋 Check-in data:', JSON.stringify(qrCheckInData, null, 2));

    const checkInResponse = await axios.post(`${baseURL}/checkups/qr-checkin`, qrCheckInData, {
      headers: authHeaders
    });

    console.log('✅ Check-in response:', checkInResponse.data);

    // Wait for audit log to be written
    console.log('\n⏳ Waiting for audit log to be written...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n2️⃣  Searching for the audit log...');
    
    // Search for audit logs with patient name and recent timestamp
    const auditResponse = await axios.get(`${baseURL}/audit/logs?limit=50`, {
      headers: authHeaders
    });

    console.log(`📊 Total audit logs: ${auditResponse.data.data.totalCount}`);

    const logs = auditResponse.data.data.auditLogs;
    
    // Look for recent logs (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentLogs = logs.filter(log => new Date(log.timestamp) > fiveMinutesAgo);
    
    console.log(`📋 Recent logs (last 5 minutes): ${recentLogs.length}`);
    
    recentLogs.forEach((log, index) => {
      console.log(`\n${index + 1}. Action: ${log.action}`);
      console.log(`   Description: ${log.actionDescription}`);
      console.log(`   User: ${log.userName} (ID: ${log.userId})`);
      console.log(`   Target: ${log.targetType || 'N/A'} - ${log.targetName || 'N/A'}`);
      console.log(`   Time: ${log.timestamp}`);
    });

    // Look specifically for Mike Cruz or patient check-in logs
    const mikeLogs = logs.filter(log => 
      log.actionDescription.toLowerCase().includes('mike') ||
      log.actionDescription.toLowerCase().includes('cruz') ||
      log.action.includes('patient') ||
      log.action.includes('check')
    );

    if (mikeLogs.length > 0) {
      console.log(`\n🎯 Found Mike Cruz / patient check-in logs:`);
      mikeLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Action: ${log.action}`);
        console.log(`   Description: ${log.actionDescription}`);
        console.log(`   User: ${log.userName}`);
        console.log(`   Target: ${log.targetName || 'N/A'}`);
        console.log(`   Time: ${log.timestamp}`);
      });
    } else {
      console.log('\n⚠️  No Mike Cruz / patient check-in logs found!');
      console.log('   This suggests the audit logging might not be working properly.');
    }

    return true;

  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Patient already checked in today. This is expected.');
      console.log('   But we should still check if the previous check-in was logged.');
      
      // Still check for audit logs
      try {
        const auditResponse = await axios.get(`${baseURL}/audit/logs?limit=20`, {
          headers: authHeaders
        });
        
        const logs = auditResponse.data.data.auditLogs;
        const mikeLogs = logs.filter(log => 
          log.actionDescription.toLowerCase().includes('mike') ||
          log.actionDescription.toLowerCase().includes('cruz')
        );
        
        if (mikeLogs.length > 0) {
          console.log('\n🎯 Found existing Mike Cruz logs:');
          mikeLogs.forEach((log, index) => {
            console.log(`   ${index + 1}. ${log.action}: ${log.actionDescription}`);
          });
        } else {
          console.log('\n⚠️  No Mike Cruz logs found in recent history.');
        }
        
      } catch (auditError) {
        console.log('❌ Error checking audit logs:', auditError.message);
      }
      
      return false;
    } else {
      console.error('❌ Error during check-in:', error.response?.data || error.message);
      return false;
    }
  }
}

// Run the test
testPatientCheckInWithDebug().then(success => {
  console.log(`\n📝 Debug test completed. Success: ${success}`);
}).catch(error => {
  console.error('💥 Debug test failed:', error);
});