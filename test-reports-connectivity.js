// Test script to verify Reports component connectivity after backend restart
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const testEndpoints = async () => {
  console.log('🔍 Testing Reports component data endpoints...\n');

  const endpoints = [
    { name: 'Dashboard Stats', url: `${BASE_URL}/api/dashboard/stats` },
    { name: 'Prescription Analytics', url: `${BASE_URL}/api/dashboard/prescription-analytics` },
    { name: 'Patient Analytics', url: `${BASE_URL}/api/dashboard/patient-analytics` },
    { name: 'All Medications', url: `${BASE_URL}/api/inventory/medications` },
    { name: 'All Vaccines', url: `${BASE_URL}/api/inventory/vaccines` }
  ];

  let allPassed = true;

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      const response = await axios.get(endpoint.url, { timeout: 5000 });
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: Success (${response.status})`);
        console.log(`   Data type: ${typeof response.data}, Length: ${Array.isArray(response.data) ? response.data.length : Object.keys(response.data || {}).length}`);
      } else {
        console.log(`⚠️ ${endpoint.name}: Unexpected status ${response.status}`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Failed`);
      if (error.code === 'ECONNREFUSED') {
        console.log(`   Error: Connection refused - backend may not be running`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`   Error: Host not found`);
      } else if (error.response) {
        console.log(`   Error: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`   Error: ${error.message}`);
      }
      allPassed = false;
    }
    console.log(''); // Empty line for readability
  }

  if (allPassed) {
    console.log('🎉 All endpoints are working! Reports component should load without "Resource Loading Error"');
  } else {
    console.log('⚠️ Some endpoints failed. This may cause "Resource Loading Error" in Reports component');
  }
};

testEndpoints().catch(console.error);
