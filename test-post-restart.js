/**
 * Post-Restart Integration Test
 * Tests inventory system after backend restart
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testBackendConnection() {
  console.log('🔌 TESTING BACKEND CONNECTION');
  console.log('='.repeat(40));
  
  try {
    console.log('Testing basic connection...');
    const response = await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Backend server is responding');
    return true;
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('   Make sure server is running on port 5000');
    return false;
  }
}

async function testInventoryAPI() {
  console.log('\n📦 TESTING INVENTORY API ENDPOINTS');
  console.log('='.repeat(40));
  
  try {
    console.log('Testing medications endpoint...');
    const response = await axios.get(`${API_BASE_URL}/inventory/medications`, { timeout: 5000 });
    
    if (response.data && Array.isArray(response.data)) {
      console.log(`✅ Medications API working - Found ${response.data.length} medications`);
      
      // Check if we have our test medication
      const ambroxol = response.data.find(med => 
        med.name && med.name.toLowerCase().includes('ambroxol')
      );
      
      if (ambroxol) {
        console.log(`📋 Found Ambroxol: ${ambroxol.name} (${ambroxol.brandName})`);
        console.log(`   Stock: ${ambroxol.unitsInStock} units`);
        console.log(`   ID: ${ambroxol.id}`);
        return { success: true, medications: response.data, ambroxol };
      } else {
        console.log('⚠️  Ambroxol not found in API response');
        console.log('   Available medications:', response.data.map(m => m.name).join(', '));
        return { success: true, medications: response.data, ambroxol: null };
      }
    } else {
      console.log('❌ Invalid API response format');
      return { success: false, error: 'Invalid response format' };
    }
  } catch (error) {
    console.log('❌ Inventory API failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

async function testWeatherIntegration(medications) {
  console.log('\n🌧️  TESTING WEATHER PRESCRIPTION INTEGRATION');
  console.log('='.repeat(40));
  
  try {
    // Simulate the weather prescription service logic
    console.log('Simulating getCurrentInventory() method...');
    
    const inventory = {};
    medications.forEach(med => {
      // Create multiple possible keys to match against weather recommendations
      const keys = [
        `${med.name} (${med.brandName || med.genericName})`,
        `${med.brandName || med.name} (${med.name})`,
        med.genericName,
        med.name,
        med.brandName
      ].filter(Boolean);
      
      keys.forEach(key => {
        inventory[key] = med.unitsInStock || 0;
      });
    });
    
    console.log('✅ Generated inventory mapping with keys:');
    Object.entries(inventory).forEach(([key, stock]) => {
      if (stock > 0) {
        console.log(`   "${key}": ${stock} units`);
      }
    });
    
    // Test specific medication lookups
    const testLookups = [
      'Ambroxol (Mucosolvan)',
      'Salbutamol (Ventolin)',
      'Cetirizine (Zyrtec)'
    ];
    
    console.log('\n🔍 Testing medication lookups:');
    testLookups.forEach(medName => {
      const stock = inventory[medName] || 0;
      console.log(`   ${medName}: ${stock} units ${stock > 0 ? '✅' : '❌'}`);
    });
    
    return inventory;
    
  } catch (error) {
    console.log('❌ Weather integration test failed:', error.message);
    return {};
  }
}

async function testStockAddition(medicationId) {
  console.log('\n📈 TESTING STOCK ADDITION');
  console.log('='.repeat(40));
  
  if (!medicationId) {
    console.log('⚠️  No medication ID provided, skipping stock addition test');
    return false;
  }
  
  try {
    console.log(`Testing stock addition for medication ID: ${medicationId}`);
    
    // Test the stock addition endpoint
    const stockData = {
      type: 'medication',
      id: medicationId,
      quantity: 25,
      operation: 'add'
    };
    
    console.log('Sending stock addition request...');
    const response = await axios.post(`${API_BASE_URL}/inventory/update-stock`, stockData, { timeout: 5000 });
    
    if (response.data && response.data.success) {
      console.log('✅ Stock addition successful');
      console.log('   Response:', response.data);
      return true;
    } else {
      console.log('⚠️  Stock addition returned unexpected response:', response.data);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Stock addition failed:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
    return false;
  }
}

async function runPostRestartTests() {
  console.log('🧪 POST-RESTART INTEGRATION TESTS');
  console.log('='.repeat(50));
  console.log(`Test Time: ${new Date().toLocaleString()}`);
  console.log('Purpose: Verify inventory system after backend restart\n');
  
  // Test 1: Backend Connection
  const connectionOk = await testBackendConnection();
  if (!connectionOk) {
    console.log('\n❌ TESTS FAILED: Backend server not responding');
    console.log('   Please check if server is running on port 5000');
    return;
  }
  
  // Test 2: Inventory API
  const inventoryResult = await testInventoryAPI();
  if (!inventoryResult.success) {
    console.log('\n❌ TESTS FAILED: Inventory API not working');
    return;
  }
  
  // Test 3: Weather Integration
  const inventory = await testWeatherIntegration(inventoryResult.medications);
  
  // Test 4: Stock Addition (if we have Ambroxol)
  if (inventoryResult.ambroxol) {
    await testStockAddition(inventoryResult.ambroxol.id);
  }
  
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(30));
  console.log(`✅ Backend Connection: ${connectionOk ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Inventory API: ${inventoryResult.success ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Medications Found: ${inventoryResult.medications ? inventoryResult.medications.length : 0}`);
  console.log(`✅ Ambroxol Available: ${inventoryResult.ambroxol ? 'YES' : 'NO'}`);
  console.log(`✅ Stock Integration: ${Object.keys(inventory).length > 0 ? 'READY' : 'NEEDS FIXING'}`);
  
  console.log('\n🎯 NEXT STEPS:');
  if (inventoryResult.ambroxol && inventoryResult.ambroxol.unitsInStock > 0) {
    console.log('1. ✅ Ambroxol has stock - weather widget should show this');
    console.log('2. Go to Enhanced Forecasting Dashboard');
    console.log('3. Check Weather Prescriptions tab');
    console.log('4. Verify Ambroxol shows correct stock level');
  } else {
    console.log('1. ⚠️  Add stock to Ambroxol first');
    console.log('2. Use Management Dashboard > Inventory > Add Stock');
    console.log('3. Then test weather prescription integration');
  }
  
  console.log('\n🔄 REFRESH INSTRUCTIONS:');
  console.log('1. Refresh Enhanced Forecasting Dashboard page');
  console.log('2. Check browser developer console for any errors');
  console.log('3. Verify weather widget shows updated stock numbers');
}

// Run the tests
runPostRestartTests().catch(console.error);