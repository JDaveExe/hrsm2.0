const axios = require('axios');

async function testPatientCheckInWithFixedAudit() {
  console.log('🧪 Testing Patient Check-in with Fixed Audit Logging...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('1️⃣  Getting current audit log count...');
    const initialAuditResponse = await axios.get(`${baseURL}/audit/logs?limit=1`, {
      headers: authHeaders
    });
    
    const initialCount = initialAuditResponse.data.data.totalCount;
    console.log(`📊 Current audit log count: ${initialCount}`);

    console.log('\n2️⃣  Testing patient check-in with Isabella Fernandez (ID: 108)...');
    
    const qrCheckInData = {
      patientId: 108,
      patientName: "Isabella Fernandez",
      serviceType: "General Checkup",
      priority: "Normal",
      checkInMethod: "Fixed Audit Test"
    };

    console.log(`📋 Check-in data: ${qrCheckInData.patientName} (ID: ${qrCheckInData.patientId})`);

    const checkInResponse = await axios.post(`${baseURL}/checkups/qr-checkin`, qrCheckInData, {
      headers: authHeaders
    });

    console.log('✅ Check-in successful:', checkInResponse.data.message);
    console.log(`   Session ID: ${checkInResponse.data.session.id}`);

    console.log('\n⏳ Waiting for audit processing...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n3️⃣  Checking for new audit logs...');
    const newAuditResponse = await axios.get(`${baseURL}/audit/logs?limit=10`, {
      headers: authHeaders
    });

    const newCount = newAuditResponse.data.data.totalCount;
    console.log(`📊 New audit log count: ${newCount}`);
    console.log(`📈 Difference: +${newCount - initialCount} new logs`);

    if (newCount > initialCount) {
      const logs = newAuditResponse.data.data.auditLogs;
      const newLogs = logs.slice(0, newCount - initialCount);
      
      console.log('\n🎯 New audit logs found:');
      newLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Action: ${log.action}`);
        console.log(`   Description: ${log.actionDescription}`);
        console.log(`   User: ${log.userName}`);
        console.log(`   Target: ${log.targetName || 'N/A'}`);
        console.log(`   Time: ${log.timestamp}`);
      });

      // Look for patient check-in logs
      const checkInLogs = newLogs.filter(log => 
        log.action === 'patient_check_in' ||
        log.actionDescription.toLowerCase().includes('isabella') ||
        log.actionDescription.toLowerCase().includes('fernandez') ||
        log.actionDescription.toLowerCase().includes('checked in patient')
      );

      if (checkInLogs.length > 0) {
        console.log('\n✅ SUCCESS: Patient check-in audit logging is now working!');
        console.log('🎉 Fixed by using logCustomAction instead of logPatientCheckIn');
        return true;
      } else {
        console.log('\n⚠️  New logs found but none related to patient check-in');
        return false;
      }
    } else {
      console.log('\n⚠️  No new audit logs found');
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
testPatientCheckInWithFixedAudit().then(success => {
  if (success) {
    console.log('\n🎉 Patient check-in audit logging is now working!');
    console.log('✅ Can proceed to test other audit features.');
  } else {
    console.log('\n🔧 Still investigating patient check-in audit logging.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});