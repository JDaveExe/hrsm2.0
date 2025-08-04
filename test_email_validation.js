// Test script to verify email validation is working properly
const axios = require('axios');

const testData = [
  {
    name: "Valid Email Test",
    data: {
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1990-01-15",
      gender: "Male",
      civilStatus: "Single",
      contactNumber: "09123456789",
      email: "john.doe@example.com",
      street: "Main St",
      barangay: "Test Barangay"
    }
  },
  {
    name: "N/A Email Test",
    data: {
      firstName: "Jane",
      lastName: "Smith",
      dateOfBirth: "1985-05-20",
      gender: "Female",
      civilStatus: "Married",
      contactNumber: "09987654321",
      email: "N/A",
      street: "Second St",
      barangay: "Test Barangay 2"
    }
  },
  {
    name: "Empty Email Test",
    data: {
      firstName: "Bob",
      lastName: "Johnson",
      dateOfBirth: "1992-12-10",
      gender: "Male",
      civilStatus: "Single",
      contactNumber: "09555444333",
      email: "",
      street: "Third St",
      barangay: "Test Barangay 3"
    }
  },
  {
    name: "Invalid Email Test (should fail)",
    data: {
      firstName: "Alice",
      lastName: "Brown",
      dateOfBirth: "1988-03-25",
      gender: "Female",
      civilStatus: "Single",
      contactNumber: "09111222333",
      email: "invalid-email",
      street: "Fourth St",
      barangay: "Test Barangay 4"
    }
  }
];

async function testEmailValidation() {
  console.log('🧪 Testing Email Validation...\n');

  for (const test of testData) {
    console.log(`\n📋 Running: ${test.name}`);
    console.log(`   Email: "${test.data.email}"`);
    
    try {
      const response = await axios.post('http://localhost:5000/api/patients', test.data);
      console.log(`   ✅ SUCCESS: Patient created with ID ${response.data.id}`);
      console.log(`   📧 Email stored as: ${JSON.stringify(response.data.email)}`);
    } catch (error) {
      if (error.response) {
        console.log(`   ❌ FAILED: ${error.response.status} - ${error.response.data.msg || error.response.data.message || 'Unknown error'}`);
        if (error.response.data.errors) {
          console.log(`   📝 Validation errors:`, error.response.data.errors);
        }
      } else {
        console.log(`   ❌ NETWORK ERROR: ${error.message}`);
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n🏁 Email validation testing complete!');
}

// Run the test
testEmailValidation().catch(console.error);
