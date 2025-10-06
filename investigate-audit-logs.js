const axios = require('axios');

async function deepAuditLogInvestigation() {
  console.log('🧪 Deep Audit Log Investigation...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('1️⃣  Getting ALL recent audit logs...');
    
    const auditResponse = await axios.get(`${baseURL}/audit/logs?limit=50`, {
      headers: authHeaders
    });

    const logs = auditResponse.data.data.auditLogs;
    console.log(`📊 Total audit logs: ${auditResponse.data.data.totalCount}`);

    // Look for all patient-related logs
    const patientLogs = logs.filter(log => 
      log.action.includes('patient') ||
      log.targetType === 'patient' ||
      log.actionDescription.toLowerCase().includes('patient') ||
      log.actionDescription.toLowerCase().includes('check') ||
      log.actionDescription.toLowerCase().includes('isabella') ||
      log.actionDescription.toLowerCase().includes('fernandez') ||
      log.actionDescription.toLowerCase().includes('allen') ||
      log.actionDescription.toLowerCase().includes('faramis') ||
      log.actionDescription.toLowerCase().includes('miguel') ||
      log.actionDescription.toLowerCase().includes('cruz')
    );

    console.log(`\n🔍 Patient-related logs found: ${patientLogs.length}`);
    
    if (patientLogs.length > 0) {
      console.log('\n📋 All patient-related audit logs:');
      patientLogs.forEach((log, index) => {
        console.log(`\n${index + 1}. Action: ${log.action}`);
        console.log(`   Description: ${log.actionDescription}`);
        console.log(`   User: ${log.userName} (ID: ${log.userId})`);
        console.log(`   Target: ${log.targetType} - ${log.targetName || 'N/A'}`);
        console.log(`   Time: ${log.timestamp}`);
        console.log(`   IP: ${log.ipAddress}`);
      });
    } else {
      console.log('\n⚠️  NO patient-related logs found in the last 50 entries!');
      
      // Show the breakdown of what types of logs DO exist
      const actionTypes = {};
      logs.forEach(log => {
        actionTypes[log.action] = (actionTypes[log.action] || 0) + 1;
      });
      
      console.log('\n📊 Breakdown of existing log types:');
      Object.entries(actionTypes).forEach(([action, count]) => {
        console.log(`   ${action}: ${count} logs`);
      });
    }

    // Check if there are ANY audit logs with recent timestamps (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentLogs = logs.filter(log => new Date(log.timestamp) > oneHourAgo);
    
    console.log(`\n📅 Logs from last hour: ${recentLogs.length}`);
    if (recentLogs.length > 0) {
      console.log('\n🕐 Recent audit activity:');
      recentLogs.slice(0, 10).forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.action} by ${log.userName} at ${log.timestamp}`);
      });
    }

    return { total: logs.length, patientLogs: patientLogs.length, recentLogs: recentLogs.length };

  } catch (error) {
    console.error('❌ Error investigating audit logs:', error.message);
    return null;
  }
}

// Run the investigation
deepAuditLogInvestigation().then(result => {
  if (result) {
    console.log('\n📝 Investigation Summary:');
    console.log(`   Total audit logs: ${result.total}`);
    console.log(`   Patient-related logs: ${result.patientLogs}`);
    console.log(`   Recent logs (1 hour): ${result.recentLogs}`);
    
    if (result.patientLogs === 0) {
      console.log('\n🔍 CONCLUSION: Patient check-in audit logging is completely broken');
      console.log('   Either:');
      console.log('   A) The audit logging code is not executing at all');
      console.log('   B) The audit logging is throwing an error silently');
      console.log('   C) There\'s a database transaction/connection issue specific to patient operations');
    } else {
      console.log('\n✅ Patient audit logging is working but may have timing issues');
    }
  } else {
    console.log('\n💥 Investigation failed');
  }
}).catch(error => {
  console.error('💥 Investigation script failed:', error);
});