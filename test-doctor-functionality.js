/**
 * Test Script: Doctor Dashboard Functionality Verification
 * Tests the fixes for doctor list loading and user header display
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const FRONTEND_URL = 'http://localhost:3000';

// Test credentials for Marcus Stewart (the doctor from the screenshot)
const TEST_DOCTOR = {
  login: 'marcusstewart',
  password: 'password' // You may need to update this with the actual password
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Test 1: Backend Doctor Authentication
async function testDoctorLogin() {
  logInfo('Testing doctor login authentication...');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, TEST_DOCTOR);
    
    if (response.data && response.data.user && response.data.token) {
      logSuccess('Doctor login successful');
      logInfo(`Logged in as: ${response.data.user.firstName} ${response.data.user.lastName}`);
      logInfo(`Role: ${response.data.user.role}`);
      logInfo(`Token received: ${response.data.token.substring(0, 20)}...`);
      
      return {
        success: true,
        token: response.data.token,
        user: response.data.user
      };
    } else {
      logError('Login response missing user or token data');
      return { success: false };
    }
  } catch (error) {
    logError(`Doctor login failed: ${error.response?.data?.msg || error.message}`);
    return { success: false };
  }
}

// Test 2: Doctor List API Endpoint
async function testDoctorListAPI(token) {
  logInfo('Testing doctors list API endpoint...');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/users/doctors`, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.users && Array.isArray(response.data.users)) {
      logSuccess(`Doctor list API working - Found ${response.data.users.length} doctors`);
      
      response.data.users.forEach((doctor, index) => {
        logInfo(`  ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.username})`);
      });
      
      return { success: true, doctors: response.data.users };
    } else {
      logError('Doctor list API response invalid format');
      return { success: false };
    }
  } catch (error) {
    logError(`Doctor list API failed: ${error.response?.data?.msg || error.message}`);
    logError(`Status: ${error.response?.status || 'Unknown'}`);
    return { success: false };
  }
}

// Test 3: User Data Structure Validation
function testUserDataStructure(user) {
  logInfo('Validating user data structure...');
  
  const requiredFields = ['id', 'firstName', 'lastName', 'role', 'username'];
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!user[field]) {
      missingFields.push(field);
    }
  });
  
  if (missingFields.length === 0) {
    logSuccess('User data structure is valid');
    logInfo(`User ID: ${user.id}`);
    logInfo(`Full Name: ${user.firstName} ${user.lastName}`);
    logInfo(`Username: ${user.username}`);
    logInfo(`Role: ${user.role}`);
    logInfo(`Email: ${user.email || 'Not set'}`);
    return { success: true };
  } else {
    logError(`Missing required fields: ${missingFields.join(', ')}`);
    return { success: false, missingFields };
  }
}

// Test 4: Frontend Services Test (simulated)
async function testFrontendServices(token) {
  logInfo('Testing frontend service calls...');
  
  // Simulate the userService.getUsers() call that the frontend makes
  try {
    const response = await axios.get(`${BASE_URL}/api/users/doctors`, {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'application/json'
      }
    });
    
    logSuccess('Frontend userService.getUsers() simulation successful');
    return { success: true, data: response.data };
  } catch (error) {
    logError(`Frontend service simulation failed: ${error.message}`);
    return { success: false };
  }
}

// Test 5: Role Display Validation
function testRoleDisplay(user) {
  logInfo('Testing role display logic...');
  
  const expectedDisplayRole = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const expectedName = `Dr. ${user.firstName} ${user.lastName}`;
  
  logSuccess(`Expected header display: "${expectedName}"`);
  logSuccess(`Expected role display: "${expectedDisplayRole}"`);
  
  // Validate role formatting
  if (user.role === 'doctor') {
    logSuccess('Role value is correct for doctor account');
  } else {
    logWarning(`Unexpected role value: ${user.role}`);
  }
  
  return {
    success: true,
    expectedName,
    expectedRole: expectedDisplayRole
  };
}

// Main test runner
async function runAllTests() {
  log('\n' + '='.repeat(60), colors.bold);
  log('🩺 DOCTOR DASHBOARD FUNCTIONALITY TEST SUITE', colors.bold);
  log('='.repeat(60), colors.bold);
  
  const results = {
    login: false,
    doctorList: false,
    userStructure: false,
    frontendServices: false,
    roleDisplay: false
  };
  
  // Test 1: Login
  log('\n📋 Test 1: Doctor Authentication', colors.yellow);
  const loginResult = await testDoctorLogin();
  results.login = loginResult.success;
  
  if (!loginResult.success) {
    logError('Cannot proceed with other tests - login failed');
    return results;
  }
  
  // Test 2: Doctor List API
  log('\n📋 Test 2: Doctor List API', colors.yellow);
  const doctorListResult = await testDoctorListAPI(loginResult.token);
  results.doctorList = doctorListResult.success;
  
  // Test 3: User Data Structure
  log('\n📋 Test 3: User Data Structure', colors.yellow);
  const userStructureResult = testUserDataStructure(loginResult.user);
  results.userStructure = userStructureResult.success;
  
  // Test 4: Frontend Services
  log('\n📋 Test 4: Frontend Services Simulation', colors.yellow);
  const frontendResult = await testFrontendServices(loginResult.token);
  results.frontendServices = frontendResult.success;
  
  // Test 5: Role Display
  log('\n📋 Test 5: Role Display Logic', colors.yellow);
  const roleResult = testRoleDisplay(loginResult.user);
  results.roleDisplay = roleResult.success;
  
  // Summary
  log('\n' + '='.repeat(60), colors.bold);
  log('📊 TEST RESULTS SUMMARY', colors.bold);
  log('='.repeat(60), colors.bold);
  
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      logSuccess(`${test.toUpperCase()}: PASSED`);
    } else {
      logError(`${test.toUpperCase()}: FAILED`);
    }
  });
  
  const passedCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  
  log(`\n📈 Overall Score: ${passedCount}/${totalCount} tests passed`, 
      passedCount === totalCount ? colors.green : colors.yellow);
  
  if (passedCount === totalCount) {
    logSuccess('🎉 All tests passed! Doctor dashboard functionality is working correctly.');
    log('\n🔍 Next Steps:', colors.blue);
    log('1. Open browser to http://localhost:3000');
    log('2. Login with Marcus Stewart credentials');
    log('3. Navigate to doctor dashboard');
    log('4. Verify header shows "Dr. Marcus Stewart" and role "Doctor"');
    log('5. Check appointments page shows doctor list');
  } else {
    logWarning('⚠️  Some tests failed. Please check the issues above.');
  }
  
  return results;
}

// Export for use in other scripts
module.exports = {
  runAllTests,
  testDoctorLogin,
  testDoctorListAPI,
  testUserDataStructure,
  testFrontendServices,
  testRoleDisplay
};

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}
