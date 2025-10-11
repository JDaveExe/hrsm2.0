const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test configuration
const TEST_CONFIG = {
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
};

// Test utilities
const api = axios.create(TEST_CONFIG);

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${message} ===${colors.reset}`);
}

// Test data
const TEST_PATIENTS = [
  {
    id: 'temp_test_patient_1',
    firstName: 'John',
    lastName: 'Duplicate',
    dateOfBirth: '1990-01-01',
    gender: 'Male',
    contactNumber: '123-456-7890',
    email: 'john.duplicate@test.com'
  },
  {
    id: 'temp_test_patient_2', 
    firstName: 'Jane',
    lastName: 'Double',
    dateOfBirth: '1995-05-15',
    gender: 'Female',
    contactNumber: '098-765-4321',
    email: 'jane.double@test.com'
  }
];

// Database cleanup function
async function cleanupTestData() {
  logHeader('Cleaning up test data');
  
  try {
    // Clean up check-in sessions for test patients
    for (const patient of TEST_PATIENTS) {
      try {
        await api.delete(`/api/checkups/today/${patient.id}`);
        logInfo(`Cleaned checkups for patient ${patient.id}`);
      } catch (error) {
        // Ignore 404 errors (patient not found)
        if (error.response?.status !== 404) {
          logWarning(`Warning cleaning checkups for patient ${patient.id}: ${error.message}`);
        }
      }
    }

    // Clean up temporary patients
    for (const patient of TEST_PATIENTS) {
      try {
        await api.delete(`/api/patients/${patient.id}`);
        logInfo(`Cleaned patient ${patient.id}`);
      } catch (error) {
        // Ignore 404 errors (patient not found)
        if (error.response?.status !== 404) {
          logWarning(`Warning cleaning patient ${patient.id}: ${error.message}`);
        }
      }
    }

    logSuccess('Test data cleanup completed');
  } catch (error) {
    logError(`Cleanup error: ${error.message}`);
  }
}

// Create temporary test patients
async function createTestPatients() {
  logHeader('Creating temporary test patients');
  
  const createdPatients = [];
  
  for (const patientData of TEST_PATIENTS) {
    try {
      const response = await api.post('/api/patients', patientData);
      const patient = response.data.patient || response.data;
      createdPatients.push(patient);
      logSuccess(`Created patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
    } catch (error) {
      logError(`Failed to create patient ${patientData.firstName}: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }
  
  return createdPatients;
}

// Test scenarios
async function testStaffDuplicatePrevention(patient) {
  logHeader(`Test Staff Check-in Duplicate Prevention - ${patient.firstName} ${patient.lastName}`);
  
  try {
    // First check-in attempt - should succeed
    logInfo('Attempting first staff check-in...');
    const firstResponse = await api.post('/api/checkups/check-in', {
      patientId: patient.id,
      serviceType: 'General Checkup',
      priority: 'Normal',
      notes: 'First check-in test',
      checkInMethod: 'staff-assisted'
    });
    
    if (firstResponse.status === 201) {
      logSuccess('First staff check-in successful');
      console.log('  Response:', firstResponse.data.message);
    } else {
      logError(`Unexpected status for first check-in: ${firstResponse.status}`);
      return false;
    }
    
    // Wait a moment to ensure timestamp differences
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Second check-in attempt - should fail with 409
    logInfo('Attempting duplicate staff check-in...');
    try {
      const secondResponse = await api.post('/api/checkups/check-in', {
        patientId: patient.id,
        serviceType: 'Follow-up',
        priority: 'High',
        notes: 'Duplicate check-in test',
        checkInMethod: 'staff-assisted'
      });
      
      logError('Duplicate check-in was allowed when it should have been prevented!');
      console.log('  Unexpected response:', secondResponse.data);
      return false;
      
    } catch (error) {
      if (error.response?.status === 409) {
        logSuccess('Duplicate staff check-in properly prevented');
        console.log('  Error message:', error.response.data.error);
        if (error.response.data.existingSession) {
          console.log('  Existing session info:', error.response.data.existingSession);
        }
        return true;
      } else {
        logError(`Unexpected error status: ${error.response?.status || 'Network error'}`);
        console.log('  Error:', error.response?.data || error.message);
        return false;
      }
    }
    
  } catch (error) {
    logError(`Staff duplicate test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testQRDuplicatePrevention(patient) {
  logHeader(`Test QR Check-in Duplicate Prevention - ${patient.firstName} ${patient.lastName}`);
  
  try {
    // First QR check-in attempt - should succeed
    logInfo('Attempting first QR check-in...');
    const firstResponse = await api.post('/api/checkups/qr-checkin', {
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      serviceType: 'General Checkup',
      priority: 'Normal',
      checkInMethod: 'qr-scan'
    });
    
    if (firstResponse.status === 201) {
      logSuccess('First QR check-in successful');
      console.log('  Response:', firstResponse.data.message);
    } else {
      logError(`Unexpected status for first QR check-in: ${firstResponse.status}`);
      return false;
    }
    
    // Wait a moment to ensure timestamp differences
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Second QR check-in attempt - should fail with 409
    logInfo('Attempting duplicate QR check-in...');
    try {
      const secondResponse = await api.post('/api/checkups/qr-checkin', {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        serviceType: 'Emergency',
        priority: 'High',
        checkInMethod: 'qr-scan'
      });
      
      logError('Duplicate QR check-in was allowed when it should have been prevented!');
      console.log('  Unexpected response:', secondResponse.data);
      return false;
      
    } catch (error) {
      if (error.response?.status === 409) {
        logSuccess('Duplicate QR check-in properly prevented');
        console.log('  Error message:', error.response.data.error);
        if (error.response.data.existingSession) {
          console.log('  Existing session info:', error.response.data.existingSession);
        }
        return true;
      } else {
        logError(`Unexpected error status: ${error.response?.status || 'Network error'}`);
        console.log('  Error:', error.response?.data || error.message);
        return false;
      }
    }
    
  } catch (error) {
    logError(`QR duplicate test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCrossMethodDuplicatePrevention(patient) {
  logHeader(`Test Cross-Method Duplicate Prevention - ${patient.firstName} ${patient.lastName}`);
  
  try {
    // Staff check-in first
    logInfo('Attempting staff check-in first...');
    const staffResponse = await api.post('/api/checkups/check-in', {
      patientId: patient.id,
      serviceType: 'General Checkup',
      priority: 'Normal',
      notes: 'Staff check-in first',
      checkInMethod: 'staff-assisted'
    });
    
    if (staffResponse.status === 201) {
      logSuccess('Staff check-in successful');
    } else {
      logError(`Unexpected status for staff check-in: ${staffResponse.status}`);
      return false;
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Then attempt QR check-in - should fail
    logInfo('Attempting QR check-in after staff check-in...');
    try {
      const qrResponse = await api.post('/api/checkups/qr-checkin', {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        serviceType: 'Follow-up',
        priority: 'High',
        checkInMethod: 'qr-scan'
      });
      
      logError('QR check-in after staff check-in was allowed when it should have been prevented!');
      console.log('  Unexpected response:', qrResponse.data);
      return false;
      
    } catch (error) {
      if (error.response?.status === 409) {
        logSuccess('Cross-method duplicate prevention working (Staff → QR blocked)');
        console.log('  Error message:', error.response.data.error);
        return true;
      } else {
        logError(`Unexpected error status: ${error.response?.status || 'Network error'}`);
        console.log('  Error:', error.response?.data || error.message);
        return false;
      }
    }
    
  } catch (error) {
    logError(`Cross-method duplicate test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testEdgeCases() {
  logHeader('Testing Edge Cases');
  
  try {
    // Test with non-existent patient
    logInfo('Testing check-in with non-existent patient...');
    try {
      await api.post('/api/checkups/check-in', {
        patientId: 99999,
        serviceType: 'General Checkup',
        priority: 'Normal',
        checkInMethod: 'staff-assisted'
      });
      
      logError('Check-in with non-existent patient was allowed!');
      return false;
      
    } catch (error) {
      if (error.response?.status === 404) {
        logSuccess('Non-existent patient properly rejected');
      } else {
        logError(`Unexpected error for non-existent patient: ${error.response?.status}`);
        return false;
      }
    }
    
    // Test QR with invalid patient name
    logInfo('Testing QR check-in with mismatched patient name...');
    const testPatient = TEST_PATIENTS[0];
    try {
      await api.post('/api/checkups/qr-checkin', {
        patientId: testPatient.id,
        patientName: 'Wrong Name',
        serviceType: 'General Checkup',
        priority: 'Normal',
        checkInMethod: 'qr-scan'
      });
      
      logError('QR check-in with wrong name was allowed!');
      return false;
      
    } catch (error) {
      if (error.response?.status === 400) {
        logSuccess('QR check-in with wrong name properly rejected');
      } else {
        logError(`Unexpected error for wrong name: ${error.response?.status}`);
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    logError(`Edge case testing failed: ${error.message}`);
    return false;
  }
}

async function getTodaysCheckups() {
  try {
    const response = await api.get('/api/checkups/today');
    return response.data;
  } catch (error) {
    logError(`Failed to get today's checkups: ${error.message}`);
    return [];
  }
}

// Main test execution
async function runTests() {
  logHeader('CHECKUP DUPLICATE PREVENTION TEST SUITE');
  console.log('Testing both staff-assisted and QR check-in duplicate prevention\n');
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  try {
    // Cleanup before starting
    await cleanupTestData();
    
    // Create test patients
    const patients = await createTestPatients();
    
    if (patients.length === 0) {
      logError('No test patients created. Aborting tests.');
      return;
    }
    
    // Show initial state
    logHeader('Initial State Check');
    const initialCheckups = await getTodaysCheckups();
    logInfo(`Current checkups count: ${initialCheckups.length}`);
    
    // Run tests
    const tests = [
      { name: 'Staff Duplicate Prevention', func: () => testStaffDuplicatePrevention(patients[0]) },
      { name: 'QR Duplicate Prevention', func: () => testQRDuplicatePrevention(patients[1]) },
      { name: 'Cross-Method Prevention', func: () => testCrossMethodDuplicatePrevention(patients[0]) },
      { name: 'Edge Cases', func: testEdgeCases }
    ];
    
    for (const test of tests) {
      testResults.total++;
      logHeader(`Running: ${test.name}`);
      
      try {
        const result = await test.func();
        if (result) {
          testResults.passed++;
          logSuccess(`${test.name} PASSED`);
        } else {
          testResults.failed++;
          logError(`${test.name} FAILED`);
        }
      } catch (error) {
        testResults.failed++;
        logError(`${test.name} FAILED with exception: ${error.message}`);
      }
      
      console.log(''); // Add spacing between tests
    }
    
    // Show final state
    logHeader('Final State Check');
    const finalCheckups = await getTodaysCheckups();
    logInfo(`Final checkups count: ${finalCheckups.length}`);
    
    // Clean up after tests
    await cleanupTestData();
    
  } catch (error) {
    logError(`Test suite failed: ${error.message}`);
    testResults.failed = testResults.total || 1;
  }
  
  // Results summary
  logHeader('TEST RESULTS SUMMARY');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Success Rate: ${testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0}%`);
  
  if (testResults.failed === 0) {
    logSuccess('\n🎉 All tests passed! Duplicate prevention is working correctly.');
  } else {
    logError('\n❌ Some tests failed. Please review the duplicate prevention implementation.');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT. Cleaning up test data...');
  await cleanupTestData();
  process.exit(0);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await cleanupTestData();
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runTests().catch(async (error) => {
    console.error('Fatal error:', error);
    await cleanupTestData();
    process.exit(1);
  });
}

module.exports = {
  runTests,
  cleanupTestData,
  createTestPatients,
  testStaffDuplicatePrevention,
  testQRDuplicatePrevention,
  testCrossMethodDuplicatePrevention,
  testEdgeCases
};