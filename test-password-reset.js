/**
 * Simple Password Reset Test
 * Tests the patient password reset functionality
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

const API_BASE = 'http://localhost:5000/api';
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

console.log('======================================================================');
console.log('  🔐 PASSWORD RESET TEST');
console.log('======================================================================\n');

async function runTest() {
  let connection;
  let userId, patientId, token;
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  const testEmail = `passtest${timestamp}${random}@example.com`;
  const testPhone = `0912${timestamp.toString().slice(-6)}${random.toString().slice(-2)}`;
  const originalPassword = 'Password123!';
  const newPassword = 'NewPassword456!';
  
  try {
    // Connect to database
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✓ Connected to database\n');
    
    // STEP 1: Register a new patient
    console.log('▶ STEP 1: Registering New Patient');
    console.log('  Email:', testEmail);
    console.log('  Phone:', testPhone);
    console.log('  Password:', originalPassword);
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      firstName: 'TestUser',
      middleName: 'Middle',
      lastName: 'PasswordTest',
      suffix: '',
      dateOfBirth: '1995-05-15',
      gender: 'Male',
      civilStatus: 'Single',
      email: testEmail,
      phoneNumber: testPhone, // Changed from contactNumber to phoneNumber
      houseNo: '',
      street: '',
      barangay: '',
      city: 'Metro Manila',
      region: 'NCR',
      philHealthNumber: '',
      bloodType: '',
      medicalConditions: '',
      password: originalPassword
    });
    
    token = registerResponse.data.token;
    userId = registerResponse.data.user.id;
    patientId = registerResponse.data.user.patientId;
    
    console.log('✓ Registration successful!');
    console.log('  User ID:', userId);
    console.log('  Patient ID:', patientId);
    console.log('  Token:', token.substring(0, 20) + '...\n');
    
    // STEP 2: Login with original password
    console.log('▶ STEP 2: Testing Login with ORIGINAL Password');
    console.log('  Email:', testEmail);
    console.log('  Password:', originalPassword);
    
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        login: testEmail,
        password: originalPassword
      });
      console.log('✓ ✓✓✓ Login with ORIGINAL password SUCCESSFUL! ✓✓✓\n');
    } catch (error) {
      console.log('✗ ✗✗✗ Login with ORIGINAL password FAILED! ✗✗✗');
      console.log('  Error:', error.response?.data?.msg || error.message);
      throw new Error('Original password login failed');
    }
    
    // STEP 3: Update password through profile
    console.log('▶ STEP 3: Updating Password via Profile');
    console.log('  New Password:', newPassword);
    
    const updateResponse = await axios.put(
      `${API_BASE}/patients/me/profile`,
      { password: newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✓ Profile update request successful!\n');
    
    // STEP 4: Try to login with OLD password (should fail)
    console.log('▶ STEP 4: Testing Login with OLD Password (should fail)');
    console.log('  Email:', testEmail);
    console.log('  Password:', originalPassword);
    
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        login: testEmail,
        password: originalPassword
      });
      console.log('✗ ✗✗✗ ERROR: Old password still works! ✗✗✗\n');
      throw new Error('Old password should not work after reset');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ ✓✓✓ Login with OLD password correctly FAILED! ✓✓✓\n');
      } else {
        throw error;
      }
    }
    
    // STEP 5: Login with NEW password
    console.log('▶ STEP 5: Testing Login with NEW Password');
    console.log('  Email:', testEmail);
    console.log('  Password:', newPassword);
    
    try {
      const newLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
        login: testEmail,
        password: newPassword
      });
      console.log('✓ ✓✓✓ Login with NEW password SUCCESSFUL! ✓✓✓');
      console.log('  Token:', newLoginResponse.data.token.substring(0, 20) + '...');
      console.log('  User:', newLoginResponse.data.user.username, '\n');
    } catch (error) {
      console.log('✗ ✗✗✗ Login with NEW password FAILED! ✗✗✗');
      console.log('  Error:', error.response?.data?.msg || error.message);
      throw new Error('New password login failed');
    }
    
    // STEP 6: Also test login with phone number
    console.log('▶ STEP 6: Testing Login with Phone Number + NEW Password');
    console.log('  Phone:', testPhone);
    console.log('  Password:', newPassword);
    
    try {
      const phoneLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
        login: testPhone,
        password: newPassword
      });
      console.log('✓ ✓✓✓ Login with PHONE + NEW password SUCCESSFUL! ✓✓✓\n');
    } catch (error) {
      console.log('✗ ✗✗✗ Login with PHONE + NEW password FAILED! ✗✗✗');
      console.log('  Error:', error.response?.data?.msg || error.message);
      throw new Error('Phone login with new password failed');
    }
    
    // STEP 7: Clean up
    console.log('▶ STEP 7: Cleaning Up Test Data');
    await connection.execute('DELETE FROM patients WHERE id = ?', [patientId]);
    console.log('✓ Deleted patient record (ID:', patientId + ')');
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    console.log('✓ Deleted user record (ID:', userId + ')');
    
    // Success summary
    console.log('\n======================================================================');
    console.log('  📊 TEST RESULTS SUMMARY');
    console.log('======================================================================\n');
    console.log('  Registration: ✅ PASS');
    console.log('  Login with Original Password: ✅ PASS');
    console.log('  Password Update: ✅ PASS');
    console.log('  Old Password Rejected: ✅ PASS');
    console.log('  Login with New Password: ✅ PASS');
    console.log('  Login with Phone + New Password: ✅ PASS');
    console.log('\n======================================================================\n');
    console.log('  🎉 SUCCESS! Password reset is working perfectly!\n');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Clean up on error
    if (connection && patientId && userId) {
      try {
        console.log('\n▶ Cleaning up test data...');
        await connection.execute('DELETE FROM patients WHERE id = ?', [patientId]);
        await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
        console.log('✓ Cleanup completed');
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError.message);
      }
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('ℹ Database connection closed\n');
    }
  }
}

runTest();
