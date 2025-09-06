const axios = require('axios');

const testFormRegistration = async () => {
  console.log('🧪 Testing Form Registration Data...\n');

  // Using the exact data from the form in the screenshot with required fields filled
  const formData = {
    firstName: 'Josuke',
    middleName: '',
    lastName: 'Joestar',
    suffix: '',
    email: 'jojojosuke@gmail.com',
    phoneNumber: '09849201750',
    password: 'passwordjojo',
    houseNo: '',
    street: '',
    barangay: '',
    city: '',
    region: '',
    philHealthNumber: '',
    dateOfBirth: '1990-01-01', // Added required field
    age: '',
    gender: 'Male', // Added required field
    civilStatus: ''
  };

  console.log('📤 Sending registration request...');
  console.log('Data:', JSON.stringify(formData, null, 2));

  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', formData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Registration failed!');
    console.log('Status:', error.response?.status);
    console.log('Error Response:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.data?.errors) {
      console.log('\nValidation Errors:');
      error.response.data.errors.forEach(err => {
        console.log(`- ${err.msg} (field: ${err.path || err.param})`);
      });
    }
  }
};

testFormRegistration();
