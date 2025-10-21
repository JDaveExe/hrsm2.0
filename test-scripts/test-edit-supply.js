// Test Script 3: Edit Supply
// Tests if editing supply information works and persists

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/inventory';

// Get auth token from environment (passed by test runner)
const AUTH_TOKEN = process.env.AUTH_TOKEN;

async function testEditSupply() {
  console.log('🧪 TEST 3: Edit Medical Supply\n');
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
    console.log('✅ Selected supply for editing:');
    console.log('   ID:', testSupply.id);
    console.log('   Name:', testSupply.name);
    console.log('   Current Stock:', testSupply.unitsInStock);
    console.log('   Supplier:', testSupply.supplier);
    
    const oldStock = testSupply.unitsInStock;
    const oldSupplier = testSupply.supplier;
    const newStock = oldStock + 100;
    const newSupplier = 'Updated Test Supplier Inc.';
    
    // Step 2: Edit the supply
    console.log('\n✏️ Step 2: Editing supply...');
    const updatedData = {
      ...testSupply,
      unitsInStock: newStock,
      supplier: newSupplier,
      notes: 'Updated by automated test script'
    };
    
    console.log('Changes:');
    console.log(`   Stock: ${oldStock} → ${newStock}`);
    console.log(`   Supplier: ${oldSupplier} → ${newSupplier}`);
    
    const editResponse = await axios.put(
      `${API_BASE_URL}/medical-supplies/${testSupply.id}`,
      updatedData,
      {
        headers: {
          'x-auth-token': AUTH_TOKEN
        }
      }
    );
    
    console.log('\n✅ Supply updated successfully!');
    console.log('Updated supply:', JSON.stringify(editResponse.data, null, 2));
    
    // Step 3: Verify changes were saved
    console.log('\n🔍 Step 3: Verifying changes were saved...');
    const afterResponse = await axios.get(`${API_BASE_URL}/medical-supplies/${testSupply.id}`);
    const updatedSupply = afterResponse.data;
    
    console.log('Verification:');
    console.log('   Stock:', updatedSupply.unitsInStock, '(expected:', newStock + ')');
    console.log('   Supplier:', updatedSupply.supplier, '(expected:', newSupplier + ')');
    
    let allCorrect = true;
    if (updatedSupply.unitsInStock === newStock) {
      console.log('✅ Stock updated correctly!');
    } else {
      console.log('❌ Stock update failed!');
      allCorrect = false;
    }
    
    if (updatedSupply.supplier === newSupplier) {
      console.log('✅ Supplier updated correctly!');
    } else {
      console.log('❌ Supplier update failed!');
      allCorrect = false;
    }
    
    // Step 4: Verify persistence (simulate page refresh)
    console.log('\n🔄 Step 4: Simulating page refresh...');
    const refreshResponse = await axios.get(`${API_BASE_URL}/medical-supplies/${testSupply.id}`);
    const persistedSupply = refreshResponse.data;
    
    if (persistedSupply.unitsInStock === newStock && persistedSupply.supplier === newSupplier) {
      console.log('✅ Changes persist after refresh!');
    } else {
      console.log('❌ Changes did NOT persist after refresh!');
      allCorrect = false;
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 TEST 3 SUMMARY: Edit Medical Supply');
    console.log('='.repeat(60));
    if (allCorrect) {
      console.log('✅ Supply editing: SUCCESS');
      console.log('✅ Data persistence: SUCCESS');
      console.log(`✅ Stock updated: ${oldStock} → ${newStock}`);
      console.log(`✅ Supplier updated: ${oldSupplier} → ${newSupplier}`);
      console.log('\n💡 You can now refresh your browser to verify the changes!');
    } else {
      console.log('❌ Some tests failed - check output above');
    }
    
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
testEditSupply()
  .then((supplyId) => {
    console.log('\n✅ Test completed successfully!');
    console.log(`🎯 Edited Supply ID: ${supplyId}`);
    console.log('\n💡 Next: Run test-add-stock.js to test adding stock');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test execution error:', error);
    process.exit(1);
  });
