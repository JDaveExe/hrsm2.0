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

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${message} ===${colors.reset}`);
}

// Update items with 2026 dates to 2027
async function extendExpirationDates() {
  logHeader('EXTENDING EXPIRATION DATES TO 2027');
  console.log('Updating items with 2026-03-29 expiration dates to 2027-12-31 for extended testing...\n');
  
  const results = {
    medications: { updated: [], errors: [] },
    vaccines: { updated: [], errors: [] }
  };
  
  try {
    // Update medications
    logInfo('Checking and updating medications...');
    const medicationsResponse = await axios.get(`${BASE_URL}/api/inventory/medications`);
    const medications = medicationsResponse.data || [];
    
    const medicationsToUpdate = medications.filter(med => 
      med.expiryDate === '2026-03-29'
    );
    
    console.log(`Found ${medicationsToUpdate.length} medications with 2026-03-29 expiration date`);
    
    for (const med of medicationsToUpdate) {
      try {
        const updateResponse = await axios.put(`${BASE_URL}/api/inventory/medications/${med.id}`, {
          ...med,
          expiryDate: '2027-12-31'
        });
        
        if (updateResponse.status === 200) {
          logSuccess(`Extended ${med.name}: 2026-03-29 → 2027-12-31`);
          results.medications.updated.push(med.name);
        }
      } catch (error) {
        logError(`Failed to update ${med.name}: ${error.message}`);
        results.medications.errors.push(med.name);
      }
    }
    
    // Update vaccines
    logInfo('Checking and updating vaccines...');
    const vaccinesResponse = await axios.get(`${BASE_URL}/api/inventory/vaccines`);
    const vaccines = vaccinesResponse.data || [];
    
    const vaccinesToUpdate = vaccines.filter(vaccine => 
      vaccine.expiryDate === '2026-03-29'
    );
    
    console.log(`Found ${vaccinesToUpdate.length} vaccines with 2026-03-29 expiration date`);
    
    for (const vaccine of vaccinesToUpdate) {
      try {
        const updateResponse = await axios.put(`${BASE_URL}/api/inventory/vaccines/${vaccine.id}`, {
          ...vaccine,
          expiryDate: '2027-12-31'
        });
        
        if (updateResponse.status === 200) {
          logSuccess(`Extended ${vaccine.name}: 2026-03-29 → 2027-12-31`);
          results.vaccines.updated.push(vaccine.name);
        }
      } catch (error) {
        logError(`Failed to update ${vaccine.name}: ${error.message}`);
        results.vaccines.errors.push(vaccine.name);
      }
    }
    
    return results;
    
  } catch (error) {
    logError(`Error extending expiration dates: ${error.message}`);
    return results;
  }
}

// Main function
async function extendInventoryDates() {
  logHeader('INVENTORY EXPIRATION DATE EXTENSION TO 2027');
  console.log('Extending expiration dates from March 2026 to December 2027 for long-term testing...\n');
  
  const results = await extendExpirationDates();
  
  // Display results
  logHeader('EXTENSION RESULTS');
  
  const totalUpdated = results.medications.updated.length + results.vaccines.updated.length;
  const totalErrors = results.medications.errors.length + results.vaccines.errors.length;
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`  ✅ Successfully updated: ${totalUpdated} items`);
  console.log(`  ❌ Errors: ${totalErrors} items`);
  console.log(`  📅 New expiration date: December 31, 2027`);
  console.log(`  ⏰ Extended testing period: Over 2 years from now!`);
  
  if (results.medications.updated.length > 0) {
    console.log(`\n📋 Updated ${results.medications.updated.length} medications:`);
    results.medications.updated.slice(0, 5).forEach(name => {
      console.log(`    ✅ ${name}`);
    });
    if (results.medications.updated.length > 5) {
      console.log(`    ... and ${results.medications.updated.length - 5} more`);
    }
  }
  
  if (results.vaccines.updated.length > 0) {
    console.log(`\n💉 Updated ${results.vaccines.updated.length} vaccines:`);
    results.vaccines.updated.slice(0, 5).forEach(name => {
      console.log(`    ✅ ${name}`);
    });
    if (results.vaccines.updated.length > 5) {
      console.log(`    ... and ${results.vaccines.updated.length - 5} more`);
    }
  }
  
  if (totalErrors > 0) {
    console.log(`\n⚠️ Items that couldn't be updated:`);
    [...results.medications.errors, ...results.vaccines.errors].forEach(name => {
      console.log(`    ❌ ${name}`);
    });
  }
  
  if (totalUpdated > 0) {
    logHeader('SUCCESS!');
    logSuccess('🎉 Expiration dates extended to 2027!');
    console.log('\nBenefits of the 2027 expiration date:');
    console.log('  📅 Over 2 years of testing time');
    console.log('  🧪 No need to worry about items expiring during development');
    console.log('  💉 All vaccines will remain available for vaccination testing');
    console.log('  📋 All medications will show valid dates in management interface');
    console.log('  🔄 Long-term testing scenarios possible');
    
    console.log('\nNext steps:');
    console.log('  1. Refresh your management dashboard');
    console.log('  2. Verify all items now show December 31, 2027');
    console.log('  3. Enjoy extended testing without expiration concerns!');
  } else {
    logInfo('No items needed date extension (they may already have different dates).');
  }
}

// Run the extension
if (require.main === module) {
  extendInventoryDates().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { extendInventoryDates, extendExpirationDates };