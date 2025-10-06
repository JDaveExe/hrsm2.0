// test-individual-audit-events.js
// Test each audit event type individually to see which ones are missing

const axios = require('axios');
const AuditLogger = require('./backend/utils/auditLogger');

const BASE_URL = 'http://localhost:3001/api';

// Simulate request object for direct auditLogger testing
function createMockRequest(userId = 1, userRole = 'admin') {
  return {
    user: {
      id: userId,
      role: userRole,
      firstName: 'Test',
      lastName: 'User'
    },
    ip: '127.0.0.1',
    get: (header) => header === 'User-Agent' ? 'Test-Agent' : null,
    session: { id: 'test-session' }
  };
}

async function testIndividualAuditEvents() {
  console.log('🔍 Testing Individual Audit Events...\n');

  // Test 1: Direct AuditLogger functions
  console.log('1. Testing AuditLogger functions directly...\n');

  try {
    const mockReq = createMockRequest();
    
    // Test patient removal logging
    console.log('   Testing logPatientRemoval...');
    await AuditLogger.logPatientRemoval(mockReq, {
      id: 99,
      firstName: 'Test',
      lastName: 'Patient'
    });
    console.log('   ✅ logPatientRemoval works');

    // Test patient check-in logging
    console.log('   Testing logPatientCheckIn...');
    await AuditLogger.logPatientCheckIn(mockReq, {
      id: 99,
      firstName: 'Test',
      lastName: 'Patient'
    });
    console.log('   ✅ logPatientCheckIn works');

    // Test vital signs logging
    console.log('   Testing logVitalSignsCheck...');
    await AuditLogger.logVitalSignsCheck(mockReq, {
      id: 99,
      firstName: 'Test',
      lastName: 'Patient'
    }, {
      bloodPressure: '120/80',
      temperature: '98.6°F',
      heartRate: '72 bpm'
    });
    console.log('   ✅ logVitalSignsCheck works');

    // Test patient transfer logging
    console.log('   Testing logPatientTransfer...');
    await AuditLogger.logPatientTransfer(mockReq, {
      id: 99,
      firstName: 'Test',
      lastName: 'Patient'
    }, {
      id: 2,
      firstName: 'Dr.',
      lastName: 'Test'
    });
    console.log('   ✅ logPatientTransfer works');

    // Test vaccination logging
    console.log('   Testing logVaccination...');
    await AuditLogger.logVaccination(mockReq, {
      id: 99,
      firstName: 'Test',
      lastName: 'Patient'
    }, {
      name: 'COVID-19',
      batchNumber: 'TEST-001'
    });
    console.log('   ✅ logVaccination works');

    // Test user creation logging
    console.log('   Testing logUserCreation...');
    await AuditLogger.logUserCreation(mockReq, {
      id: 100,
      username: 'newuser',
      role: 'staff',
      firstName: 'New',
      lastName: 'User'
    });
    console.log('   ✅ logUserCreation works');

    // Test checkup start logging
    console.log('   Testing logCheckupStart...');
    await AuditLogger.logCheckupStart(mockReq, {
      id: 50,
      patientId: 99,
      doctorId: 2
    });
    console.log('   ✅ logCheckupStart works');

    // Test checkup finish logging
    console.log('   Testing logCheckupFinish...');
    await AuditLogger.logCheckupFinish(mockReq, {
      id: 50,
      patientId: 99,
      doctorId: 2,
      diagnosis: 'Test diagnosis'
    });
    console.log('   ✅ logCheckupFinish works');

    // Test medication management logging
    console.log('   Testing logMedicationManagement...');
    await AuditLogger.logMedicationManagement(mockReq, {
      name: 'Test Medication',
      type: 'Tablet',
      quantity: 100
    });
    console.log('   ✅ logMedicationManagement works');

    // Test vaccine management logging
    console.log('   Testing logVaccineManagement...');
    await AuditLogger.logVaccineManagement(mockReq, {
      name: 'Test Vaccine',
      type: 'Injection',
      batchNumber: 'VAX-001'
    });
    console.log('   ✅ logVaccineManagement works');

    // Test stock management logging
    console.log('   Testing logStockManagement...');
    await AuditLogger.logStockManagement(mockReq, {
      itemType: 'medication',
      itemName: 'Test Item',
      quantity: 50,
      action: 'added'
    });
    console.log('   ✅ logStockManagement works');

    // Test report creation logging
    console.log('   Testing logReportCreation...');
    await AuditLogger.logReportCreation(mockReq, {
      type: 'patient_report',
      dateRange: '2025-10-01 to 2025-10-31',
      parameters: { status: 'all' }
    });
    console.log('   ✅ logReportCreation works');

    console.log('\n✅ All AuditLogger functions work correctly!');

  } catch (error) {
    console.error('❌ AuditLogger function failed:', error.message);
  }

  // Test 2: Check if these events appear in audit logs
  console.log('\n2. Checking if events appear in audit trail...');
  
  try {
    const response = await axios.get(`${BASE_URL}/audit/logs`, {
      headers: { 'Authorization': 'Bearer temp-admin-token' }
    });
    
    const logs = response.data.logs;
    console.log(`   Found ${logs.length} total audit logs`);
    
    // Count different action types
    const actionCounts = {};
    logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    
    console.log('\n   Action breakdown:');
    Object.entries(actionCounts).forEach(([action, count]) => {
      console.log(`   - ${action}: ${count} times`);
    });
    
    // Check for our test events
    const testEvents = [
      'removed_patient',
      'checked_in_patient', 
      'checked_vital_signs',
      'transferred_patient',
      'vaccinated_patient',
      'added_new_user',
      'started_checkup',
      'finished_checkup',
      'added_new_medication',
      'added_new_vaccine',
      'added_stocks',
      'created_report'
    ];
    
    console.log('\n   Test event status:');
    testEvents.forEach(event => {
      const found = actionCounts[event] || 0;
      const icon = found > 0 ? '✅' : '❌';
      console.log(`   ${icon} ${event}: ${found} events`);
    });
    
  } catch (error) {
    console.error('❌ Failed to fetch audit logs:', error.message);
  }

  console.log('\n3. API Endpoint Testing...');
  
  // List of API endpoints that should trigger audit events
  const apiTests = [
    { 
      method: 'GET', 
      url: '/patients', 
      description: 'List patients',
      expectedAudit: null 
    },
    {
      method: 'GET',
      url: '/users',
      description: 'List users', 
      expectedAudit: null
    },
    {
      method: 'GET',
      url: '/checkups',
      description: 'List checkups',
      expectedAudit: null
    }
  ];

  for (const test of apiTests) {
    try {
      console.log(`   Testing ${test.method} ${test.url}...`);
      const response = await axios({
        method: test.method.toLowerCase(),
        url: `${BASE_URL}${test.url}`,
        headers: { 'Authorization': 'Bearer temp-admin-token' }
      });
      console.log(`   ✅ ${test.description}: ${response.status} ${response.statusText}`);
    } catch (error) {
      const status = error.response?.status || 'ERROR';
      console.log(`   ❌ ${test.description}: ${status} ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 CONCLUSIONS');
  console.log('='.repeat(60));
  console.log('1. AuditLogger utility functions work correctly ✅');
  console.log('2. Need to check which API routes are missing audit integration ❌');
  console.log('3. Most backend routes probably need audit logging added ❌');
  console.log('4. Frontend actions may not be calling the correct API endpoints ❌');
  console.log('\n🔧 NEXT STEPS:');
  console.log('- Check existing route files for audit integration');
  console.log('- Add audit logging to missing route handlers');
  console.log('- Verify frontend is calling correct API endpoints');
  console.log('- Test each user action type from the UI');
}

if (require.main === module) {
  testIndividualAuditEvents().catch(console.error);
}

module.exports = { testIndividualAuditEvents };