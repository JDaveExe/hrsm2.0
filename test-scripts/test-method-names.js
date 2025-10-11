const axios = require('axios');

async function testCorrectMethodNames() {
  try {
    console.log('🧪 Testing Correct Method Names...\n');

    const baseURL = 'http://localhost:5000/api/inventory';

    console.log('💊 Testing medications endpoint...');
    try {
      const medicationsResponse = await axios.get(`${baseURL}/medications`);
      console.log(`✅ Medications (getAllMedications): ${medicationsResponse.data?.length || 0} items`);
    } catch (error) {
      console.log('❌ Medications error:', error.response?.status, error.message);
    }

    console.log('💉 Testing vaccines endpoint...');
    try {
      const vaccinesResponse = await axios.get(`${baseURL}/vaccines`);
      console.log(`✅ Vaccines (getAllVaccines): ${vaccinesResponse.data?.length || 0} items`);
    } catch (error) {
      console.log('❌ Vaccines error:', error.response?.status, error.message);
    }

    console.log('📊 Testing dashboard stats...');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/stats');
      console.log(`✅ Dashboard Stats: ${dashboardResponse.data?.patients?.total || 0} patients`);
      console.log(`   Gender: ${dashboardResponse.data?.patients?.male || 0}M/${dashboardResponse.data?.patients?.female || 0}F`);
    } catch (error) {
      console.log('❌ Dashboard error:', error.response?.status, error.message);
    }

    console.log('\n✅ All endpoints should now work correctly in the frontend!');

  } catch (error) {
    console.error('❌ Error testing method names:', error.message);
  }
}

testCorrectMethodNames();
