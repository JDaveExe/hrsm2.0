/**
 * Admin Password Reset Test
 * Tests admin's ability to reset patient passwords
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
console.log('  🔐 ADMIN PASSWORD RESET TEST');
console.log('======================================================================\n');

async function runTest() {
  let connection;
  let userId, patientId, adminToken, patientEmail;
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  
  patientEmail = `admintest${timestamp}${random}@example.com`;
  const testPhone = `09${String(timestamp).slice(-9)}`; // Ensure 11-digit format
  const originalPassword = 'Password123!';
  const newPasswordByAdmin = 'AdminReset456!';
  
  try {
    // Connect to database
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✓ Connected to database\n');
    
    // STEP 1: Login as admin
    console.log('▶ STEP 1: Logging in as Admin');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    adminToken = adminLogin.data.token;
    console.log('✓ Admin logged in successfully');
    console.log('  Token:', adminToken.substring(0, 20) + '...\n');
    
    // STEP 2: Create a test patient
    console.log('▶ STEP 2: Creating Test Patient');
    console.log('  Email:', patientEmail);
    console.log('  Phone:', testPhone);
    console.log('  Original Password:', originalPassword);
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      firstName: 'AdminTest',
      middleName: 'Middle',
      lastName: 'Patient',
      suffix: '',
      dateOfBirth: '1995-05-15',
      gender: 'Male',
      civilStatus: 'Single',
      email: patientEmail,
      phoneNumber: testPhone,
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
    
    userId = registerResponse.data.user.id;
    patientId = registerResponse.data.user.patientId;
    
    console.log('✓ Patient created successfully!');
    console.log('  User ID:', userId);
    console.log('  Patient ID:', patientId + '\n');
    
    // STEP 3: Patient logs in with original password
    console.log('▶ STEP 3: Patient Login with ORIGINAL Password');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        login: patientEmail,
        password: originalPassword
      });
      console.log('✓ ✓✓✓ Patient login with ORIGINAL password SUCCESSFUL! ✓✓✓\n');
    } catch (error) {
      console.log('✗ Patient login failed');
      throw error;
    }
    
    // STEP 4: Admin resets patient's password
    console.log('▶ STEP 4: Admin Resets Patient Password');
    console.log('  New Password:', newPasswordByAdmin);
    
    const updateResponse = await axios.put(
      `${API_BASE}/patients/${patientId}`,
      { 
        firstName: 'AdminTest',
        lastName: 'Patient',
        dateOfBirth: '1995-05-15',
        gender: 'Male',
        civilStatus: 'Single',
        contactNumber: testPhone,
        password: newPasswordByAdmin
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    console.log('✓ Admin updated patient password successfully!\n');
    
    // STEP 5: Patient tries old password (should fail)
    console.log('▶ STEP 5: Patient Login with OLD Password (should fail)');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        login: patientEmail,
        password: originalPassword
      });
      console.log('✗ ✗✗✗ ERROR: Old password still works! ✗✗✗\n');
      throw new Error('Old password should not work after admin reset');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✓ ✓✓✓ Login with OLD password correctly FAILED! ✓✓✓\n');
      } else {
        throw error;
      }
    }
    
    // STEP 6: Patient logs in with NEW password set by admin
    console.log('▶ STEP 6: Patient Login with NEW Password (set by admin)');
    try {
      const newLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
        login: patientEmail,
        password: newPasswordByAdmin
      });
      console.log('✓ ✓✓✓ Patient login with NEW password SUCCESSFUL! ✓✓✓');
      console.log('  Token:', newLoginResponse.data.token.substring(0, 20) + '...');
      console.log('  User:', newLoginResponse.data.user.username + '\n');
    } catch (error) {
      console.log('✗ ✗✗✗ Login with NEW password FAILED! ✗✗✗');
      console.log('  Error:', error.response?.data?.msg || error.message);
      throw new Error('New password should work after admin reset');
    }
    
    // STEP 7: Also test with phone number
    console.log('▶ STEP 7: Patient Login with Phone + NEW Password');
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        login: testPhone,
        password: newPasswordByAdmin
      });
      console.log('✓ ✓✓✓ Login with PHONE + NEW password SUCCESSFUL! ✓✓✓\n');
    } catch (error) {
      console.log('✗ Login with phone failed');
      console.log('  Error:', error.response?.data?.msg || error.message);
      throw error;
    }
    
    // STEP 8: Clean up
    console.log('▶ STEP 8: Cleaning Up Test Data');
    await connection.execute('DELETE FROM patients WHERE id = ?', [patientId]);
    console.log('✓ Deleted patient record (ID:', patientId + ')');
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    console.log('✓ Deleted user record (ID:', userId + ')');
    
    // Success summary
    console.log('\n======================================================================');
    console.log('  📊 TEST RESULTS SUMMARY');
    console.log('======================================================================\n');
    console.log('  Admin Login: ✅ PASS');
    console.log('  Patient Creation: ✅ PASS');
    console.log('  Patient Login (Original Password): ✅ PASS');
    console.log('  Admin Password Reset: ✅ PASS');
    console.log('  Old Password Rejected: ✅ PASS');
    console.log('  Patient Login (New Password): ✅ PASS');
    console.log('  Login with Phone + New Password: ✅ PASS');
    console.log('\n======================================================================\n');
    console.log('  🎉 SUCCESS! Admin password reset is working perfectly!\n');
    
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
