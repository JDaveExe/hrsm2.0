/**
 * Complete Test: Register → Update Credentials → Login
 * This script tests the entire flow to identify where the credential update issue occurs
 */

const axios = require('axios');
const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

const API_URL = 'http://localhost:5000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.magenta}▶${colors.reset} ${colors.magenta}${msg}${colors.reset}`),
  data: (label, data) => console.log(`  ${colors.blue}${label}:${colors.reset}`, data)
};

// Generate unique test data
const timestamp = Date.now();
const testData = {
  original: {
    firstName: 'TestUser',
    middleName: 'Middle',
    lastName: 'Original',
    email: `testuser${timestamp}@example.com`,
    phoneNumber: `0912345${String(timestamp).slice(-4)}`,
    password: 'Password123!',
    dateOfBirth: '1995-05-15',
    gender: 'Male',
    civilStatus: 'Single'
  },
  updated: {
    email: `updated${timestamp}@example.com`,
    phoneNumber: `0998765${String(timestamp).slice(-4)}`
  }
};

let authToken = null;
let patientId = null;
let userId = null;

// Database connection
async function connectToDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: process.env.DB_PASSWORD || '', // Empty password is common default
      database: 'hrsm2'
    });
    log.success('Connected to database');
    return connection;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    log.warn('If you see "Access denied", update the password in the script or set DB_PASSWORD env variable');
    throw error;
  }
}

// Step 1: Register new patient
async function registerPatient() {
  log.step('STEP 1: Registering New Patient');
  log.data('Email', testData.original.email);
  log.data('Phone', testData.original.phoneNumber);
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, testData.original);
    
    if (response.data && response.data.token) {
      authToken = response.data.token;
      patientId = response.data.user.patientId;
      userId = response.data.user.id;
      
      log.success('Registration successful!');
      log.data('Token', authToken.substring(0, 20) + '...');
      log.data('User ID', userId);
      log.data('Patient ID', patientId);
      return true;
    } else {
      log.error('Registration failed: No token received');
      log.data('Response', response.data);
      return false;
    }
  } catch (error) {
    log.error(`Registration failed: ${error.response?.data?.msg || error.message}`);
    if (error.response?.data) {
      log.data('Error Details', error.response.data);
    }
    return false;
  }
}

// Step 2: Check database before update
async function checkDatabaseBeforeUpdate(connection) {
  log.step('STEP 2: Checking Database BEFORE Update');
  
  try {
    const [userRows] = await connection.execute(
      'SELECT id, username, email, contactNumber, role FROM users WHERE id = ?',
      [userId]
    );
    
    const [patientRows] = await connection.execute(
      'SELECT id, userId, firstName, lastName, email, contactNumber FROM patients WHERE id = ?',
      [patientId]
    );
    
    log.success('Database records found:');
    console.log('\n  📋 User Table:');
    console.table(userRows);
    console.log('  📋 Patient Table:');
    console.table(patientRows);
    
    return { user: userRows[0], patient: patientRows[0] };
  } catch (error) {
    log.error(`Database check failed: ${error.message}`);
    return null;
  }
}

// Step 3: Update credentials
async function updateCredentials() {
  log.step('STEP 3: Updating Patient Credentials');
  log.data('New Email', testData.updated.email);
  log.data('New Phone', testData.updated.phoneNumber);
  
  try {
    const response = await axios.put(
      `${API_URL}/api/patients/me/profile`,
      {
        email: testData.updated.email,
        contactNumber: testData.updated.phoneNumber
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data) {
      log.success('Credentials updated successfully!');
      log.data('Response', response.data);
      return true;
    } else {
      log.error('Update failed: No response data');
      return false;
    }
  } catch (error) {
    log.error(`Update failed: ${error.response?.data?.msg || error.message}`);
    if (error.response?.data) {
      log.data('Error Details', error.response.data);
    }
    return false;
  }
}

// Step 4: Check database after update
async function checkDatabaseAfterUpdate(connection) {
  log.step('STEP 4: Checking Database AFTER Update');
  
  try {
    const [userRows] = await connection.execute(
      'SELECT id, username, email, contactNumber, role FROM users WHERE id = ?',
      [userId]
    );
    
    const [patientRows] = await connection.execute(
      'SELECT id, userId, firstName, lastName, email, contactNumber FROM patients WHERE id = ?',
      [patientId]
    );
    
    log.success('Database records after update:');
    console.log('\n  📋 User Table:');
    console.table(userRows);
    console.log('  📋 Patient Table:');
    console.table(patientRows);
    
    // Check if username was updated
    const user = userRows[0];
    if (user.username === testData.updated.email || user.username === testData.updated.phoneNumber) {
      log.success('✓ Username was updated correctly!');
    } else {
      log.error('✗ Username was NOT updated!');
      log.warn(`Expected: ${testData.updated.email} or ${testData.updated.phoneNumber}`);
      log.warn(`Got: ${user.username}`);
    }
    
    return { user: userRows[0], patient: patientRows[0] };
  } catch (error) {
    log.error(`Database check failed: ${error.message}`);
    return null;
  }
}

// Step 5: Try login with OLD credentials
async function loginWithOldCredentials() {
  log.step('STEP 5: Testing Login with OLD Email');
  log.data('Email', testData.original.email);
  log.data('Password', testData.original.password);
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      login: testData.original.email,
      password: testData.original.password
    });
    
    if (response.data && response.data.token) {
      log.warn('⚠ Login with OLD email succeeded (should have failed!)');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      log.success('✓ Login with OLD email failed as expected');
      log.data('Error', error.response.data.msg);
      return false;
    } else {
      log.error(`Unexpected error: ${error.message}`);
      return null;
    }
  }
}

// Step 6: Try login with NEW credentials
async function loginWithNewCredentials() {
  log.step('STEP 6: Testing Login with NEW Email');
  log.data('Email', testData.updated.email);
  log.data('Password', testData.original.password);
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      login: testData.updated.email,
      password: testData.original.password
    });
    
    if (response.data && response.data.token) {
      log.success('✓✓✓ Login with NEW email SUCCESSFUL! ✓✓✓');
      log.data('Token', response.data.token.substring(0, 20) + '...');
      log.data('User', response.data.user);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      log.error('✗✗✗ Login with NEW email FAILED! ✗✗✗');
      log.data('Error', error.response.data.msg);
      return false;
    } else {
      log.error(`Unexpected error: ${error.message}`);
      return null;
    }
  }
}

// Step 7: Try login with NEW phone
async function loginWithNewPhone() {
  log.step('STEP 7: Testing Login with NEW Phone Number');
  log.data('Phone', testData.updated.phoneNumber);
  log.data('Password', testData.original.password);
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      login: testData.updated.phoneNumber,
      password: testData.original.password
    });
    
    if (response.data && response.data.token) {
      log.success('✓✓✓ Login with NEW phone SUCCESSFUL! ✓✓✓');
      log.data('Token', response.data.token.substring(0, 20) + '...');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 400) {
      log.error('✗✗✗ Login with NEW phone FAILED! ✗✗✗');
      log.data('Error', error.response.data.msg);
      return false;
    } else {
      log.error(`Unexpected error: ${error.message}`);
      return null;
    }
  }
}

// Step 8: Cleanup test data
async function cleanupTestData(connection) {
  log.step('STEP 8: Cleaning Up Test Data');
  
  try {
    // Delete patient first (foreign key)
    await connection.execute('DELETE FROM patients WHERE id = ?', [patientId]);
    log.success(`Deleted patient record (ID: ${patientId})`);
    
    // Delete user
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    log.success(`Deleted user record (ID: ${userId})`);
    
    return true;
  } catch (error) {
    log.error(`Cleanup failed: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runTest() {
  console.log('\n' + '='.repeat(70));
  console.log('  🧪 COMPLETE CREDENTIAL UPDATE & LOGIN TEST');
  console.log('='.repeat(70) + '\n');
  
  let connection;
  
  try {
    // Connect to database
    connection = await connectToDatabase();
    
    // Step 1: Register
    const registered = await registerPatient();
    if (!registered) {
      log.error('Test aborted: Registration failed');
      return;
    }
    
    // Wait a bit for database to sync
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 2: Check DB before update
    const beforeUpdate = await checkDatabaseBeforeUpdate(connection);
    if (!beforeUpdate) {
      log.error('Test aborted: Could not read database');
      return;
    }
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 3: Update credentials
    const updated = await updateCredentials();
    if (!updated) {
      log.error('Test aborted: Update failed');
      await cleanupTestData(connection);
      return;
    }
    
    // Wait for update to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Check DB after update
    const afterUpdate = await checkDatabaseAfterUpdate(connection);
    if (!afterUpdate) {
      log.error('Test aborted: Could not read database');
      await cleanupTestData(connection);
      return;
    }
    
    // Step 5-7: Login tests
    await loginWithOldCredentials();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newEmailLoginSuccess = await loginWithNewCredentials();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newPhoneLoginSuccess = await loginWithNewPhone();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 8: Cleanup
    await cleanupTestData(connection);
    
    // Final results
    console.log('\n' + '='.repeat(70));
    console.log('  📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70) + '\n');
    
    console.log('  Registration:', registered ? '✅ PASS' : '❌ FAIL');
    console.log('  Credential Update:', updated ? '✅ PASS' : '❌ FAIL');
    console.log('  Login with NEW Email:', newEmailLoginSuccess ? '✅ PASS' : '❌ FAIL');
    console.log('  Login with NEW Phone:', newPhoneLoginSuccess ? '✅ PASS' : '❌ FAIL');
    
    console.log('\n' + '='.repeat(70));
    
    if (newEmailLoginSuccess || newPhoneLoginSuccess) {
      console.log(`\n  ${colors.green}🎉 SUCCESS! Credential update is working!${colors.reset}\n`);
    } else {
      console.log(`\n  ${colors.red}❌ FAILED! Credential update is NOT working!${colors.reset}`);
      console.log(`  ${colors.yellow}Check the database comparison above to see what's wrong.${colors.reset}\n`);
    }
    
  } catch (error) {
    log.error(`Test failed with error: ${error.message}`);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      log.info('Database connection closed');
    }
  }
}

// Run the test
runTest().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
