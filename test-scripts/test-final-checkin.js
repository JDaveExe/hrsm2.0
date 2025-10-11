const axios = require('axios');

async function testPatientCheckInFinal() {
  console.log('🧪 Final Test: Patient Check-in Audit Logging...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('1️⃣  Testing patient check-in with another patient...');
    
    // Let's use Allen Faramis (ID: 137) 
    const qrCheckInData = {
      patientId: 137,
      patientName: "Allen Faramis",
      serviceType: "General Checkup",
      priority: "Normal",
      checkInMethod: "Final Test"
    };

    console.log(`📋 Check-in data: ${qrCheckInData.patientName} (ID: ${qrCheckInData.patientId})`);

    const checkInResponse = await axios.post(`${baseURL}/checkups/qr-checkin`, qrCheckInData, {
      headers: authHeaders
    });

    console.log('✅ Check-in successful:', checkInResponse.data.message);
    console.log(`   Session ID: ${checkInResponse.data.session.id}`);

    console.log('\n⏳ Waiting for audit processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n2️⃣  Checking for audit logs...');
    const auditResponse = await axios.get(`${baseURL}/audit/logs?limit=10`, {
      headers: authHeaders
    });

    const logs = auditResponse.data.data.auditLogs;
    
    // Look for recent logs (last 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const recentLogs = logs.filter(log => new Date(log.timestamp) > twoMinutesAgo);
    
    console.log(`📋 Recent logs (last 2 minutes): ${recentLogs.length}`);
    
    // Look for Allen Faramis logs
    const allenLogs = logs.filter(log => 
      log.actionDescription.toLowerCase().includes('allen') ||
      log.actionDescription.toLowerCase().includes('faramis') ||
      (log.action === 'patient_check_in' && log.targetName === 'Allen Faramis')
    );

    if (allenLogs.length > 0) {
      console.log('\n🎯 Found Allen Faramis audit logs:');
      allenLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Action: ${log.action}`);
        console.log(`   Description: ${log.actionDescription}`);
        console.log(`   User: ${log.userName}`);
        console.log(`   Time: ${log.timestamp}`);
      });
      console.log('\n✅ SUCCESS: Patient check-in audit logging is working!');
      return true;
    } else {
      console.log('\n⚠️  No Allen Faramis audit logs found.');
      console.log('💡 Check the server console for error messages:');
      console.log('   - "❌ Audit logging failed for patient check-in:"');
      console.log('   - "❌ Failed to log patient check-in audit:"');
      
      // Show recent log actions for debugging
      console.log('\n📋 Recent audit log actions:');
      recentLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} - ${log.actionDescription.substring(0, 50)}...`);
      });
      
      return false;
    }

  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  Patient already checked in. This is expected.');
      return false;
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
      return false;
    }
  }
}

// Run the test
testPatientCheckInFinal().then(success => {
  if (success) {
    console.log('\n🎉 Patient check-in audit logging is working!');
    console.log('✅ Ready to test other audit features.');
  } else {
    console.log('\n🔧 Patient check-in audit logging needs further investigation.');
    console.log('💡 Check server console for database connection errors.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});