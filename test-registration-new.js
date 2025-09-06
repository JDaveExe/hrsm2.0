const axios = require('axios');

// Test registration endpoint
const testRegistration = async () => {
  console.log('🧪 Testing Patient Registration...\n');

  const testData = {
    firstName: 'Maria',
    middleName: 'Santos', 
    lastName: 'Rodriguez',
    suffix: '',
    email: 'maria.rodriguez@newtest.com',
    phoneNumber: '09987654321',
    password: 'testpassword123',
    houseNo: '456',
    street: 'Rosario St.',
    barangay: 'Maybunga',
    city: 'Pasig City',
    region: 'NCR',
    philHealthNumber: '12-987654321-0',
    dateOfBirth: '1985-03-20',
    gender: 'Female',
    civilStatus: 'Married'
  };

  console.log('📤 Sending registration request...');
  console.log('Data:', JSON.stringify(testData, null, 2));

  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return true;
    
  } catch (error) {
    console.log('❌ Registration failed!');
    console.log('Status:', error.response?.status);
    console.log('Error Response:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
};

const testValidation = async () => {
  console.log('\n=== Test 2: Missing Required Fields ===');
  
  const invalidData = {
    firstName: 'Test',
    // Missing lastName, password, dateOfBirth, gender
    email: 'test@example.com'
  };

  try {
    await axios.post('http://localhost:5000/api/auth/register', invalidData);
    console.log('❌ Should have failed validation');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Correctly rejected invalid data');
      const errors = error.response.data.errors?.map(e => e.msg) || [];
      console.log('Validation errors:', errors);
    }
  }
};

const checkServer = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/appointments', {
      headers: {
        'x-auth-token': 'temp-admin-token'
      }
    });
    console.log('🟢 Server is running');
    return true;
  } catch (error) {
    console.log('🔴 Server is not running or not accessible');
    console.log('Please make sure the backend server is running on port 5000');
    return false;
  }
};

const main = async () => {
  console.log('🚀 Patient Registration Test Suite\n');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    return;
  }

  console.log('🔬 Testing Registration with New User\n');
  
  console.log('=== Test 1: Valid Registration ===');
  await testRegistration();
  
  await testValidation();
  
  console.log('\n🎉 Tests completed!');
};

main();
