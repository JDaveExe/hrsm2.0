// Direct test of the weatherPrescriptionService getCurrentInventory method
const path = require('path');

async function testGetCurrentInventory() {
  console.log('🧪 Testing weatherPrescriptionService.getCurrentInventory() method\n');

  try {
    // Import the weatherPrescriptionService
    const servicePath = path.join(__dirname, 'src', 'services', 'weatherPrescriptionService.js');
    delete require.cache[require.resolve(servicePath)]; // Clear cache to get fresh instance
    
    const WeatherPrescriptionService = require(servicePath);
    const service = new WeatherPrescriptionService();

    console.log('📊 Calling getCurrentInventory()...');
    const inventory = await service.getCurrentInventory();
    
    console.log('✅ getCurrentInventory() completed');
    console.log(`   Total medications in inventory: ${Object.keys(inventory).length}`);
    
    // Look for Paracetamol entries and their stock values
    console.log('\n🔍 Checking Paracetamol stock values:');
    const paracetamolKeys = Object.keys(inventory).filter(key => 
      key.toLowerCase().includes('paracetamol')
    );
    
    paracetamolKeys.forEach(key => {
      console.log(`   "${key}": ${inventory[key]} units`);
    });
    
    // Check some other medications
    console.log('\n📋 Sample of other medications in inventory:');
    const sampleKeys = Object.keys(inventory).slice(0, 10);
    sampleKeys.forEach(key => {
      if (inventory[key] > 0) {
        console.log(`   "${key}": ${inventory[key]} units`);
      }
    });
    
    // Verify if we're getting batch-based calculations vs old JSON values
    console.log('\n🎯 Analysis:');
    const paracetamolStock = paracetamolKeys.length > 0 ? inventory[paracetamolKeys[0]] : 0;
    
    if (paracetamolStock === 1194) {
      console.log('✅ SUCCESS: Paracetamol stock matches batch calculation (1194 units)');
      console.log('   This means the updated getCurrentInventory() is working correctly!');
    } else if (paracetamolStock === 1244) {
      console.log('❌ ISSUE: Paracetamol stock matches old JSON value (1244 units)');
      console.log('   The getCurrentInventory() method may still be using old logic');
    } else {
      console.log(`ℹ️  Paracetamol stock: ${paracetamolStock} units (unexpected value)`);
    }

  } catch (error) {
    console.error('❌ Error testing getCurrentInventory:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testGetCurrentInventory();