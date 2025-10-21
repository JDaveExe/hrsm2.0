// Medical Supplies Test Suite with Authentication
const axios = require('axios');
const { spawn } = require('child_process');

const API_BASE_URL = 'http://localhost:5000/api';

// Management account credentials
const MANAGEMENT_CREDENTIALS = {
  login: 'ronaldo7@brgymaybunga.health',
  password: 'JHLbg&7&l'
};

let authToken = null;

// Function to login and get token
async function loginAndGetToken() {
  console.log('\n🔐 Logging in as management user...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, MANAGEMENT_CREDENTIALS);
    authToken = response.data.token;
    console.log('✅ Authentication successful!');
    console.log(`🎫 Token received: ${authToken.substring(0, 20)}...`);
    return authToken;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    throw new Error('Failed to authenticate');
  }
}

// Function to run a test script
function runTest(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 Running: ${scriptName}`);
    console.log('='.repeat(70));

    const child = spawn('node', [scriptName], {
      stdio: 'inherit',
      env: { ...process.env, AUTH_TOKEN: authToken }
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n✅ ${scriptName} - PASSED`);
        resolve();
      } else {
        console.log(`\n❌ ${scriptName} - FAILED`);
        reject(new Error(`Test ${scriptName} failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`❌ Error running ${scriptName}:`, error.message);
      reject(error);
    });
  });
}

// Main test suite
async function runTestSuite() {
  console.log('\n' + '█'.repeat(70));
  console.log('🧪 MEDICAL SUPPLIES INVENTORY - COMPREHENSIVE TEST SUITE');
  console.log('█'.repeat(70));

  const tests = [
    'test-add-supply.js',
    'test-log-usage.js',
    'test-edit-supply.js',
    'test-add-stock.js',
    'test-remove-supplies.js'
  ];

  console.log('\n📋 Tests to run:');
  tests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.replace('test-', '').replace('.js', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`);
  });

  console.log('\n⏱️  Starting tests...\n');

  try {
    // First, login to get auth token
    await loginAndGetToken();

    // Run all tests sequentially
    let passedTests = 0;
    let failedTests = 0;
    const results = [];

    for (const test of tests) {
      try {
        await runTest(test);
        passedTests++;
        results.push({ test, status: 'PASSED' });
      } catch (error) {
        failedTests++;
        results.push({ test, status: 'FAILED' });
        console.error(`\n⚠️  Test failed:`, error.message);
        console.log('\n⚠️  Stopping test suite due to failure.\n');
        break; // Stop on first failure
      }
    }

    // Print summary
    console.log('\n' + '█'.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('█'.repeat(70));
    console.log('\n📋 Results:');
    results.forEach((result, index) => {
      const emoji = result.status === 'PASSED' ? '✅' : '❌';
      const testName = result.test.replace('test-', '').replace('.js', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      console.log(`   ${index + 1}. ${testName}: ${emoji} ${result.status}`);
    });

    console.log('\n📈 Statistics:');
    console.log(`   Total Tests: ${results.length}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${((passedTests / results.length) * 100).toFixed(1)}%`);

    if (failedTests === 0 && passedTests === tests.length) {
      console.log('\n🎉 ALL TESTS PASSED! 🎉');
      console.log('\n✅ Medical Supplies inventory is working correctly!');
      console.log('✅ All CRUD operations successful');
      console.log('✅ Data persistence verified');
      console.log('✅ Stock tracking functional');
    } else if (failedTests > 0) {
      console.log('\n⚠️  SOME TESTS FAILED');
      console.log('Please check the error messages above and fix the issues.');
    }

    console.log('\n' + '█'.repeat(70) + '\n');

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Test suite error:', error.message);
    console.log('\n' + '█'.repeat(70) + '\n');
    process.exit(1);
  }
}

// Run the test suite
console.log('Test suite completed.');
runTestSuite();
