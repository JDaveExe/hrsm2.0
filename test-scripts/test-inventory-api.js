// Test script to check inventory API endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/inventory';

async function testInventoryAPI() {
  console.log('🧪 Testing Inventory API Endpoints...\n');

  try {
    // Test vaccines endpoint
    console.log('📊 Testing /vaccines...');
    const vaccinesResponse = await axios.get(`${API_BASE}/vaccines`);
    console.log(`✅ Vaccines: ${vaccinesResponse.data.data?.length || 0} items found`);
    if (vaccinesResponse.data.data?.length > 0) {
      console.log('   Sample:', vaccinesResponse.data.data[0].name || vaccinesResponse.data.data[0]);
    }

    // Test medications endpoint
    console.log('\n💊 Testing /medications...');
    const medicationsResponse = await axios.get(`${API_BASE}/medications`);
    console.log(`✅ Medications: ${medicationsResponse.data.data?.length || 0} items found`);
    if (medicationsResponse.data.data?.length > 0) {
      console.log('   Sample:', medicationsResponse.data.data[0].name || medicationsResponse.data.data[0]);
    }

    console.log('\n🎉 Inventory API is working! The enhanced analytics will show real data.');

  } catch (error) {
    console.log('❌ Error testing API:', error.message);
    console.log('   The analytics will show fallback/loading data.');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Make sure the backend is running on port 5000');
    }
  }
}

testInventoryAPI();
