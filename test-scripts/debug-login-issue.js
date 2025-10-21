/**
 * Debug Login Flow - Check why login fails after credential update
 */

const axios = require('axios');
const mysql = require('mysql2/promise');

const API_URL = 'http://localhost:5000';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  step: (msg) => console.log(`\n${colors.magenta}▶${colors.reset} ${colors.magenta}${msg}${colors.reset}`),
};

// Test with existing user from previous test
const testLogin = {
  email: 'updated1759745781483@example.com',
  phone: '09987651483',
  password: 'Password123!'
};

async function checkPasswordHash() {
  log.step('Checking Password Hash in Database');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'hrsm2'
    });
    
    // Find a user with this email
    const [rows] = await connection.execute(
      'SELECT id, username, email, contactNumber, password, role FROM users WHERE email = ? OR username = ? LIMIT 1',
      [testLogin.email, testLogin.email]
    );
    
    if (rows.length > 0) {
      const user = rows[0];
      log.success('Found user in database:');
      console.log('  User ID:', user.id);
      console.log('  Username:', user.username);
      console.log('  Email:', user.email);
      console.log('  Contact:', user.contactNumber);
      console.log('  Role:', user.role);
      console.log('  Password Hash:', user.password.substring(0, 20) + '...');
      console.log('  Hash Length:', user.password.length);
      console.log('  Hash starts with $2a$ or $2b$?', user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
      
      // Try to verify password using bcrypt
      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(testLogin.password, user.password);
      console.log('\n  Password Match Test:', isMatch ? '✅ MATCHES' : '❌ DOES NOT MATCH');
      
      await connection.end();
      return user;
    } else {
      log.error('No user found with that email');
      await connection.end();
      return null;
    }
  } catch (error) {
    log.error(`Database check failed: ${error.message}`);
    return null;
  }
}

async function testLoginAPI() {
  log.step('Testing Login API');
  
  console.log('Attempting login with:');
  console.log('  Email:', testLogin.email);
  console.log('  Password:', testLogin.password);
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      login: testLogin.email,
      password: testLogin.password
    });
    
    if (response.data && response.data.token) {
      log.success('✅ Login SUCCESSFUL!');
      console.log('  Token:', response.data.token.substring(0, 20) + '...');
      console.log('  User:', response.data.user);
      return true;
    }
  } catch (error) {
    log.error('❌ Login FAILED!');
    console.log('  Status:', error.response?.status);
    console.log('  Error:', error.response?.data?.msg || error.message);
    console.log('  Full Response:', JSON.stringify(error.response?.data, null, 2));
    return false;
  }
}

async function run() {
  console.log('\n' + '='.repeat(70));
  console.log('  🔍 LOGIN DEBUG TEST');
  console.log('='.repeat(70));
  
  const user = await checkPasswordHash();
  
  if (user) {
    await testLoginAPI();
  }
  
  console.log('\n' + '='.repeat(70));
}

run().catch(console.error);
