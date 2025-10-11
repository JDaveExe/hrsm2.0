/**
 * Comprehensive Audit Trail Test Script
 * Tests all implemented admin audit logging functionality
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let authToken = '';
let testPatientId = null;
let testSessionId = null;
let testDoctorId = null;
let testMedicationId = null;
let testVaccineId = null;

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(`  ${title}`, 'cyan');
  console.log('='.repeat(80));
}

function logTest(testName) {
  log(`\n🧪 TEST: ${testName}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Helper function to make authenticated requests
async function apiRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
}

// Get audit logs for verification
async function getAuditLogs(action = null) {
  try {
    let endpoint = '/audit/logs?limit=50';
    if (action) {
      endpoint += `&action=${action}`;
    }
    const result = await apiRequest('get', endpoint);
    return result.success ? result.data.logs : [];
  } catch (error) {
    logError(`Failed to fetch audit logs: ${error.message}`);
    return [];
  }
}

// Display recent audit logs
async function displayRecentAuditLogs(count = 5) {
  const logs = await getAuditLogs();
  
  if (logs.length === 0) {
    logWarning('No audit logs found');
    return;
  }
  
  log(`\n📋 Recent ${count} Audit Logs:`, 'magenta');
  logs.slice(0, count).forEach((log, index) => {
    console.log(`\n${index + 1}. ${log.actionDescription}`);
    console.log(`   Action: ${log.action}`);
    console.log(`   User: ${log.userName} (${log.userRole})`);
    console.log(`   Time: ${new Date(log.createdAt).toLocaleString()}`);
    if (log.targetName) {
      console.log(`   Target: ${log.targetName} (${log.targetType})`);
    }
  });
}

// 1. Login as admin
async function loginAsAdmin() {
  logTest('Admin Login');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    
    authToken = response.data.token;
    logSuccess('Admin logged in successfully');
    return true;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.msg || error.response?.data?.error || error.message}`);
    return false;
  }
}

// 2. Test Patient Check-in
async function testPatientCheckIn() {
  logTest('Patient Check-in Audit');
  
  // First, get a patient to check in
  const patientsResult = await apiRequest('get', '/patients?limit=1');
  if (!patientsResult.success || !patientsResult.data.patients?.length) {
    logError('No patients found to test check-in');
    return false;
  }
  
  testPatientId = patientsResult.data.patients[0].id;
  const patientName = `${patientsResult.data.patients[0].firstName} ${patientsResult.data.patients[0].lastName}`;
  
  // Check in the patient
  const checkInResult = await apiRequest('post', '/checkups/check-in', {
    patientId: testPatientId,
    serviceType: 'General Checkup',
    priority: 'normal'
  });
  
  if (checkInResult.success) {
    testSessionId = checkInResult.data.session?.id;
    logSuccess(`Patient ${patientName} checked in (Session ID: ${testSessionId})`);
    
    // Verify audit log
    const logs = await getAuditLogs('checked_in_patient');
    const recentLog = logs.find(log => log.targetId === testPatientId);
    if (recentLog) {
      logSuccess(`Audit log created: "${recentLog.actionDescription}"`);
      return true;
    } else {
      logWarning('Check-in succeeded but audit log not found');
      return false;
    }
  } else {
    logError(`Check-in failed: ${checkInResult.error}`);
    return false;
  }
}

// 3. Test Vital Signs Check
async function testVitalSignsCheck() {
  logTest('Vital Signs Check Audit');
  
  if (!testSessionId) {
    logWarning('No check-in session available, skipping vital signs test');
    return false;
  }
  
  const vitalSigns = {
    bloodPressure: '120/80',
    heartRate: 72,
    temperature: 36.5,
    weight: 70,
    height: 170,
    respiratoryRate: 16
  };
  
  const result = await apiRequest('post', `/checkups/${testSessionId}/vital-signs`, vitalSigns);
  
  if (result.success) {
    logSuccess('Vital signs recorded successfully');
    
    // Verify audit log
    const logs = await getAuditLogs('checked_vital_signs');
    const recentLog = logs.find(log => log.targetId === testPatientId);
    if (recentLog) {
      logSuccess(`Audit log created: "${recentLog.actionDescription}"`);
      return true;
    } else {
      logWarning('Vital signs check succeeded but audit log not found');
      return false;
    }
  } else {
    logError(`Vital signs check failed: ${result.error}`);
    return false;
  }
}

// 4. Test Patient Transfer to Doctor
async function testPatientTransfer() {
  logTest('Patient Transfer Audit');
  
  if (!testSessionId) {
    logWarning('No check-in session available, skipping patient transfer test');
    return false;
  }
  
  // Get a doctor
  const usersResult = await apiRequest('get', '/users');
  const doctor = usersResult.success && usersResult.data.users?.find(u => u.role === 'doctor');
  
  if (!doctor) {
    logWarning('No doctor found to test patient transfer');
    return false;
  }
  
  testDoctorId = doctor.id;
  
  const result = await apiRequest('post', `/checkups/${testSessionId}/notify-doctor`, {
    assignedDoctor: testDoctorId,
    assignedDoctorName: `${doctor.firstName} ${doctor.lastName}`
  });
  
  if (result.success) {
    logSuccess(`Patient transferred to Dr. ${doctor.firstName} ${doctor.lastName}`);
    
    // Verify audit log
    const logs = await getAuditLogs('transferred_patient');
    const recentLog = logs.find(log => log.targetId === testPatientId);
    if (recentLog) {
      logSuccess(`Audit log created: "${recentLog.actionDescription}"`);
      return true;
    } else {
      logWarning('Patient transfer succeeded but audit log not found');
      return false;
    }
  } else {
    logError(`Patient transfer failed: ${result.error}`);
    return false;
  }
}

// 5. Test Vaccination Administration
async function testVaccination() {
  logTest('Vaccination Administration Audit');
  
  if (!testPatientId) {
    logWarning('No patient available, skipping vaccination test');
    return false;
  }
  
  // Get a vaccine
  const vaccinesResult = await apiRequest('get', '/vaccinations/vaccines');
  if (!vaccinesResult.success || !vaccinesResult.data?.length) {
    logWarning('No vaccines found to test vaccination');
    return false;
  }
  
  const vaccine = vaccinesResult.data[0];
  
  const vaccinationData = {
    patientId: testPatientId,
    vaccineId: vaccine.id,
    vaccineName: vaccine.name,
    doseNumber: 1,
    administeredBy: 'Test Admin',
    site: 'Left arm',
    lotNumber: 'TEST-001',
    expiryDate: '2025-12-31',
    notes: 'Test vaccination for audit trail'
  };
  
  const result = await apiRequest('post', '/vaccinations', vaccinationData);
  
  if (result.success) {
    logSuccess(`Vaccination ${vaccine.name} administered successfully`);
    
    // Verify audit log
    const logs = await getAuditLogs('vaccinated_patient');
    const recentLog = logs.find(log => log.targetId === testPatientId);
    if (recentLog) {
      logSuccess(`Audit log created: "${recentLog.actionDescription}"`);
      return true;
    } else {
      logWarning('Vaccination succeeded but audit log not found');
      return false;
    }
  } else {
    logError(`Vaccination failed: ${result.error}`);
    return false;
  }
}

// 6. Test User Creation
async function testUserCreation() {
  logTest('User Creation Audit');
  
  const timestamp = Date.now();
  const newUser = {
    username: `testuser_${timestamp}`,
    password: 'Test123!',
    firstName: 'Test',
    lastName: `User${timestamp}`,
    email: `testuser${timestamp}@test.com`,
    accessLevel: 'admin',
    role: 'admin',
    contactNumber: '1234567890'
  };
  
  const result = await apiRequest('post', '/auth/register', newUser);
  
  if (result.success) {
    logSuccess(`User ${newUser.firstName} ${newUser.lastName} created successfully`);
    
    // Verify audit log
    const logs = await getAuditLogs('added_new_user');
    const recentLog = logs.find(log => log.actionDescription.includes(newUser.lastName));
    if (recentLog) {
      logSuccess(`Audit log created: "${recentLog.actionDescription}"`);
      
      // Clean up - delete the test user
      if (result.data.user?.id) {
        await apiRequest('delete', `/users/${result.data.user.id}`);
        logSuccess('Test user cleaned up');
      }
      return true;
    } else {
      logWarning('User creation succeeded but audit log not found');
      return false;
    }
  } else {
    logError(`User creation failed: ${result.error}`);
    return false;
  }
}

// 7. Test Checkup Start/Finish
async function testCheckupStartFinish() {
  logTest('Checkup Start/Finish Audit');
  
  if (!testPatientId || !testDoctorId) {
    logWarning('No patient or doctor available, skipping checkup test');
    return false;
  }
  
  // This would require doctor login and queue operations
  // For now, just check if logs exist
  const startLogs = await getAuditLogs('started_checkup');
  const finishLogs = await getAuditLogs('finished_checkup');
  
  if (startLogs.length > 0) {
    logSuccess(`Found ${startLogs.length} checkup start audit logs`);
  }
  
  if (finishLogs.length > 0) {
    logSuccess(`Found ${finishLogs.length} checkup finish audit logs`);
  }
  
  return startLogs.length > 0 || finishLogs.length > 0;
}

// 8. Test Medication Addition
async function testMedicationAddition() {
  logTest('Medication Addition Audit');
  
  const timestamp = Date.now();
  const newMedication = {
    name: `Test Medication ${timestamp}`,
    genericName: 'Test Generic',
    brandName: 'Test Brand',
    category: 'Test Category',
    dosage: '100mg',
    form: 'Tablet',
    strength: '100mg',
    manufacturer: 'Test Manufacturer',
    batchNumber: `TEST-${timestamp}`,
    unitsInStock: 100,
    minimumStock: 20,
    unitCost: 10,
    sellingPrice: 15,
    expiryDate: '2025-12-31',
    status: 'Available',
    isActive: true
  };
  
  const result = await apiRequest('post', '/inventory/medications', newMedication);
  
  if (result.success) {
    testMedicationId = result.data.id;
    logSuccess(`Medication "${newMedication.name}" added successfully`);
    
    // Verify audit log
    const logs = await getAuditLogs('added_new_medication');
    const recentLog = logs.find(log => log.actionDescription.includes(newMedication.name));
    if (recentLog) {
      logSuccess(`Audit log created: "${recentLog.actionDescription}"`);
      return true;
    } else {
      logWarning('Medication addition succeeded but audit log not found');
      return false;
    }
  } else {
    logError(`Medication addition failed: ${result.error}`);
    return false;
  }
}

// 9. Test Vaccine Addition
async function testVaccineAddition() {
  logTest('Vaccine Addition Audit');
  
  const timestamp = Date.now();
  const newVaccine = {
    name: `Test Vaccine ${timestamp}`,
    description: 'Test vaccine for audit trail',
    manufacturer: 'Test Manufacturer',
    category: 'Test',
    batchNumber: `TVAC-${timestamp}`,
    dosesInStock: 50,
    minimumStock: 10,
    unitCost: 25,
    expiryDate: '2025-12-31',
    storageTemp: '2-8°C',
    administrationRoute: 'Intramuscular',
    status: 'Available',
    isActive: true
  };
  
  const result = await apiRequest('post', '/inventory/vaccines', newVaccine);
  
  if (result.success) {
    testVaccineId = result.data.id;
    logSuccess(`Vaccine "${newVaccine.name}" added successfully`);
    
    // Verify audit log
    const logs = await getAuditLogs('added_new_vaccine');
    const recentLog = logs.find(log => log.actionDescription.includes(newVaccine.name));
    if (recentLog) {
      logSuccess(`Audit log created: "${recentLog.actionDescription}"`);
      return true;
    } else {
      logWarning('Vaccine addition succeeded but audit log not found');
      return false;
    }
  } else {
    logError(`Vaccine addition failed: ${result.error}`);
    return false;
  }
}

// 10. Test Stock Addition (Medication Batch)
async function testMedicationStockAddition() {
  logTest('Medication Stock Addition Audit');
  
  if (!testMedicationId) {
    logWarning('No medication available, skipping stock addition test');
    return false;
  }
  
  const timestamp = Date.now();
  const batchData = {
    batchNumber: `BATCH-${timestamp}`,
    quantityReceived: 100,
    unitCost: 10,
    expiryDate: '2025-12-31',
    supplier: 'Test Supplier',
    notes: 'Test batch for audit trail'
  };
  
  const result = await apiRequest('post', `/inventory/medications/${testMedicationId}/batches`, batchData);
  
  if (result.success) {
    logSuccess(`Stock added for medication (100 units, expires 2025-12-31)`);
    
    // Verify audit log
    const logs = await getAuditLogs('added_stocks');
    const recentLog = logs.find(log => log.actionDescription.includes('100'));
    if (recentLog) {
      logSuccess(`Audit log created: "${recentLog.actionDescription}"`);
      return true;
    } else {
      logWarning('Stock addition succeeded but audit log not found');
      return false;
    }
  } else {
    logError(`Stock addition failed: ${result.error}`);
    return false;
  }
}

// 11. Test Stock Addition (Vaccine Batch)
async function testVaccineStockAddition() {
  logTest('Vaccine Stock Addition Audit');
  
  if (!testVaccineId) {
    logWarning('No vaccine available, skipping stock addition test');
    return false;
  }
  
  const timestamp = Date.now();
  const batchData = {
    batchNumber: `VBATCH-${timestamp}`,
    lotNumber: `LOT-${timestamp}`,
    dosesReceived: 50,
    unitCost: 25,
    expiryDate: '2025-12-31',
    manufacturer: 'Test Manufacturer',
    notes: 'Test vaccine batch for audit trail'
  };
  
  const result = await apiRequest('post', `/inventory/vaccines/${testVaccineId}/batches`, batchData);
  
  if (result.success) {
    logSuccess(`Stock added for vaccine (50 doses, expires 2025-12-31)`);
    
    // Verify audit log
    const logs = await getAuditLogs('added_stocks');
    const recentLog = logs.find(log => log.actionDescription.includes('50'));
    if (recentLog) {
      logSuccess(`Audit log created: "${recentLog.actionDescription}"`);
      return true;
    } else {
      logWarning('Stock addition succeeded but audit log not found');
      return false;
    }
  } else {
    logError(`Stock addition failed: ${result.error}`);
    return false;
  }
}

// 12. Test Patient Removal
async function testPatientRemoval() {
  logTest('Patient Removal Audit');
  
  // Create a temporary patient first
  const timestamp = Date.now();
  const tempPatient = {
    firstName: 'Temp',
    lastName: `Patient${timestamp}`,
    dateOfBirth: '2000-01-01',
    gender: 'Male',
    contactNumber: '1234567890',
    address: 'Test Address',
    emergencyContact: '0987654321'
  };
  
  const createResult = await apiRequest('post', '/patients', tempPatient);
  
  if (!createResult.success) {
    logError(`Failed to create temporary patient: ${createResult.error}`);
    return false;
  }
  
  const patientId = createResult.data.patient?.id || createResult.data.id;
  logSuccess(`Temporary patient created (ID: ${patientId})`);
  
  // Now delete it
  const deleteResult = await apiRequest('delete', `/patients/${patientId}`);
  
  if (deleteResult.success) {
    logSuccess(`Patient removed successfully`);
    
    // Verify audit log
    const logs = await getAuditLogs('removed_patient');
    const recentLog = logs.find(log => log.targetId === patientId);
    if (recentLog) {
      logSuccess(`Audit log created: "${recentLog.actionDescription}"`);
      return true;
    } else {
      logWarning('Patient removal succeeded but audit log not found');
      return false;
    }
  } else {
    logError(`Patient removal failed: ${deleteResult.error}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  logSection('🚀 COMPREHENSIVE AUDIT TRAIL TESTING');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  // Login first
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    logError('Failed to login as admin. Cannot proceed with tests.');
    return;
  }
  
  // Run all tests
  const tests = [
    { name: 'Patient Check-in', fn: testPatientCheckIn },
    { name: 'Vital Signs Check', fn: testVitalSignsCheck },
    { name: 'Patient Transfer', fn: testPatientTransfer },
    { name: 'Vaccination', fn: testVaccination },
    { name: 'User Creation', fn: testUserCreation },
    { name: 'Checkup Start/Finish', fn: testCheckupStartFinish },
    { name: 'Medication Addition', fn: testMedicationAddition },
    { name: 'Vaccine Addition', fn: testVaccineAddition },
    { name: 'Medication Stock Addition', fn: testMedicationStockAddition },
    { name: 'Vaccine Stock Addition', fn: testVaccineStockAddition },
    { name: 'Patient Removal', fn: testPatientRemoval }
  ];
  
  for (const test of tests) {
    results.total++;
    try {
      const result = await test.fn();
      if (result === true) {
        results.passed++;
      } else if (result === false) {
        results.failed++;
      } else {
        results.skipped++;
      }
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logError(`Test "${test.name}" threw an error: ${error.message}`);
      results.failed++;
    }
  }
  
  // Display results
  logSection('📊 TEST RESULTS SUMMARY');
  console.log(`\nTotal Tests: ${results.total}`);
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }
  if (results.skipped > 0) {
    logWarning(`Skipped: ${results.skipped}`);
  }
  
  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${successRate}%`);
  
  // Display recent audit logs
  await displayRecentAuditLogs(10);
  
  logSection('✨ TESTING COMPLETE');
  
  // Note about report creation
  log('\n📝 NOTE: Report creation audit is not tested because reports are currently', 'yellow');
  log('   stored in localStorage only and do not have a backend API endpoint.', 'yellow');
}

// Run the tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
