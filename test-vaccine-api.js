// Simple test to verify the vaccine analytics API
const axios = require('axios');

async function testVaccineEndpoints() {
  try {
    console.log('🧪 Testing vaccine usage distribution endpoint...');
    
    const response1 = await axios.get('http://localhost:5000/api/inventory/vaccine-usage-distribution');
    console.log('✅ vaccine-usage-distribution response:', {
      status: response1.status,
      dataLength: response1.data.length,
      firstItem: response1.data[0]
    });

    console.log('🧪 Testing vaccine category distribution endpoint...');
    
    const response2 = await axios.get('http://localhost:5000/api/inventory/vaccine-category-distribution');
    console.log('✅ vaccine-category-distribution response:', {
      status: response2.status,
      dataLength: response2.data.length,
      firstItem: response2.data[0]
    });

    console.log('✅ Both endpoints working correctly!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testVaccineEndpoints();