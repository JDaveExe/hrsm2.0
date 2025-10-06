const axios = require('axios');

async function testVitalSignsAuditLogging() {
  console.log('🧪 Testing Vital Signs Audit Logging...\n');
  
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

    console.log('\n2️⃣  Getting today\'s checked-in patients...');
    const todayResponse = await axios.get(`${baseURL}/checkups/today`, {
      headers: authHeaders
    });

    console.log(`📋 Checked-in patients today: ${todayResponse.data.length}`);
    
    if (todayResponse.data.length === 0) {
      console.log('⚠️  No patients checked in today. Need to check in a patient first.');
      return false;
    }

    const firstPatient = todayResponse.data[0];
    console.log(`👤 Testing with: ${firstPatient.patientName} (ID: ${firstPatient.patientId})`);

    console.log('\n3️⃣  Recording vital signs...');
    
    const vitalSignsData = {
      patientId: firstPatient.patientId,
      temperature: 36.5,
      heartRate: 72,
      systolicBP: 120,
      diastolicBP: 80,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weight: 70,
      height: 170,
      clinicalNotes: 'Test vital signs for audit logging'
    };

    console.log('📋 Vital signs data:', {
      patient: firstPatient.patientName,
      bp: `${vitalSignsData.systolicBP}/${vitalSignsData.diastolicBP}`,
      hr: vitalSignsData.heartRate,
      temp: vitalSignsData.temperature
    });

    const vitalSignsResponse = await axios.post(`${baseURL}/vital-signs`, vitalSignsData, {
      headers: authHeaders
    });

    console.log('✅ Vital signs recorded:', vitalSignsResponse.data.message || 'Success');

    console.log('\n⏳ Waiting for audit log to be written...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n4️⃣  Checking for new audit logs...');
    const newAuditResponse = await axios.get(`${baseURL}/audit/logs?limit=10`, {
      headers: authHeaders
    });

    const newCount = newAuditResponse.data.data.totalCount;
    console.log(`📊 New audit log count: ${newCount}`);
    console.log(`📈 Difference: +${newCount - initialCount} new logs`);

    if (newCount > initialCount) {
      const logs = newAuditResponse.data.data.auditLogs;
      const recentLogs = logs.slice(0, newCount - initialCount);
      
      console.log('\n🎯 New audit logs found:');
      recentLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Action: ${log.action}`);
        console.log(`   Description: ${log.actionDescription}`);
        console.log(`   User: ${log.userName}`);
        console.log(`   Target: ${log.targetName || 'N/A'}`);
        console.log(`   Time: ${log.timestamp}`);
      });

      // Look for vital signs logs
      const vitalSignsLogs = recentLogs.filter(log => 
        log.action.includes('vital') ||
        log.actionDescription.toLowerCase().includes('vital') ||
        log.actionDescription.toLowerCase().includes(firstPatient.patientName.toLowerCase())
      );

      if (vitalSignsLogs.length > 0) {
        console.log('\n✅ SUCCESS: Vital signs audit logging is working!');
        return true;
      } else {
        console.log('\n⚠️  New logs found but none related to vital signs');
        return false;
      }
    } else {
      console.log('\n⚠️  No new audit logs found for vital signs recording');
      return false;
    }

  } catch (error) {
    console.error('❌ Error testing vital signs audit logging:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', error.response?.data);
    console.error('   Message:', error.message);
    return false;
  }
}

// Run the test
testVitalSignsAuditLogging().then(success => {
  if (success) {
    console.log('\n🎉 Vital signs audit logging is working!');
    console.log('✅ At least one audit logging feature is functional.');
  } else {
    console.log('\n🔧 Vital signs audit logging needs investigation.');
    console.log('💡 May have the same database connection issue as patient check-in.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});