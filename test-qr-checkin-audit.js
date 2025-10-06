const axios = require('axios');

// Test QR check-in audit logging
async function testQRCheckInAudit() {
  try {
    console.log('Testing QR check-in audit logging...');
    
    // Test QR check-in with patient ID 1
    const qrData = {
      patientId: 1,
      patientName: "John Doe",
      serviceType: "General Checkup",
      priority: "Normal",
      checkInMethod: "QR Code"
    };

    const response = await axios.post('http://localhost:3001/api/checkups/qr-checkin', qrData, {
      headers: {
        'Authorization': 'Bearer temp-admin-token',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ QR Check-in successful:', response.data);
    
    // Wait a moment for audit log to be written
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check audit logs
    const auditResponse = await axios.get('http://localhost:3001/api/admin/audit-logs', {
      headers: {
        'Authorization': 'Bearer temp-admin-token'
      }
    });

    console.log('\n📋 Recent audit logs:');
    auditResponse.data.auditLogs.slice(0, 3).forEach(log => {
      console.log(`- ${log.action} by ${log.userName} at ${log.timestamp}`);
      if (log.details) {
        console.log(`  Details: ${JSON.stringify(log.details, null, 2)}`);
      }
    });

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }
}

testQRCheckInAudit();