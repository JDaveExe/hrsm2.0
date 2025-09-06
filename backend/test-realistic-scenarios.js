const axios = require('axios');

const testRealisticPatientCreation = async () => {
  console.log('🧪 Testing Realistic Patient Creation Scenarios\n');

  const baseURL = 'http://localhost:5000';
  
  const testCases = [
    {
      name: 'Scenario 1: Email="N/A", Contact Number provided (Most common)',
      data: {
        firstName: 'Maria',
        lastName: 'Santos',
        dateOfBirth: '1985-03-20',
        gender: 'Female',
        email: 'N/A',
        contactNumber: '09111222333'
      },
      expectUserAccount: true,
      expectedUsername: '09123456789'
    },
    {
      name: 'Scenario 2: Email provided, Contact Number provided (Complete info)',
      data: {
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        dateOfBirth: '1990-07-15',
        gender: 'Male',
        email: 'juan.delacruz@example.com',
        contactNumber: '09987654321'
      },
      expectUserAccount: true,
      expectedUsername: 'juan.delacruz@example.com' // Email takes priority
    },
    {
      name: 'Scenario 3: Email provided, Contact Number provided (Different birthdate)',
      data: {
        firstName: 'Ana',
        lastName: 'Rodriguez',
        dateOfBirth: '1995-12-10',
        gender: 'Female',
        email: 'ana.rodriguez@gmail.com',
        contactNumber: '09555666777'
      },
      expectUserAccount: true,
      expectedUsername: 'ana.rodriguez@gmail.com'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🔍 ${testCase.name}`);
    console.log('Input data:', JSON.stringify(testCase.data, null, 2));

    try {
      const response = await axios.post(`${baseURL}/api/patients`, testCase.data);
      
      console.log('✅ Patient created successfully');
      console.log('Response data:', {
        hasUserAccount: response.data.hasUserAccount,
        generatedPassword: response.data.generatedPassword,
        patientId: response.data.id
      });

      // Verify expectations
      if (testCase.expectUserAccount) {
        if (response.data.hasUserAccount && response.data.generatedPassword) {
          console.log(`✅ Expected user account created with password: ${response.data.generatedPassword}`);
          console.log(`🔐 Patient can login with: ${testCase.expectedUsername} / ${response.data.generatedPassword}`);
        } else {
          console.log('❌ Expected user account but none was created');
        }
      }

    } catch (error) {
      console.log('❌ Error:', error.response?.data?.msg || error.message);
      
      if (error.response?.data?.errors) {
        console.log('Validation errors:', error.response.data.errors);
      }
    }

    console.log('─'.repeat(60));
  }

  console.log('\n🎯 All scenarios should create user accounts since contact number is always required');
  console.log('📱 In healthcare, patients always need contact numbers for communication');
};

testRealisticPatientCreation().catch(console.error);
