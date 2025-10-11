const express = require('express');
const path = require('path');

const AuditLogger = require('./backend/utils/auditLogger');

async function testCheckupAuditLogging() {
  console.log('🧪 Testing checkup audit logging...\n');

  try {
    // Test 1: QR Check-in audit logging
    console.log('1. Testing QR check-in audit logging...');
    await AuditLogger.logPatientCheckIn(1, 47, 'Kaleia Savet', {
      method: 'QR Scan',
      serviceType: 'General Checkup',
      priority: 'Normal',
      sessionId: 123,
      checkInTime: new Date()
    });
    console.log('✅ QR check-in audit log created successfully');

    // Test 2: Status update audit logging
    console.log('\n2. Testing checkup status update audit logging...');
    await AuditLogger.logCheckupStatusUpdate(3, 47, 'Kaleia Savet', {
      sessionId: 123,
      oldStatus: 'checked-in',
      newStatus: 'in-progress',
      hasNotes: true,
      hasDiagnosis: false,
      hasTreatmentPlan: false,
      prescriptionCount: 0
    });
    console.log('✅ Status update audit log created successfully');

    // Test 3: Force completion audit logging
    console.log('\n3. Testing force completion audit logging...');
    await AuditLogger.logCheckupForceComplete(1, 47, 'Kaleia Savet', {
      sessionId: 123,
      previousStatus: 'in-progress',
      userRole: 'admin',
      assignedDoctor: 3
    });
    console.log('✅ Force completion audit log created successfully');

    console.log('\n🎉 All checkup audit logging tests passed!');

  } catch (error) {
    console.error('❌ Error testing checkup audit logging:', error);
    process.exit(1);
  }
}

// Run the test
testCheckupAuditLogging().then(() => {
  console.log('\n✅ Test completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});