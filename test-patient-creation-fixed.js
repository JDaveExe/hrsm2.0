const axios = require('axios');

const testPatientCreation = async () => {
  console.log('🧪 Testing Admin Patient Creation with Auto-Generated Password...\n');

  // Generate unique contact number and email
  const timestamp = Date.now().toString().slice(-6);
  const testPatient = {
    firstName: 'Test',
    lastName: 'Patient',
    middleName: 'Admin',
    dateOfBirth: '1990-05-15',
    gender: 'Male',
    contactNumber: `09${timestamp}890`, // Unique phone number
    email: `testpatient${timestamp}@example.com`, // Unique email
    civilStatus: 'Single',
    houseNo: '123',
    street: 'Test Street',
    barangay: 'Test Barangay',
    city: 'Test City',
    region: 'NCR'
  };

  // First, login as admin to get auth token
  let authToken;
  try {
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
  } catch (error) {
    console.log('❌ Admin login failed:', error.message);
    return;
  }

  // Generate expected password
  const expectedPassword = '15-05-1990'; // dd-mm-yyyy format

  console.log('📤 Creating patient with admin endpoint...');
  console.log('Expected password format:', expectedPassword);
  console.log('Data:', JSON.stringify(testPatient, null, 2));

  try {
    const response = await axios.post('http://localhost:5000/api/patients', testPatient, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Patient creation successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.generatedPassword) {
      console.log(`🔑 Generated password: ${response.data.generatedPassword}`);
      console.log(`📋 User can now login with:`);
      console.log(`   Email/Phone: ${testPatient.email || testPatient.contactNumber}`);
      console.log(`   Password: ${response.data.generatedPassword}`);
    }
    
  } catch (error) {
    console.log('❌ Patient creation failed!');
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

testPatientCreation();
