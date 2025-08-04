// Test patient creation functionality
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testPatientCreation() {
  console.log('🧪 Testing patient creation...');
  
  try {
    // First, check if the API is responding
    console.log('1. Checking API status...');
    const statusResponse = await axios.get(`${API_BASE}/debug/check`);
    console.log('✅ API is responding:', statusResponse.data.message);

    // Check database status
    console.log('2. Checking database status...');
    const dbStatusResponse = await axios.get(`${API_BASE}/db-status`);
    console.log('✅ Database status:', dbStatusResponse.data);

    // Test patient creation
    console.log('3. Testing patient creation...');
    const testPatient = {
      firstName: 'Test',
      lastName: 'Patient',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      contactNumber: '09123456789',
      email: 'test.patient@example.com',
      address: 'Test Address',
      houseNo: '123',
      street: 'Test Street',
      barangay: 'Test Barangay',
      city: 'Test City',
      region: 'Test Region'
    };

    const createResponse = await axios.post(`${API_BASE}/patients`, testPatient);
    console.log('✅ Patient created successfully:', createResponse.data);

    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testPatientCreation();
