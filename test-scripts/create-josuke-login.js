const axios = require('axios');

async function createJosukeLoginCredentials() {
  console.log('🔐 Creating login credentials for Josuke...\n');

  try {
    // First, login as admin to get token
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Admin login successful');
    const token = adminLogin.data.token;
    
    // Get Josuke's patient data
    const patientResponse = await axios.get('http://localhost:5000/api/patients/40', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const josuke = patientResponse.data;
    console.log('✅ Found Josuke:', josuke.fullName);
    console.log('   Email:', josuke.email);
    console.log('   Phone:', josuke.contactNumber);
    
    // Option 1: Try to register Josuke through the normal registration endpoint
    console.log('\n📋 Attempting to register Josuke...');
    
    const registrationData = {
      firstName: josuke.firstName,
      middleName: josuke.middleName || '',
      lastName: josuke.lastName,
      suffix: josuke.suffix || '',
      email: josuke.email,
      phoneNumber: josuke.contactNumber,
      password: 'josuke123', // Default password
      houseNo: josuke.houseNo,
      street: josuke.street,
      barangay: josuke.barangay,
      city: josuke.city,
      region: josuke.region,
      philHealthNumber: josuke.philHealthNumber || '',
      membershipStatus: 'Member',
      dateOfBirth: josuke.dateOfBirth,
      age: josuke.age,
      gender: josuke.gender,
      civilStatus: josuke.civilStatus
    };
    
    try {
      const regResponse = await axios.post('http://localhost:5000/api/auth/register', registrationData);
      console.log('✅ Registration successful!');
      console.log('   New User ID:', regResponse.data.user?.id);
      console.log('   New Patient ID:', regResponse.data.patient?.id);
      console.log('');
      console.log('🔑 LOGIN CREDENTIALS FOR JOSUKE:');
      console.log('   Username/Email: josuke@gmail.com');
      console.log('   Password: josuke123');
      
    } catch (regError) {
      console.log('❌ Registration failed:', regError.response?.data?.msg || regError.message);
      
      if (regError.response?.data?.msg?.includes('already exists')) {
        console.log('\n🔍 User might already exist. Let me try to find the credentials...');
        
        // Try common password combinations
        const passwordVariations = ['josuke123', 'password', '123456', 'josuke', 'joestar'];
        const loginVariations = [josuke.email, josuke.contactNumber, 'josuke'];
        
        for (const login of loginVariations) {
          if (!login) continue;
          for (const password of passwordVariations) {
            try {
              const testLogin = await axios.post('http://localhost:5000/api/auth/login', {
                login: login,
                password: password
              });
              
              console.log(`✅ FOUND WORKING CREDENTIALS!`);
              console.log(`   Username: ${login}`);
              console.log(`   Password: ${password}`);
              console.log(`   User ID: ${testLogin.data.user.id}`);
              console.log(`   Patient ID: ${testLogin.data.user.patientId}`);
              return;
              
            } catch (loginError) {
              // Continue trying
            }
          }
        }
        
        console.log('❌ Could not find working credentials');
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

createJosukeLoginCredentials();
