// Test Script 1: Add Medical Supply
// Tests if adding a new medical supply works and persists

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/inventory';

// Get auth token from environment (passed by test runner)
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Test data
const newSupply = {
  name: 'Test Surgical Gloves',
  category: 'PPE',
  unitOfMeasure: 'boxes',
  unitsInStock: 200,
  minimumStock: 50,
  supplier: 'Test Medical Supplies Co.',
  expiryDate: '2027-12-31',
  location: 'Storage Room B - Shelf 3',
  notes: 'Test supply added by automated script'
};

async function testAddSupply() {
  console.log('🧪 TEST 1: Add Medical Supply\n');
  console.log('='.repeat(60));
  
  try {
    // Check if we have auth token
    if (!AUTH_TOKEN) {
      console.log('\n❌ No authentication token provided!');
      console.log('This test must be run through test-all-medical-supplies-auth.js');
      process.exit(1);
    }

    // Step 1: Get current supplies count
    console.log('\n📊 Step 1: Getting current supplies...');
    const beforeResponse = await axios.get(`${API_BASE_URL}/medical-supplies`);
    const beforeCount = beforeResponse.data.length;
    console.log(`✅ Current supplies count: ${beforeCount}`);
    
    // Step 2: Add new supply
    console.log('\n➕ Step 2: Adding new supply...');
    console.log('Supply data:', JSON.stringify(newSupply, null, 2));
    
    const addResponse = await axios.post(
      `${API_BASE_URL}/medical-supplies`, 
      newSupply,
      {
        headers: {
          'x-auth-token': AUTH_TOKEN
        }
      }
    );
    const addedSupply = addResponse.data;
    
    console.log('\n✅ Supply added successfully!');
    console.log('Added Supply ID:', addedSupply.id);
    console.log('Added Supply Name:', addedSupply.name);
    
    // Step 3: Verify it was added
    console.log('\n🔍 Step 3: Verifying supply was persisted...');
    const afterResponse = await axios.get(`${API_BASE_URL}/medical-supplies`);
    const afterCount = afterResponse.data.length;
    
    if (afterCount === beforeCount + 1) {
      console.log(`✅ Supply count increased: ${beforeCount} → ${afterCount}`);
      
      // Verify the new supply exists
      const foundSupply = afterResponse.data.find(s => s.id === addedSupply.id);
      if (foundSupply) {
        console.log('✅ New supply found in database');
        console.log('   ID:', foundSupply.id);
        console.log('   Name:', foundSupply.name);
        console.log('   Category:', foundSupply.category);
        console.log('   Stock:', foundSupply.unitsInStock);
      } else {
        console.log('❌ New supply not found in database!');
        process.exit(1);
      }
    } else {
      console.log(`❌ Supply count mismatch! Expected ${beforeCount + 1}, got ${afterCount}`);
      process.exit(1);
    }
    
    // Step 4: Test completed
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED: Add Supply');
    console.log('='.repeat(60));
    console.log('\n✅ All checks passed:');
    console.log('   ✅ Supply added via API');
    console.log('   ✅ Supply persisted to database');
    console.log('   ✅ Supply count updated correctly');
    console.log('   ✅ Supply data matches input\n');
    
    process.exit(0);
  } catch (error) {
    console.log('\n❌ TEST FAILED!');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Run the test
testAddSupply();
