const axios = require('axios');

async function searchForCheckInAuditLog() {
  console.log('🧪 Searching for Patient Check-in Audit Log...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('🔍 Fetching recent audit logs...');
    
    // Get more logs to find the check-in log
    const auditResponse = await axios.get(`${baseURL}/audit/logs?limit=20`, {
      headers: authHeaders
    });

    console.log(`📊 Total audit logs: ${auditResponse.data.data.totalCount}`);
    console.log(`📋 Checking last 20 logs for patient operations...\n`);

    const logs = auditResponse.data.data.auditLogs;
    
    // Look for patient-related operations
    const patientLogs = logs.filter(log => 
      log.action.includes('patient') || 
      log.action.includes('check') ||
      log.actionDescription.toLowerCase().includes('patient') ||
      log.actionDescription.toLowerCase().includes('check') ||
      log.actionDescription.toLowerCase().includes('miguel') ||
      log.targetType === 'patient'
    );

    if (patientLogs.length > 0) {
      console.log(`🎯 Found ${patientLogs.length} patient-related logs:`);
      patientLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Action: ${log.action}`);
        console.log(`   Description: ${log.actionDescription}`);
        console.log(`   User: ${log.userName} (ID: ${log.userId})`);
        console.log(`   Target: ${log.targetType || 'N/A'} - ${log.targetName || 'N/A'}`);
        console.log(`   Time: ${log.timestamp}`);
        if (log.metadata) {
          try {
            const metadata = JSON.parse(log.metadata);
            console.log(`   Metadata: ${JSON.stringify(metadata, null, 4)}`);
          } catch (e) {
            console.log(`   Metadata (raw): ${log.metadata}`);
          }
        }
      });
    } else {
      console.log('⚠️  No patient-related logs found in the last 20 entries');
      console.log('\n📋 All recent log actions:');
      logs.slice(0, 10).forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} - ${log.actionDescription.substring(0, 60)}...`);
      });
    }

    // Also check if Miguel Cruz session was created
    console.log('\n🔍 Checking if Miguel Cruz session exists...');
    try {
      const todayResponse = await axios.get(`${baseURL}/checkups/today`, {
        headers: authHeaders
      });
      
      const miguelSession = todayResponse.data.find(session => 
        session.patientName && session.patientName.includes('Miguel Cruz')
      );
      
      if (miguelSession) {
        console.log('✅ Miguel Cruz session found:');
        console.log(`   Session ID: ${miguelSession.id}`);
        console.log(`   Status: ${miguelSession.status}`);
        console.log(`   Check-in Time: ${miguelSession.checkInTime}`);
      } else {
        console.log('❌ Miguel Cruz session not found in today\'s checkups');
      }
    } catch (sessionError) {
      console.log('❌ Error checking today\'s sessions:', sessionError.message);
    }

    return true;

  } catch (error) {
    console.error('❌ Error searching for audit logs:', error.message);
    return false;
  }
}

// Run the search
searchForCheckInAuditLog().then(success => {
  if (success) {
    console.log('\n🎉 Search completed!');
  } else {
    console.log('\n💥 Search failed.');
  }
}).catch(error => {
  console.error('💥 Search script failed:', error);
});