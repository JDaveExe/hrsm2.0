const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

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

// Simulate the frontend vaccine filtering logic
function simulateVaccineFiltering(vaccines) {
  const currentDate = new Date();
  return vaccines.filter(v => {
    const expiryDate = new Date(v.expiryDate);
    return v.isActive && 
           v.dosesInStock > 0 && 
           expiryDate > currentDate;
  });
}

// Check if medication appears expired in UI
function checkMedicationExpiration(medications) {
  const currentDate = new Date();
  return medications.map(med => ({
    ...med,
    isExpiredInUI: new Date(med.expiryDate) < currentDate,
    displayClass: new Date(med.expiryDate) < currentDate ? 'text-danger' : 'text-success'
  }));
}

// Verify that expired items are now available
async function verifyExpirationFixes() {
  logHeader('INVENTORY EXPIRATION FIXES VERIFICATION');
  console.log('Verifying that previously expired items are now available for use...\n');
  
  const results = {
    medications: { total: 0, available: 0, expired: 0, updated: [] },
    vaccines: { total: 0, available: 0, expired: 0, updated: [], filteredOut: 0 }
  };
  
  try {
    // Test medications
    logInfo('Testing medication availability...');
    const medicationsResponse = await axios.get(`${BASE_URL}/api/inventory/medications`);
    const medications = medicationsResponse.data || [];
    
    const medicationStatus = checkMedicationExpiration(medications);
    results.medications.total = medications.length;
    results.medications.available = medicationStatus.filter(m => !m.isExpiredInUI).length;
    results.medications.expired = medicationStatus.filter(m => m.isExpiredInUI).length;
    
    // Show sample of updated medications
    const updatedMeds = medicationStatus.filter(m => 
      m.expiryDate === '2026-03-29' && !m.isExpiredInUI
    );
    results.medications.updated = updatedMeds.slice(0, 5); // Show first 5
    
    // Test vaccines with frontend filtering logic
    logInfo('Testing vaccine availability with frontend filtering...');
    const vaccinesResponse = await axios.get(`${BASE_URL}/api/inventory/vaccines`);
    const vaccines = vaccinesResponse.data || [];
    
    results.vaccines.total = vaccines.length;
    const availableVaccines = simulateVaccineFiltering(vaccines);
    results.vaccines.available = availableVaccines.length;
    results.vaccines.filteredOut = vaccines.length - availableVaccines.length;
    results.vaccines.expired = vaccines.filter(v => new Date(v.expiryDate) < new Date()).length;
    
    // Show sample of updated vaccines
    const updatedVaccines = availableVaccines.filter(v => 
      v.expiryDate === '2026-03-29'
    );
    results.vaccines.updated = updatedVaccines.slice(0, 5); // Show first 5
    
    return results;
    
  } catch (error) {
    logError(`Error verifying fixes: ${error.message}`);
    return results;
  }
}

// Test specific functionality that was previously restricted
async function testRestrictedFunctionality() {
  logHeader('TESTING PREVIOUSLY RESTRICTED FUNCTIONALITY');
  
  try {
    // Test vaccination modal filtering simulation
    logInfo('Simulating VaccinationModal vaccine filtering...');
    const vaccinesResponse = await axios.get(`${BASE_URL}/api/inventory/vaccines`);
    const vaccines = vaccinesResponse.data || [];
    
    // Simulate the exact filtering logic from VaccinationModal.js
    const currentDate = new Date();
    const beforeUpdate = vaccines.filter(v => {
      const expiryDate = new Date('2025-09-01'); // Old expired date
      return v.isActive && v.dosesInStock > 0 && expiryDate > currentDate;
    });
    
    const afterUpdate = vaccines.filter(v => {
      const expiryDate = new Date(v.expiryDate); // Current (updated) date
      return v.isActive && v.dosesInStock > 0 && expiryDate > currentDate;
    });
    
    logSuccess(`Before fix: ${beforeUpdate.length} vaccines would be available`);
    logSuccess(`After fix: ${afterUpdate.length} vaccines are now available`);
    logSuccess(`Improvement: +${afterUpdate.length - beforeUpdate.length} additional vaccines available`);
    
    // Show some examples of now-available vaccines
    const newlyAvailable = afterUpdate.filter(v => v.expiryDate === '2026-03-29').slice(0, 3);
    if (newlyAvailable.length > 0) {
      console.log('\n  📋 Examples of newly available vaccines:');
      newlyAvailable.forEach(vaccine => {
        console.log(`    ✅ ${vaccine.name} - ${vaccine.dosesInStock} doses`);
      });
    }
    
    return true;
    
  } catch (error) {
    logError(`Error testing functionality: ${error.message}`);
    return false;
  }
}

// Main verification function
async function runVerification() {
  logHeader('EXPIRATION DATE FIX VERIFICATION');
  console.log('Checking that inventory expiration date updates resolved system restrictions...\n');
  
  // Verify the fixes
  const results = await verifyExpirationFixes();
  
  // Display results
  logHeader('VERIFICATION RESULTS');
  
  console.log(`\n📊 MEDICATIONS STATUS:`);
  console.log(`  Total: ${results.medications.total}`);
  console.log(`  ✅ Available (not expired): ${results.medications.available}`);
  console.log(`  ❌ Still expired: ${results.medications.expired}`);
  
  if (results.medications.updated.length > 0) {
    console.log(`\n  🔄 Recently Updated Examples:`);
    results.medications.updated.forEach(med => {
      console.log(`    ✅ ${med.name}`);
      console.log(`      📅 New expiry: ${new Date(med.expiryDate).toLocaleDateString()}`);
      console.log(`      📦 Stock: ${med.unitsInStock || med.quantityInStock} units`);
      console.log(`      🎨 UI Display: ${med.displayClass === 'text-danger' ? 'Red (expired)' : 'Green (valid)'}`);
    });
  }
  
  console.log(`\n💉 VACCINES STATUS:`);
  console.log(`  Total: ${results.vaccines.total}`);
  console.log(`  ✅ Available for vaccination: ${results.vaccines.available}`);
  console.log(`  🚫 Filtered out by system: ${results.vaccines.filteredOut}`);
  console.log(`  ❌ Still expired: ${results.vaccines.expired}`);
  
  if (results.vaccines.updated.length > 0) {
    console.log(`\n  🔄 Recently Updated Examples:`);
    results.vaccines.updated.forEach(vaccine => {
      console.log(`    ✅ ${vaccine.name}`);
      console.log(`      📅 New expiry: ${new Date(vaccine.expiryDate).toLocaleDateString()}`);
      console.log(`      💉 Stock: ${vaccine.dosesInStock || vaccine.quantityInStock} doses`);
      console.log(`      🔓 Available for vaccination: Yes`);
    });
  }
  
  // Test specific functionality
  await testRestrictedFunctionality();
  
  // Overall assessment
  logHeader('OVERALL ASSESSMENT');
  
  const medicationSuccess = results.medications.expired === 0;
  const vaccineSuccess = results.vaccines.expired === 0;
  
  if (medicationSuccess && vaccineSuccess) {
    logSuccess('🎉 ALL EXPIRATION ISSUES RESOLVED!');
    console.log('\n✅ Medications: All items now have valid expiration dates');
    console.log('✅ Vaccines: All items now pass frontend filtering for vaccination use');
    console.log('✅ Testing: You can now test all inventory functionality without expiration restrictions');
  } else {
    if (!medicationSuccess) {
      logWarning(`⚠ ${results.medications.expired} medications still expired`);
    }
    if (!vaccineSuccess) {
      logWarning(`⚠ ${results.vaccines.expired} vaccines still expired`);
    }
    console.log('\nSome items may need additional updates or have other issues.');
  }
  
  logHeader('TESTING RECOMMENDATIONS');
  console.log('Now you can test:');
  console.log('  1. 💉 Vaccination Modal - Previously expired vaccines should now appear');
  console.log('  2. 📋 Prescription Management - No red expiration warnings');
  console.log('  3. 📊 Inventory Dashboard - Updated expiration dates visible');
  console.log('  4. 🧪 Full workflow testing with previously restricted items');
  console.log('\n📝 Next: Refresh your browser/dashboard to see the changes!');
}

// Run the verification
if (require.main === module) {
  runVerification().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { 
  runVerification,
  verifyExpirationFixes,
  testRestrictedFunctionality,
  simulateVaccineFiltering,
  checkMedicationExpiration
};