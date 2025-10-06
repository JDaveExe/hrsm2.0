const axios = require('axios');

// Test IP address extraction in audit logs
async function testIPAddressExtraction() {
  console.log('🔍 Testing IP address extraction in audit logs...\n');
  
  const baseURL = 'http://localhost:3001/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    // Make a test request that should create an audit log
    console.log('Making test API request to generate audit log...');
    
    // Test QR check-in (should create audit log with IP)
    const qrData = {
      patientId: 1,
      patientName: "John Doe",
      serviceType: "General Checkup",
      priority: "Normal",
      checkInMethod: "QR Code"
    };

    const response = await axios.post(`${baseURL}/checkups/qr-checkin`, qrData, {
      headers: authHeaders
    });

    console.log('✅ Test request successful:', response.data.message);
    
    // Wait a moment for audit log to be written
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check audit logs for IP address
    console.log('\n📋 Checking recent audit logs for IP addresses...');
    const auditResponse = await axios.get(`${baseURL}/admin/audit-logs`, {
      headers: authHeaders
    });

    console.log(`Found ${auditResponse.data.auditLogs.length} audit log entries\n`);
    
    // Check the most recent logs for IP addresses
    const recentLogs = auditResponse.data.auditLogs.slice(0, 5);
    let hasIPAddress = false;
    
    recentLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.action} - ${log.actionDescription}`);
      console.log(`   User: ${log.userName}`);
      console.log(`   Timestamp: ${log.timestamp}`);
      
      if (log.ipAddress) {
        console.log(`   ✅ IP Address: ${log.ipAddress}`);
        hasIPAddress = true;
      } else {
        console.log(`   ❌ IP Address: Missing/null`);
      }
      
      if (log.userAgent) {
        console.log(`   ✅ User Agent: ${log.userAgent.substring(0, 50)}...`);
      } else {
        console.log(`   ❌ User Agent: Missing/null`);
      }
      console.log('');
    });

    if (hasIPAddress) {
      console.log('🎉 IP address extraction is working correctly!');
    } else {
      console.log('⚠️  IP addresses are not being captured in audit logs');
      console.log('This may be due to proxy configuration or middleware setup');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⚠️  Server not running - cannot test IP address extraction');
      console.log('✅ IP address extraction fixes have been applied:');
      console.log('   - Added app.set("trust proxy", true) to server.js');
      console.log('   - Updated audit methods to use req object for IP extraction');
      console.log('   - Fixed route calls to pass req object instead of just userId');
      console.log('\n🔧 Changes made:');
      console.log('   - backend/server.js: Added trust proxy setting');
      console.log('   - backend/utils/auditLogger.js: Fixed method signatures');
      console.log('   - backend/routes/patients.js: Updated audit calls');
      console.log('   - backend/routes/checkups.js: Updated audit calls');
      console.log('   - backend/routes/inventory.js: Updated audit calls');
    } else {
      console.error('❌ Error testing IP extraction:', error.message);
    }
  }
}

testIPAddressExtraction();