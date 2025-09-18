const fs = require('fs').promises;
const path = require('path');

// Data file paths
const vaccinesDataPath = path.join(__dirname, 'backend/data/vaccines.json');
const medicationsDataPath = path.join(__dirname, 'backend/data/medications.json');

// Helper function to read JSON data
const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`File not found: ${filePath}. Creating empty array.`);
      return [];
    }
    throw error;
  }
};

// Helper function to write JSON data
const writeJsonFile = async (filePath, data) => {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'No expiry date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Check if item is expired or expiring soon
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate) return { status: 'NO_DATE', color: '\x1b[37m', days: null };
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { status: 'EXPIRED', color: '\x1b[31m', days: Math.abs(diffDays) };
  } else if (diffDays <= 7) {
    return { status: 'CRITICAL', color: '\x1b[91m', days: diffDays };
  } else if (diffDays <= 30) {
    return { status: 'WARNING', color: '\x1b[33m', days: diffDays };
  } else if (diffDays <= 90) {
    return { status: 'ATTENTION', color: '\x1b[93m', days: diffDays };
  } else {
    return { status: 'GOOD', color: '\x1b[32m', days: diffDays };
  }
};

// Display inventory with expiry analysis
const displayInventoryExpiry = async () => {
  console.log('\n🏥 HRSM 2.0 - Inventory Expiry Analysis');
  console.log('═'.repeat(80));
  
  try {
    // Load data
    const vaccines = await readJsonFile(vaccinesDataPath);
    const medications = await readJsonFile(medicationsDataPath);
    
    const allItems = [
      ...vaccines.map(v => ({ ...v, type: 'Vaccine', stock: v.dosesInStock })),
      ...medications.map(m => ({ ...m, type: 'Medication', stock: m.unitsInStock }))
    ];
    
    if (allItems.length === 0) {
      console.log('📋 No inventory items found.');
      return;
    }
    
    // Sort by expiry date (expired/expiring first)
    allItems.sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
    
    // Count by status
    const statusCounts = {
      EXPIRED: 0,
      CRITICAL: 0,
      WARNING: 0,
      ATTENTION: 0,
      GOOD: 0,
      NO_DATE: 0
    };
    
    console.log('\n📊 EXPIRY STATUS OVERVIEW');
    console.log('-'.repeat(80));
    
    // Display items
    allItems.forEach((item, index) => {
      const { status, color, days } = getExpiryStatus(item.expiryDate);
      statusCounts[status]++;
      
      let statusText = '';
      switch (status) {
        case 'EXPIRED':
          statusText = `EXPIRED ${days} days ago`;
          break;
        case 'CRITICAL':
          statusText = `EXPIRES in ${days} day${days === 1 ? '' : 's'} ⚠️`;
          break;
        case 'WARNING':
          statusText = `Expires in ${days} days`;
          break;
        case 'ATTENTION':
          statusText = `Expires in ${days} days`;
          break;
        case 'GOOD':
          statusText = `Expires in ${days} days`;
          break;
        case 'NO_DATE':
          statusText = 'No expiry date set';
          break;
      }
      
      console.log(`${color}${(index + 1).toString().padStart(3)}. ${item.type}: ${item.name}${'\x1b[0m'}`);
      console.log(`     📅 Expiry: ${formatDate(item.expiryDate)} - ${statusText}`);
      console.log(`     📦 Stock: ${item.stock} | Batch: ${item.batchNumber || 'N/A'}`);
      console.log(`     🏭 Manufacturer: ${item.manufacturer || 'N/A'}`);
      console.log('');
    });
    
    // Summary
    console.log('\n📈 EXPIRY SUMMARY');
    console.log('-'.repeat(50));
    console.log(`🔴 EXPIRED: ${statusCounts.EXPIRED} items`);
    console.log(`🟠 CRITICAL (≤7 days): ${statusCounts.CRITICAL} items`);
    console.log(`🟡 WARNING (≤30 days): ${statusCounts.WARNING} items`);
    console.log(`🟨 ATTENTION (≤90 days): ${statusCounts.ATTENTION} items`);
    console.log(`🟢 GOOD (>90 days): ${statusCounts.GOOD} items`);
    console.log(`⚪ NO DATE SET: ${statusCounts.NO_DATE} items`);
    console.log('');
    console.log(`📊 Total Expiring Soon (≤30 days): ${statusCounts.EXPIRED + statusCounts.CRITICAL + statusCounts.WARNING} items`);
    console.log(`📋 Total Items: ${allItems.length}`);
    
    return { allItems, statusCounts };
    
  } catch (error) {
    console.error('Error analyzing inventory:', error);
  }
};

// Update expiry dates for testing
const updateExpiryDates = async () => {
  console.log('\n🔧 UPDATING EXPIRY DATES FOR TESTING');
  console.log('═'.repeat(60));
  
  try {
    // Load current data
    const vaccines = await readJsonFile(vaccinesDataPath);
    const medications = await readJsonFile(medicationsDataPath);
    
    const today = new Date();
    
    // Update vaccines with varied expiry dates
    vaccines.forEach((vaccine, index) => {
      const randomDays = Math.floor(Math.random() * 730) - 30; // -30 to +700 days
      const newExpiryDate = new Date(today);
      newExpiryDate.setDate(today.getDate() + randomDays);
      
      // Make some items expired/expiring for testing
      if (index % 8 === 0) {
        // Make expired (1-30 days ago)
        newExpiryDate.setDate(today.getDate() - Math.floor(Math.random() * 30 + 1));
      } else if (index % 7 === 0) {
        // Make critical (1-7 days)
        newExpiryDate.setDate(today.getDate() + Math.floor(Math.random() * 7 + 1));
      } else if (index % 6 === 0) {
        // Make warning (8-30 days)
        newExpiryDate.setDate(today.getDate() + Math.floor(Math.random() * 23 + 8));
      }
      
      vaccine.expiryDate = newExpiryDate.toISOString().split('T')[0];
      vaccine.updatedAt = new Date().toISOString();
    });
    
    // Update medications with varied expiry dates
    medications.forEach((medication, index) => {
      const randomDays = Math.floor(Math.random() * 730) - 30; // -30 to +700 days
      const newExpiryDate = new Date(today);
      newExpiryDate.setDate(today.getDate() + randomDays);
      
      // Make some items expired/expiring for testing
      if (index % 9 === 0) {
        // Make expired (1-45 days ago)
        newExpiryDate.setDate(today.getDate() - Math.floor(Math.random() * 45 + 1));
      } else if (index % 8 === 0) {
        // Make critical (1-5 days)
        newExpiryDate.setDate(today.getDate() + Math.floor(Math.random() * 5 + 1));
      } else if (index % 7 === 0) {
        // Make warning (6-30 days)
        newExpiryDate.setDate(today.getDate() + Math.floor(Math.random() * 25 + 6));
      }
      
      medication.expiryDate = newExpiryDate.toISOString().split('T')[0];
      medication.updatedAt = new Date().toISOString();
    });
    
    // Save updated data
    await writeJsonFile(vaccinesDataPath, vaccines);
    await writeJsonFile(medicationsDataPath, medications);
    
    console.log(`✅ Updated ${vaccines.length} vaccines`);
    console.log(`✅ Updated ${medications.length} medications`);
    console.log('🔄 Expiry dates have been randomized for testing');
    
  } catch (error) {
    console.error('Error updating expiry dates:', error);
  }
};

// Fix specific items that should be expiring/expired
const addCriticalExpiryItems = async () => {
  console.log('\n⚠️  ADDING CRITICAL EXPIRY ITEMS FOR TESTING');
  console.log('═'.repeat(60));
  
  try {
    const vaccines = await readJsonFile(vaccinesDataPath);
    const medications = await readJsonFile(medicationsDataPath);
    
    const today = new Date();
    
    // Find first few items and make them critical
    if (vaccines.length > 0) {
      // Make first vaccine expired
      vaccines[0].expiryDate = new Date(today.setDate(today.getDate() - 5)).toISOString().split('T')[0];
      vaccines[0].updatedAt = new Date().toISOString();
      
      if (vaccines.length > 1) {
        // Make second vaccine expiring in 3 days
        vaccines[1].expiryDate = new Date(today.setDate(today.getDate() + 8)).toISOString().split('T')[0]; // +3 from -5
        vaccines[1].updatedAt = new Date().toISOString();
      }
      
      if (vaccines.length > 2) {
        // Make third vaccine expiring in 15 days
        vaccines[2].expiryDate = new Date(today.setDate(today.getDate() + 15)).toISOString().split('T')[0];
        vaccines[2].updatedAt = new Date().toISOString();
      }
    }
    
    if (medications.length > 0) {
      // Reset date
      const today2 = new Date();
      
      // Make first medication expired
      medications[0].expiryDate = new Date(today2.setDate(today2.getDate() - 10)).toISOString().split('T')[0];
      medications[0].updatedAt = new Date().toISOString();
      
      if (medications.length > 1) {
        // Make second medication expiring in 2 days
        medications[1].expiryDate = new Date(today2.setDate(today2.getDate() + 12)).toISOString().split('T')[0]; // +2 from -10
        medications[1].updatedAt = new Date().toISOString();
      }
      
      if (medications.length > 2) {
        // Make third medication expiring in 25 days
        medications[2].expiryDate = new Date(today2.setDate(today2.getDate() + 25)).toISOString().split('T')[0];
        medications[2].updatedAt = new Date().toISOString();
      }
    }
    
    await writeJsonFile(vaccinesDataPath, vaccines);
    await writeJsonFile(medicationsDataPath, medications);
    
    console.log('✅ Added critical expiry items:');
    console.log('   📍 1 expired vaccine');
    console.log('   📍 1 vaccine expiring in 3 days');
    console.log('   📍 1 vaccine expiring in 15 days');
    console.log('   📍 1 expired medication');
    console.log('   📍 1 medication expiring in 2 days');
    console.log('   📍 1 medication expiring in 25 days');
    
  } catch (error) {
    console.error('Error adding critical expiry items:', error);
  }
};

// Main function
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--update') || args.includes('-u')) {
    await updateExpiryDates();
    console.log('\n');
  }
  
  if (args.includes('--critical') || args.includes('-c')) {
    await addCriticalExpiryItems();
    console.log('\n');
  }
  
  await displayInventoryExpiry();
  
  console.log('\n💡 Usage:');
  console.log('   node inventory-expiry-manager.js                 # Display current status');
  console.log('   node inventory-expiry-manager.js --update        # Update with random dates');
  console.log('   node inventory-expiry-manager.js --critical      # Add critical expiry items');
  console.log('   node inventory-expiry-manager.js --update --critical  # Both operations');
  console.log('\n');
};

// Run the script
main().catch(console.error);
