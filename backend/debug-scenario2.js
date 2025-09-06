const axios = require('axios');

const debugScenario2 = async () => {
  console.log('🐛 Debugging Scenario 2 specifically...\n');

  const baseURL = 'http://localhost:5000';
  
  const testData = {
    firstName: 'Debug',
    lastName: 'Test',
    dateOfBirth: '1995-06-15',
    gender: 'Female',
    email: 'debug@example.com',
    contactNumber: 'N/A'
  };

  console.log('📤 Sending data:', JSON.stringify(testData, null, 2));

  try {
    const response = await axios.post(`${baseURL}/api/patients`, testData);
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error response:', error.response?.data);
    console.log('❌ Error status:', error.response?.status);
    
    if (error.response?.data?.errors) {
      console.log('❌ Validation errors:', error.response.data.errors);
    }
  }
};

debugScenario2();
