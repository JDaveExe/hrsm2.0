const axios = require('axios');

const testPatientCreation = async () => {
  console.log('🧪 Testing Patient Creation Scenarios\n');

  const baseURL = 'http://localhost:5000';
  
  const testCases = [
    {
      name: 'Scenario 1: Email="N/A", Contact Number provided',
      data: {
        firstName: 'Test',
        lastName: 'Scenario1',
        dateOfBirth: '1995-06-15',
        gender: 'Male',
        email: 'N/A',
        contactNumber: '09111111111'
      },
      expectUserAccount: true,
      expectedUsername: '09111111111'
    },
    {
      name: 'Scenario 2: Email provided, Contact Number="N/A"',
      data: {
        firstName: 'Test',
        lastName: 'Scenario2',
        dateOfBirth: '1995-06-15',
        gender: 'Female',
        email: 'unique2@example.com',
        contactNumber: 'N/A'
      },
      expectUserAccount: true,
      expectedUsername: 'unique2@example.com'
    },
    {
      name: 'Scenario 3: Both Email="N/A" and Contact Number="N/A"',
      data: {
        firstName: 'Test',
        lastName: 'Scenario3',
        dateOfBirth: '1995-06-15',
        gender: 'Male',
        email: 'N/A',
        contactNumber: 'N/A'
      },
      expectUserAccount: false,
      expectedUsername: null
    },
    {
      name: 'Scenario 4: Both Email and Contact Number provided',
      data: {
        firstName: 'Test',
        lastName: 'Scenario4',
        dateOfBirth: '1995-06-15',
        gender: 'Female',
        email: 'unique4@example.com',
        contactNumber: '09444444444'
      },
      expectUserAccount: true,
      expectedUsername: 'unique4@example.com'
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
        } else {
          console.log('❌ Expected user account but none was created');
        }
      } else {
        if (!response.data.hasUserAccount) {
          console.log('✅ Correctly did not create user account');
        } else {
          console.log('❌ Unexpected user account was created');
        }
      }

    } catch (error) {
      console.log('❌ Error:', error.response?.data?.msg || error.message);
      
      if (error.response?.data?.errors) {
        console.log('Validation errors:', error.response.data.errors);
      }
    }

    console.log('─'.repeat(50));
  }
};

testPatientCreation().catch(console.error);
