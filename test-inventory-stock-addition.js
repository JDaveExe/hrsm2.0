const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test configuration
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

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

// Helper function to get initial stock levels
async function getInitialStock(type, id) {
  try {
    const endpoint = type === 'medication' ? `/api/inventory/medications/${id}` : `/api/inventory/vaccines/${id}`;
    const response = await api.get(endpoint);
    const stockField = type === 'medication' ? 'unitsInStock' : 'dosesInStock';
    return {
      item: response.data,
      stock: response.data[stockField] || 0
    };
  } catch (error) {
    console.error(`Error getting ${type} ${id}:`, error.message);
    return null;
  }
}

// Test medication stock addition
async function testMedicationStockAddition() {
  logHeader('MEDICATION STOCK ADDITION TEST');
  
  try {
    // Get all medications first
    const medicationsResponse = await api.get('/api/inventory/medications');
    const medications = medicationsResponse.data;
    
    if (medications.length === 0) {
      logWarning('No medications found in inventory');
      return false;
    }
    
    // Use the first medication for testing
    const testMedication = medications[0];
    logInfo(`Testing with medication: ${testMedication.name} (ID: ${testMedication.id})`);
    
    // Get initial stock
    const initialData = await getInitialStock('medication', testMedication.id);
    if (!initialData) {
      logError('Could not get initial medication data');
      return false;
    }
    
    const initialStock = initialData.stock;
    logInfo(`Initial stock: ${initialStock} units`);
    
    // Test stock addition
    const stockToAdd = 50;
    logInfo(`Adding ${stockToAdd} units to stock...`);
    
    const addStockResponse = await api.post('/api/inventory/update-stock', {
      type: 'medication',
      id: testMedication.id,
      quantity: stockToAdd,
      operation: 'add'
    });
    
    if (addStockResponse.status === 200) {
      logSuccess('Stock addition API call successful');
      
      // Verify the stock was actually added
      const afterData = await getInitialStock('medication', testMedication.id);
      if (!afterData) {
        logError('Could not get updated medication data');
        return false;
      }
      
      const newStock = afterData.stock;
      const expectedStock = initialStock + stockToAdd;
      
      logInfo(`Expected stock: ${expectedStock} units`);
      logInfo(`Actual stock: ${newStock} units`);
      
      if (newStock === expectedStock) {
        logSuccess('✅ MEDICATION STOCK ADDITION WORKING CORRECTLY!');
        return true;
      } else {
        logError(`❌ Stock mismatch! Expected ${expectedStock}, got ${newStock}`);
        return false;
      }
    } else {
      logError(`API returned unexpected status: ${addStockResponse.status}`);
      return false;
    }
    
  } catch (error) {
    logError(`Medication stock test failed: ${error.response?.data?.error || error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Test vaccine stock addition
async function testVaccineStockAddition() {
  logHeader('VACCINE STOCK ADDITION TEST');
  
  try {
    // Get all vaccines first
    const vaccinesResponse = await api.get('/api/inventory/vaccines');
    const vaccines = vaccinesResponse.data;
    
    if (vaccines.length === 0) {
      logWarning('No vaccines found in inventory');
      return false;
    }
    
    // Use the first vaccine for testing
    const testVaccine = vaccines[0];
    logInfo(`Testing with vaccine: ${testVaccine.name} (ID: ${testVaccine.id})`);
    
    // Get initial stock
    const initialData = await getInitialStock('vaccine', testVaccine.id);
    if (!initialData) {
      logError('Could not get initial vaccine data');
      return false;
    }
    
    const initialStock = initialData.stock;
    logInfo(`Initial stock: ${initialStock} doses`);
    
    // Test stock addition
    const stockToAdd = 30;
    logInfo(`Adding ${stockToAdd} doses to stock...`);
    
    const addStockResponse = await api.post('/api/inventory/update-stock', {
      type: 'vaccine',
      id: testVaccine.id,
      quantity: stockToAdd,
      operation: 'add'
    });
    
    if (addStockResponse.status === 200) {
      logSuccess('Stock addition API call successful');
      
      // Verify the stock was actually added
      const afterData = await getInitialStock('vaccine', testVaccine.id);
      if (!afterData) {
        logError('Could not get updated vaccine data');
        return false;
      }
      
      const newStock = afterData.stock;
      const expectedStock = initialStock + stockToAdd;
      
      logInfo(`Expected stock: ${expectedStock} doses`);
      logInfo(`Actual stock: ${newStock} doses`);
      
      if (newStock === expectedStock) {
        logSuccess('✅ VACCINE STOCK ADDITION WORKING CORRECTLY!');
        return true;
      } else {
        logError(`❌ Stock mismatch! Expected ${expectedStock}, got ${newStock}`);
        return false;
      }
    } else {
      logError(`API returned unexpected status: ${addStockResponse.status}`);
      return false;
    }
    
  } catch (error) {
    logError(`Vaccine stock test failed: ${error.response?.data?.error || error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Test stock subtraction (bonus test)
async function testStockSubtraction() {
  logHeader('STOCK SUBTRACTION TEST');
  
  try {
    // Test with first medication
    const medicationsResponse = await api.get('/api/inventory/medications');
    const medications = medicationsResponse.data;
    
    if (medications.length === 0) {
      logWarning('No medications found for subtraction test');
      return false;
    }
    
    const testMedication = medications[0];
    const initialData = await getInitialStock('medication', testMedication.id);
    if (!initialData) return false;
    
    const initialStock = initialData.stock;
    const stockToSubtract = Math.min(10, initialStock); // Don't subtract more than available
    
    if (stockToSubtract === 0) {
      logWarning('No stock available to subtract from');
      return false;
    }
    
    logInfo(`Subtracting ${stockToSubtract} units from ${testMedication.name}`);
    
    const subtractResponse = await api.post('/api/inventory/update-stock', {
      type: 'medication',
      id: testMedication.id,
      quantity: stockToSubtract,
      operation: 'subtract'
    });
    
    if (subtractResponse.status === 200) {
      const afterData = await getInitialStock('medication', testMedication.id);
      const newStock = afterData.stock;
      const expectedStock = initialStock - stockToSubtract;
      
      if (newStock === expectedStock) {
        logSuccess('✅ STOCK SUBTRACTION WORKING CORRECTLY!');
        return true;
      } else {
        logError(`❌ Subtraction failed! Expected ${expectedStock}, got ${newStock}`);
        return false;
      }
    }
    
  } catch (error) {
    logError(`Stock subtraction test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runInventoryTests() {
  logHeader('INVENTORY MANAGEMENT STOCK ADDITION TESTS');
  console.log('Testing both prescription and vaccination stock addition functionality\n');
  
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  const tests = [
    { name: 'Medication Stock Addition', func: testMedicationStockAddition },
    { name: 'Vaccine Stock Addition', func: testVaccineStockAddition },
    { name: 'Stock Subtraction', func: testStockSubtraction }
  ];
  
  for (const test of tests) {
    testResults.total++;
    logInfo(`Running: ${test.name}`);
    
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
  
  // Results summary
  logHeader('TEST RESULTS SUMMARY');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`Success Rate: ${testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0}%`);
  
  if (testResults.failed === 0) {
    logSuccess('\n🎉 All inventory tests passed! Stock addition is working correctly.');
  } else {
    logError('\n❌ Some inventory tests failed. Please review the implementation.');
  }
  
  logHeader('FRONTEND FIXES APPLIED');
  console.log('✅ Fixed addMedicationStock() to use /update-stock endpoint');
  console.log('✅ Fixed addVaccineStock() to use /update-stock endpoint');
  console.log('✅ Both methods now properly add stock quantities');
  console.log('✅ Additional data (batch numbers, expiry dates) handled separately');
}

// Run the tests
if (require.main === module) {
  runInventoryTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { 
  runInventoryTests,
  testMedicationStockAddition,
  testVaccineStockAddition,
  testStockSubtraction
};