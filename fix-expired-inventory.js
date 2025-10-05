const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

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

// Helper function to check if item is expired
function isExpired(expiryDate) {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const today = new Date();
  return expiry < today;
}

// Helper function to generate new expiration date (set to 2027 for long-term testing)
function generateNewExpiryDate() {
  // Set to December 31, 2027 for extended testing period
  return '2027-12-31';
}

// Check for expired items in inventory
async function checkExpiredItems() {
  logHeader('EXPIRED INVENTORY ITEMS CHECK');
  
  const results = {
    medications: { total: 0, expired: [], available: [] },
    vaccines: { total: 0, expired: [], available: [] }
  };
  
  try {
    // Check medications
    logInfo('Checking medications...');
    const medicationsResponse = await axios.get(`${BASE_URL}/api/inventory/medications`);
    const medications = medicationsResponse.data || [];
    
    results.medications.total = medications.length;
    
    medications.forEach(med => {
      if (isExpired(med.expiryDate)) {
        results.medications.expired.push({
          id: med.id,
          name: med.name,
          expiryDate: med.expiryDate,
          stock: med.unitsInStock || med.quantityInStock || 0
        });
      } else {
        results.medications.available.push({
          id: med.id,
          name: med.name,
          expiryDate: med.expiryDate,
          stock: med.unitsInStock || med.quantityInStock || 0
        });
      }
    });
    
    // Check vaccines
    logInfo('Checking vaccines...');
    const vaccinesResponse = await axios.get(`${BASE_URL}/api/inventory/vaccines`);
    const vaccines = vaccinesResponse.data || [];
    
    results.vaccines.total = vaccines.length;
    
    vaccines.forEach(vaccine => {
      if (isExpired(vaccine.expiryDate)) {
        results.vaccines.expired.push({
          id: vaccine.id,
          name: vaccine.name,
          expiryDate: vaccine.expiryDate,
          stock: vaccine.dosesInStock || vaccine.quantityInStock || 0
        });
      } else {
        results.vaccines.available.push({
          id: vaccine.id,
          name: vaccine.name,
          expiryDate: vaccine.expiryDate,
          stock: vaccine.dosesInStock || vaccine.quantityInStock || 0
        });
      }
    });
    
    return results;
    
  } catch (error) {
    logError(`Error checking expired items: ${error.message}`);
    return results;
  }
}

// Update expiration dates for expired items
async function updateExpiredItems(expiredItems) {
  logHeader('UPDATING EXPIRED ITEM DATES');
  
  const updatedItems = {
    medications: [],
    vaccines: []
  };
  
  // Update medications
  if (expiredItems.medications.expired.length > 0) {
    logInfo(`Updating ${expiredItems.medications.expired.length} expired medications...`);
    
    for (const med of expiredItems.medications.expired) {
      try {
        const newExpiryDate = generateNewExpiryDate();
        
        // Get current medication data
        const currentResponse = await axios.get(`${BASE_URL}/api/inventory/medications/${med.id}`);
        const currentMed = currentResponse.data;
        
        // Update with new expiry date
        const updateResponse = await axios.put(`${BASE_URL}/api/inventory/medications/${med.id}`, {
          ...currentMed,
          expiryDate: newExpiryDate
        });
        
        if (updateResponse.status === 200) {
          logSuccess(`Updated ${med.name}: ${med.expiryDate} → ${newExpiryDate}`);
          updatedItems.medications.push({
            ...med,
            oldExpiryDate: med.expiryDate,
            newExpiryDate: newExpiryDate
          });
        }
        
      } catch (error) {
        logError(`Failed to update ${med.name}: ${error.message}`);
      }
    }
  }
  
  // Update vaccines
  if (expiredItems.vaccines.expired.length > 0) {
    logInfo(`Updating ${expiredItems.vaccines.expired.length} expired vaccines...`);
    
    for (const vaccine of expiredItems.vaccines.expired) {
      try {
        const newExpiryDate = generateNewExpiryDate();
        
        // Get current vaccine data
        const currentResponse = await axios.get(`${BASE_URL}/api/inventory/vaccines/${vaccine.id}`);
        const currentVaccine = currentResponse.data;
        
        // Update with new expiry date
        const updateResponse = await axios.put(`${BASE_URL}/api/inventory/vaccines/${vaccine.id}`, {
          ...currentVaccine,
          expiryDate: newExpiryDate
        });
        
        if (updateResponse.status === 200) {
          logSuccess(`Updated ${vaccine.name}: ${vaccine.expiryDate} → ${newExpiryDate}`);
          updatedItems.vaccines.push({
            ...vaccine,
            oldExpiryDate: vaccine.expiryDate,
            newExpiryDate: newExpiryDate
          });
        }
        
      } catch (error) {
        logError(`Failed to update ${vaccine.name}: ${error.message}`);
      }
    }
  }
  
  return updatedItems;
}

// Main function
async function manageExpiredItems() {
  logHeader('INVENTORY EXPIRATION DATE MANAGEMENT');
  console.log('This script will identify expired items and update their expiration dates to 2027 for extended testing.\n');
  
  // Check current expired items
  const expiredItems = await checkExpiredItems();
  
  // Display results
  logHeader('CURRENT INVENTORY STATUS');
  
  console.log(`\n📊 MEDICATIONS (${expiredItems.medications.total} total):`);
  console.log(`  ✅ Available (not expired): ${expiredItems.medications.available.length}`);
  console.log(`  ❌ Expired: ${expiredItems.medications.expired.length}`);
  
  if (expiredItems.medications.expired.length > 0) {
    console.log('\n  📋 Expired Medications:');
    expiredItems.medications.expired.forEach(med => {
      console.log(`    - ${med.name} (ID: ${med.id})`);
      console.log(`      📅 Expired: ${new Date(med.expiryDate).toLocaleDateString()}`);
      console.log(`      📦 Stock: ${med.stock} units`);
    });
  }
  
  console.log(`\n💉 VACCINES (${expiredItems.vaccines.total} total):`);
  console.log(`  ✅ Available (not expired): ${expiredItems.vaccines.available.length}`);
  console.log(`  ❌ Expired: ${expiredItems.vaccines.expired.length}`);
  
  if (expiredItems.vaccines.expired.length > 0) {
    console.log('\n  📋 Expired Vaccines:');
    expiredItems.vaccines.expired.forEach(vaccine => {
      console.log(`    - ${vaccine.name} (ID: ${vaccine.id})`);
      console.log(`      📅 Expired: ${new Date(vaccine.expiryDate).toLocaleDateString()}`);
      console.log(`      💉 Stock: ${vaccine.stock} doses`);
    });
  }
  
  // Show system restrictions
  logHeader('SYSTEM RESTRICTIONS FOUND');
  console.log('✅ VACCINES: Strict expiration filtering in VaccinationModal.js');
  console.log('   - Expired vaccines are filtered out and cannot be used for vaccinations');
  console.log('   - Only vaccines with expiryDate > currentDate are available');
  console.log('✅ MEDICATIONS: Visual indicators for expired items');
  console.log('   - Expired medications show in red text in management interface');
  console.log('   - But may still be selectable for prescriptions (less strict)');
  
  // Update expired items if any exist
  const totalExpired = expiredItems.medications.expired.length + expiredItems.vaccines.expired.length;
  
  if (totalExpired > 0) {
    logHeader(`UPDATING ${totalExpired} EXPIRED ITEMS`);
    console.log('Setting new expiration dates to December 31, 2027 for extended testing purposes...\n');
    
    const updatedItems = await updateExpiredItems(expiredItems);
    
    // Summary
    logHeader('UPDATE SUMMARY');
    console.log(`✅ Updated ${updatedItems.medications.length} medications`);
    console.log(`✅ Updated ${updatedItems.vaccines.length} vaccines`);
    console.log(`📅 New expiration date: ${generateNewExpiryDate()} (over 2 years for extended testing)`);
    
    if (updatedItems.medications.length > 0 || updatedItems.vaccines.length > 0) {
      logSuccess('\n🎉 Expired items updated! You can now use them in the system for testing.');
      console.log('\nWhat you can now do:');
      console.log('  📋 Medications: Use in prescription management');
      console.log('  💉 Vaccines: Use in vaccination administration (no longer filtered out)');
      console.log('  🧪 Test expired item functionality with previously unusable items');
    }
    
  } else {
    logSuccess('\n🎉 No expired items found! All inventory items are currently usable.');
    console.log('\nYour inventory is in good shape for testing:');
    console.log(`  📋 ${expiredItems.medications.available.length} medications available`);
    console.log(`  💉 ${expiredItems.vaccines.available.length} vaccines available`);
  }
  
  logHeader('NEXT STEPS');
  console.log('1. Refresh your management dashboard to see updated expiration dates');
  console.log('2. Try using previously expired vaccines in vaccination modal');
  console.log('3. Check that expired medication warnings are now cleared');
  console.log('4. Test prescription and vaccination functionality with updated items');
}

// Run the script
if (require.main === module) {
  manageExpiredItems().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { 
  manageExpiredItems,
  checkExpiredItems,
  updateExpiredItems,
  isExpired,
  generateNewExpiryDate
};