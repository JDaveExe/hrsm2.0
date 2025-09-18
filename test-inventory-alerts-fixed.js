// Fixed Node.js inventory alerts test
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Inventory Alerts Logic');
console.log('===================================');

// Read data directly from backend files (since localStorage/fetch don't exist in Node.js)
const vaccinesPath = path.join(__dirname, 'backend', 'data', 'vaccines.json');
const medicationsPath = path.join(__dirname, 'backend', 'data', 'medications.json');

function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return [];
  }
}

function processItems(items, type) {
  const lowStock = [];
  const emptyStock = [];
  const expiring = [];

  console.log(`\n📊 Processing ${items.length} ${type}s:`);

  items.forEach(item => {
    const stock = type === 'vaccine' ? item.dosesInStock : item.unitsInStock;
    const minStock = item.minimumStock || 0;

    console.log(`   ${item.name}: stock=${stock}, minimum=${minStock}`);

    // Check stock levels - ISSUE ANALYSIS
    if (stock === 0) {
      emptyStock.push({ ...item, type, alertType: 'empty' });
      console.log(`     ❌ EMPTY STOCK: ${item.name} (0 units)`);
    } else if (stock <= minStock) { // Using <= for consistency (admin vs doctor difference found!)
      lowStock.push({ ...item, type, alertType: 'low' });
      console.log(`     ⚠️  LOW STOCK: ${item.name} (${stock} <= ${minStock})`);
    }

    // Check expiry dates (within 30 days)
    if (item.expiryDate) {
      const expiryDate = new Date(item.expiryDate);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      console.log(`     Expiry: ${item.expiryDate} (${expiryDate.toDateString()})`);
      
      if (expiryDate <= thirtyDaysFromNow) {
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        expiring.push({ 
          ...item, 
          type, 
          alertType: 'expiring',
          daysUntilExpiry: Math.max(0, daysUntilExpiry)
        });
        
        if (daysUntilExpiry <= 0) {
          console.log(`     🚨 EXPIRED: ${item.name} (${Math.abs(daysUntilExpiry)} days ago)`);
        } else if (daysUntilExpiry <= 7) {
          console.log(`     🔴 EXPIRES SOON: ${item.name} (${daysUntilExpiry} days)`);
        } else {
          console.log(`     🟡 EXPIRING: ${item.name} (${daysUntilExpiry} days)`);
        }
      }
    }
  });

  return { lowStock, emptyStock, expiring };
}

async function testInventoryLogic() {
  try {
    console.log('📋 Reading inventory data files...');
    
    const vaccines = readJsonFile(vaccinesPath);
    const medications = readJsonFile(medicationsPath);

    console.log(`✅ Loaded ${vaccines.length} vaccines and ${medications.length} medications`);

    // Process vaccines
    console.log('\n🔬 VACCINE ANALYSIS:');
    const vaccineAlerts = processItems(vaccines, 'vaccine');

    // Process medications  
    console.log('\n💊 MEDICATION ANALYSIS:');
    const medicationAlerts = processItems(medications, 'medication');

    // Summary
    console.log('\n📈 ALERT SUMMARY:');
    console.log('==================');
    
    const totalEmpty = vaccineAlerts.emptyStock.length + medicationAlerts.emptyStock.length;
    const totalLowStock = vaccineAlerts.lowStock.length + medicationAlerts.lowStock.length;
    const totalExpiring = vaccineAlerts.expiring.length + medicationAlerts.expiring.length;
    const totalCritical = totalEmpty + totalLowStock;
    
    console.log(`🚨 Empty Stock: ${totalEmpty}`);
    console.log(`⚠️  Low Stock: ${totalLowStock}`);
    console.log(`🕐 Expiring Soon: ${totalExpiring}`);
    console.log(`💥 Total Critical: ${totalCritical}`);
    console.log(`📊 Total Alerts: ${totalCritical + totalExpiring}`);

    // Detailed breakdown
    if (totalEmpty > 0) {
      console.log('\n🚨 EMPTY STOCK ITEMS:');
      [...vaccineAlerts.emptyStock, ...medicationAlerts.emptyStock].forEach(item => {
        const stock = item.type === 'vaccine' ? item.dosesInStock : item.unitsInStock;
        console.log(`   - ${item.name} (${item.type}): ${stock} units`);
      });
    }

    if (totalLowStock > 0) {
      console.log('\n⚠️  LOW STOCK ITEMS:');
      [...vaccineAlerts.lowStock, ...medicationAlerts.lowStock].forEach(item => {
        const stock = item.type === 'vaccine' ? item.dosesInStock : item.unitsInStock;
        console.log(`   - ${item.name} (${item.type}): ${stock}/${item.minimumStock} units`);
      });
    }

    if (totalExpiring > 0) {
      console.log('\n🕐 EXPIRING ITEMS:');
      [...vaccineAlerts.expiring, ...medicationAlerts.expiring]
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
        .forEach(item => {
          console.log(`   - ${item.name} (${item.type}): ${item.daysUntilExpiry} days (${item.expiryDate})`);
        });
    }

    // ISSUE DETECTION
    console.log('\n🔍 POTENTIAL ISSUES DETECTED:');
    console.log('===============================');
    
    // Issue 1: Admin vs Doctor logic difference
    console.log('1. Stock Level Logic Inconsistency:');
    console.log('   - Admin uses: stock < minStock (excluding exact match)');  
    console.log('   - Doctor uses: stock <= minStock (including exact match)');
    console.log('   - Recommendation: Use <= for consistency');

    // Issue 2: Missing null/undefined checks
    console.log('\n2. Missing Data Validation:');
    const itemsWithoutMinStock = [...vaccines, ...medications].filter(item => 
      item.minimumStock === null || item.minimumStock === undefined
    );
    if (itemsWithoutMinStock.length > 0) {
      console.log(`   - ${itemsWithoutMinStock.length} items missing minimumStock values`);
      itemsWithoutMinStock.forEach(item => {
        console.log(`     * ${item.name}: minimumStock = ${item.minimumStock}`);
      });
    }

    // Issue 3: Date handling
    console.log('\n3. Date Processing Issues:');
    const itemsWithInvalidDates = [...vaccines, ...medications].filter(item => {
      if (!item.expiryDate) return false;
      const date = new Date(item.expiryDate);
      return isNaN(date.getTime());
    });
    if (itemsWithInvalidDates.length > 0) {
      console.log(`   - ${itemsWithInvalidDates.length} items with invalid expiry dates`);
    }

    // Issue 4: Current date context
    const today = new Date();
    console.log(`\n4. Current Date Context (${today.toDateString()}):`);
    const expiredItems = [...vaccines, ...medications].filter(item => {
      if (!item.expiryDate) return false;
      return new Date(item.expiryDate) < today;
    });
    if (expiredItems.length > 0) {
      console.log(`   - ${expiredItems.length} items are already expired!`);
      expiredItems.forEach(item => {
        console.log(`     * ${item.name}: expired on ${item.expiryDate}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during inventory analysis:', error);
  }
}

// Run the test
testInventoryLogic();
