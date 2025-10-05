// Simple test for a single registration with N/A email
const axios = require('axios');

const testData = {
  firstName: 'TestUser',
  lastName: 'ForBugFix',
  email: 'N/A',
  phoneNumber: '09999999999',
  password: 'testpass123',
  gender: 'Male',
  dateOfBirth: '1990-01-01',
  houseNo: '123',
  street: 'Test Street',
  barangay: 'Test Barangay', 
  city: 'Test City',
  region: 'NCR',
  civilStatus: 'Single'
};

async function testSingleRegistration() {
  try {
    console.log('🧪 Testing single registration with N/A email...');
    console.log('Data being sent:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/auth/register', testData);
    
    console.log('✅ SUCCESS: Registration passed!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ FAILED: Registration failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

testSingleRegistration();