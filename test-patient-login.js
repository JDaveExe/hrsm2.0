const axios = require('axios');

const testPatientLogin = async () => {
  console.log('🧪 Testing Patient Login with Generated Password...\n');

  // Use the credentials from our successful test patient creation
  const loginData = {
    login: 'testpatient238787@example.com', // Email from our successful test
    password: '15-05-1990' // Generated password from our test
  };

  console.log('🔐 Attempting login with generated credentials...');
  console.log('Email:', loginData.login);
  console.log('Password:', loginData.password);

  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log('Error Response:', JSON.stringify(error.response?.data, null, 2));
    
    // Let's also check if the user exists in the database
    console.log('\n🔍 Let me check if this user exists...');
    await checkUserExists(loginData.login);
  }
};

const checkUserExists = async (emailOrPhone) => {
  try {
    // Get admin token first
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    const authToken = adminLogin.data.token;
    
    // Check patients endpoint
    const patientsResponse = await axios.get('http://localhost:5000/api/patients', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const matchingPatient = patientsResponse.data.find(p => 
      p.email === emailOrPhone || p.contactNumber === emailOrPhone
    );
    
    if (matchingPatient) {
      console.log('📋 Patient found in database:');
      console.log(`  - Patient ID: ${matchingPatient.id}`);
      console.log(`  - Name: ${matchingPatient.firstName} ${matchingPatient.lastName}`);
      console.log(`  - Email: ${matchingPatient.email}`);
      console.log(`  - Phone: ${matchingPatient.contactNumber}`);
      console.log(`  - User ID: ${matchingPatient.userId}`);
    } else {
      console.log('❌ Patient not found in database');
    }
    
  } catch (error) {
    console.log('❌ Error checking user existence:', error.message);
  }
};

testPatientLogin();
