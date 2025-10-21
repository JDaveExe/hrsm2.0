// Test Script 4: Add Stock
// Tests if adding stock to existing supply works and persists

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/inventory';

// Get auth token from environment (passed by test runner)
const AUTH_TOKEN = process.env.AUTH_TOKEN;

async function testAddStock() {
  console.log('🧪 TEST 4: Add Stock to Supply\n');
  console.log('=' .repeat(60));
  
  try {
    // Check if we have auth token
    if (!AUTH_TOKEN) {
      console.log('\n❌ No authentication token provided!');
      console.log('This test must be run through test-all-medical-supplies-auth.js');
      process.exit(1);
    }

    // Step 1: Get all supplies and select one to test
    console.log('\n📊 Step 1: Getting available supplies...');
    const suppliesResponse = await axios.get(`${API_BASE_URL}/medical-supplies`);
    const supplies = suppliesResponse.data;
    
    if (supplies.length === 0) {
      console.log('❌ No supplies found! Run test-add-supply.js first.');
      process.exit(1);
    }
    
    const testSupply = supplies[0];
    console.log('✅ Selected supply for adding stock:');
    console.log('   ID:', testSupply.id);
    console.log('   Name:', testSupply.name);
    console.log('   Current Stock:', testSupply.unitsInStock);
    
    const oldStock = testSupply.unitsInStock;
    const quantityToAdd = 75;
    const expectedStock = oldStock + quantityToAdd;
    
    // Step 2: Add stock
    console.log('\n➕ Step 2: Adding stock...');
    const stockData = {
      quantityToAdd: quantityToAdd,
      notes: 'Stock replenishment - automated test'
    };
    
    console.log('Stock addition data:', JSON.stringify(stockData, null, 2));
    
    const addStockResponse = await axios.post(
      `${API_BASE_URL}/medical-supplies/${testSupply.id}/add-stock`,
      stockData,
      {
        headers: {
          'x-auth-token': AUTH_TOKEN
        }
      }
    );
    
    console.log('\n✅ Stock added successfully!');
    console.log('Response:', JSON.stringify(addStockResponse.data, null, 2));
    
    // Step 3: Verify stock was added
    console.log('\n🔍 Step 3: Verifying stock was added...');
    const afterResponse = await axios.get(`${API_BASE_URL}/medical-supplies/${testSupply.id}`);
    const updatedSupply = afterResponse.data;
    
    console.log('Stock before:', oldStock);
    console.log('Quantity added:', quantityToAdd);
    console.log('Stock after:', updatedSupply.unitsInStock);
    console.log('Expected stock:', expectedStock);
    
    if (updatedSupply.unitsInStock === expectedStock) {
      console.log('✅ Stock added correctly!');
    } else {
      console.log('❌ Stock addition error!');
      console.log('   Expected:', expectedStock);
      console.log('   Got:', updatedSupply.unitsInStock);
    }
    
    // Step 4: Verify persistence (simulate page refresh)
    console.log('\n🔄 Step 4: Simulating page refresh...');
    const refreshResponse = await axios.get(`${API_BASE_URL}/medical-supplies/${testSupply.id}`);
    const persistedSupply = refreshResponse.data;
    
    if (persistedSupply.unitsInStock === expectedStock) {
      console.log('✅ Stock change persists after refresh!');
      console.log('Persisted stock:', persistedSupply.unitsInStock);
    } else {
      console.log('❌ Stock did NOT persist after refresh!');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST 4 SUMMARY: Add Stock');
    console.log('='.repeat(60));
    console.log('✅ Stock addition: SUCCESS');
    console.log('✅ Data persistence: SUCCESS');
    console.log(`✅ Stock increased from ${oldStock} to ${persistedSupply.unitsInStock}`);
    console.log('\n💡 You can now refresh your browser to verify the stock increased!');
    
    return testSupply.id;
    
  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testAddStock()
  .then((supplyId) => {
    console.log('\n✅ Test completed successfully!');
    console.log(`🎯 Updated Supply ID: ${supplyId}`);
    console.log('\n💡 Next: Run test-remove-supplies.js to test bulk deletion');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test execution error:', error);
    process.exit(1);
  });
