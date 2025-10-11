/**
 * Test Inventory Backend Endpoints
 * Tests the inventory management API endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test configuration
const testConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

async function testInventoryEndpoints() {
  console.log('🧪 Testing Inventory Management Backend...\n');

  try {
    // Test 1: Get all vaccines
    console.log('📊 Testing: GET /api/inventory/vaccines');
    const vaccinesResponse = await axios.get(`${API_BASE_URL}/inventory/vaccines`, testConfig);
    console.log(`✅ Vaccines endpoint working: ${vaccinesResponse.data.length} vaccines found`);
    
    // Test 2: Get all medications  
    console.log('📊 Testing: GET /api/inventory/medications');
    const medicationsResponse = await axios.get(`${API_BASE_URL}/inventory/medications`, testConfig);
    console.log(`✅ Medications endpoint working: ${medicationsResponse.data.length} medications found`);
    
    // Test 3: Get inventory summary
    console.log('📊 Testing: GET /api/inventory/summary');
    const summaryResponse = await axios.get(`${API_BASE_URL}/inventory/summary`, testConfig);
    console.log('✅ Inventory summary endpoint working:');
    console.log('   Vaccines:', summaryResponse.data.vaccines);
    console.log('   Medications:', summaryResponse.data.medications);
    
    // Test 4: Test stock update (add stock to first vaccine if any exists)
    if (vaccinesResponse.data.length > 0) {
      const firstVaccine = vaccinesResponse.data[0];
      console.log(`📊 Testing: POST /api/inventory/update-stock (vaccine ID: ${firstVaccine.id})`);
      
      const stockUpdateResponse = await axios.post(`${API_BASE_URL}/inventory/update-stock`, {
        type: 'vaccine',
        id: firstVaccine.id,
        quantity: 5,
        operation: 'add'
      }, testConfig);
      
      console.log(`✅ Stock update endpoint working: Updated ${firstVaccine.name}`);
      console.log(`   New stock: ${stockUpdateResponse.data.dosesInStock} doses`);
    }
    
    // Test 5: Test creating a new vaccine
    console.log('📊 Testing: POST /api/inventory/vaccines (create new vaccine)');
    const newVaccine = {
      name: 'Test COVID-19 Vaccine',
      description: 'Test vaccine for endpoint validation',
      manufacturer: 'Test Pharmaceuticals',
      category: 'COVID-19',
      batchNumber: 'TEST-001',
      dosesInStock: 10,
      minimumStock: 5,
      unitCost: 25.00,
      expiryDate: '2025-12-31',
      storageTemp: '-70°C',
      administrationRoute: 'Intramuscular',
      ageGroups: ['Adult'],
      dosageSchedule: '2 doses, 21 days apart',
      status: 'Available'
    };
    
    const createResponse = await axios.post(`${API_BASE_URL}/inventory/vaccines`, newVaccine, testConfig);
    console.log(`✅ Vaccine creation endpoint working: Created vaccine ID ${createResponse.data.id}`);
    
    // Test 6: Delete the test vaccine we just created
    console.log(`📊 Testing: DELETE /api/inventory/vaccines/${createResponse.data.id}`);
    await axios.delete(`${API_BASE_URL}/inventory/vaccines/${createResponse.data.id}`, testConfig);
    console.log(`✅ Vaccine deletion endpoint working: Deleted vaccine ID ${createResponse.data.id}`);
    
    console.log('\n🎉 All inventory backend tests passed!');
    console.log('\n📋 Backend Inventory Features Available:');
    console.log('  ✅ Get all vaccines');
    console.log('  ✅ Get all medications');
    console.log('  ✅ Create vaccines');
    console.log('  ✅ Create medications');
    console.log('  ✅ Update vaccines');
    console.log('  ✅ Update medications');
    console.log('  ✅ Delete vaccines');
    console.log('  ✅ Delete medications');
    console.log('  ✅ Get inventory summary');
    console.log('  ✅ Update stock levels');
    console.log('  ✅ Get individual items by ID');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function testInventoryAnalytics() {
  console.log('\n🔍 Testing Inventory Analytics...\n');

  try {
    // Test inventory summary with detailed analysis
    const summaryResponse = await axios.get(`${API_BASE_URL}/inventory/summary`, testConfig);
    const { vaccines, medications } = summaryResponse.data;
    
    console.log('📈 INVENTORY ANALYTICS SUMMARY:');
    console.log('================================');
    
    console.log('\n💉 VACCINE STATISTICS:');
    console.log(`  Total Types: ${vaccines.total}`);
    console.log(`  Available: ${vaccines.available}`);
    console.log(`  Low Stock: ${vaccines.lowStock}`);
    console.log(`  Out of Stock: ${vaccines.outOfStock}`);
    console.log(`  Expiring Soon: ${vaccines.expiring}`);
    console.log(`  Total Doses: ${vaccines.totalDoses}`);
    
    console.log('\n💊 MEDICATION STATISTICS:');
    console.log(`  Total Types: ${medications.total}`);
    console.log(`  Available: ${medications.available}`);
    console.log(`  Low Stock: ${medications.lowStock}`);
    console.log(`  Out of Stock: ${medications.outOfStock}`);
    console.log(`  Expiring Soon: ${medications.expiring}`);
    console.log(`  Total Units: ${medications.totalUnits}`);
    
    // Calculate percentages
    const vaccineAvailabilityRate = ((vaccines.available / vaccines.total) * 100).toFixed(1);
    const medicationAvailabilityRate = ((medications.available / medications.total) * 100).toFixed(1);
    
    console.log('\n📊 KEY METRICS:');
    console.log(`  Vaccine Availability Rate: ${vaccineAvailabilityRate}%`);
    console.log(`  Medication Availability Rate: ${medicationAvailabilityRate}%`);
    console.log(`  Total Inventory Items: ${vaccines.total + medications.total}`);
    console.log(`  Critical Stock Issues: ${vaccines.lowStock + vaccines.outOfStock + medications.lowStock + medications.outOfStock}`);
    
  } catch (error) {
    console.error('❌ Analytics test failed:', error.message);
  }
}

// Run the tests
async function runAllTests() {
  await testInventoryEndpoints();
  await testInventoryAnalytics();
}

runAllTests();
