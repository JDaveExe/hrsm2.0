// Direct test of the AuditLogger.logPatientCheckIn function
// This bypasses the HTTP route and tests the audit logging directly

const AuditLogger = require('./backend/utils/auditLogger');

async function testDirectAuditCall() {
  console.log('🧪 Testing Direct AuditLogger.logPatientCheckIn Call...\n');

  try {
    // Simulate a request object like the one in the QR check-in route
    const mockReq = {
      user: {
        id: 10029,
        username: 'jellytest',
        email: 'jelly@test.com',
        role: 'admin',
        firstName: 'Jelly',
        lastName: 'Test',
        position: 'Administrator'
      },
      ip: '::1',
      get: () => 'test-user-agent',
      session: null
    };

    console.log('1️⃣  Calling AuditLogger.logPatientCheckIn directly...');
    console.log('   Mock user:', mockReq.user);
    console.log('   Parameters: patientId=999, patientName="Test Patient"');

    await AuditLogger.logPatientCheckIn(mockReq, 999, "Test Patient", {
      method: 'Direct Test',
      serviceType: 'Test Checkup',
      priority: 'Normal',
      sessionId: 999,
      checkInTime: new Date()
    });

    console.log('✅ AuditLogger.logPatientCheckIn call completed!');
    console.log('\n2️⃣  Check your database or API to see if audit log was created');
    console.log('   Look for: action="patient_check_in", targetName="Test Patient"');

    return true;

  } catch (error) {
    console.error('❌ Error calling AuditLogger.logPatientCheckIn directly:', error);
    return false;
  }
}

// Run the test
testDirectAuditCall().then(success => {
  if (success) {
    console.log('\n🎉 Direct call completed successfully!');
    console.log('📝 Check the database for the audit log entry.');
  } else {
    console.log('\n💥 Direct call failed.');
  }
}).catch(error => {
  console.error('💥 Test script failed:', error);
});