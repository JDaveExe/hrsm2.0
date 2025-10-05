// Test script to verify registration bug fix for email/phone validation
const axios = require('axios');

console.log('🧪 Testing Registration Email/Phone Bug Fix...\n');

const testCases = [
  {
    name: 'Test 1: Empty email, valid phone',
    data: {
      firstName: 'Test',
      lastName: 'User1',
      email: '',
      phoneNumber: '09123456789',
      password: 'password123',
      dateOfBirth: '1990-01-01',
      gender: 'Male'
    },
    shouldPass: true
  },
  {
    name: 'Test 2: N/A email, valid phone',
    data: {
      firstName: 'Test',
      lastName: 'User2',
      email: 'N/A',
      phoneNumber: '09123456790',
      password: 'password123',
      dateOfBirth: '1990-01-01',
      gender: 'Male'
    },
    shouldPass: true
  },
  {
    name: 'Test 3: Valid email, empty phone',
    data: {
      firstName: 'Test',
      lastName: 'User3',
      email: 'testuser3@gmail.com',
      phoneNumber: '',
      password: 'password123',
      dateOfBirth: '1990-01-01',
      gender: 'Male'
    },
    shouldPass: true
  },
  {
    name: 'Test 4: Valid email, N/A phone',
    data: {
      firstName: 'Test',
      lastName: 'User4',
      email: 'testuser4@gmail.com',
      phoneNumber: 'N/A',
      password: 'password123',
      dateOfBirth: '1990-01-01',
      gender: 'Male'
    },
    shouldPass: true
  },
  {
    name: 'Test 5: Both empty (should fail)',
    data: {
      firstName: 'Test',
      lastName: 'User5',
      email: '',
      phoneNumber: '',
      password: 'password123',
      dateOfBirth: '1990-01-01',
      gender: 'Male'
    },
    shouldPass: false
  },
  {
    name: 'Test 6: Both N/A (should fail)',
    data: {
      firstName: 'Test',
      lastName: 'User6',
      email: 'N/A',
      phoneNumber: 'N/A',
      password: 'password123',
      dateOfBirth: '1990-01-01',
      gender: 'Male'
    },
    shouldPass: false
  }
];

async function runTest(testCase) {
  console.log(`\n📋 ${testCase.name}`);
  console.log(`   Email: "${testCase.data.email}"`);
  console.log(`   Phone: "${testCase.data.phoneNumber}"`);
  console.log(`   Expected: ${testCase.shouldPass ? 'PASS' : 'FAIL'}`);
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', testCase.data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (testCase.shouldPass) {
      console.log(`   ✅ PASSED: Registration successful`);
      console.log(`   User ID: ${response.data.user?.id}`);
      return true;
    } else {
      console.log(`   ❌ FAILED: Registration should have failed but succeeded`);
      return false;
    }
    
  } catch (error) {
    if (!testCase.shouldPass) {
      console.log(`   ✅ PASSED: Registration correctly failed`);
      console.log(`   Error: ${error.response?.data?.msg || error.message}`);
      return true;
    } else {
      console.log(`   ❌ FAILED: Registration should have succeeded but failed`);
      console.log(`   Error: ${error.response?.data?.msg || error.message}`);
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          console.log(`   - ${err.msg}`);
        });
      }
      return false;
    }
  }
}

async function runAllTests() {
  let passedTests = 0;
  const totalTests = testCases.length;
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    if (result) passedTests++;
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Registration bug has been fixed.');
  } else {
    console.log('⚠️  Some tests failed. Please review the fixes.');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running, starting tests...');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the backend server first.');
    console.log('   Run: cd backend && node server.js');
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runAllTests();
  }
}

main();