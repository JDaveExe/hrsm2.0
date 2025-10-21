const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  step: (msg) => console.log(`\n${colors.bright}${colors.blue}▶ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.yellow}ℹ ${msg}${colors.reset}`),
  data: (label, value) => console.log(`   ${colors.cyan}${label}:${colors.reset} ${JSON.stringify(value, null, 2)}`)
};

async function testAdminPatientCreation() {
  let adminToken;
  
  try {
    console.log(`${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}TESTING ADMIN PATIENT CREATION${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    
    // Step 1: Login as admin
    log.step('STEP 1: Login as Admin');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        login: 'admin',
        password: 'admin123'
      });
      
      adminToken = loginResponse.data.token;
      log.success('Admin login successful');
      log.data('Token (first 30 chars)', adminToken.substring(0, 30) + '...');
      log.data('Admin Info', {
        firstName: loginResponse.data.firstName,
        lastName: loginResponse.data.lastName,
        role: loginResponse.data.role
      });
    } catch (error) {
      log.error('Admin login failed!');
      log.data('Error', error.response?.data || error.message);
      return;
    }
    
    // Step 2: Create patient with admin token
    log.step('STEP 2: Create Patient as Admin');
    
    const timestamp = Date.now().toString().slice(-6);
    const testPatient = {
      firstName: 'AdminTest',
      middleName: 'API',
      lastName: 'Patient',
      suffix: '',
      dateOfBirth: '1995-08-20',
      gender: 'Male',
      civilStatus: 'Single',
      contactNumber: `09${timestamp}123`,
      email: `admintest${timestamp}@example.com`,
      houseNo: '123',
      street: 'Test Street',
      purok: 'Purok 1',
      city: 'Pasig City',
      region: 'NCR',
      philHealthNumber: '',
      bloodType: 'O+',
      membershipStatus: 'Non-Member'
    };
    
    log.info('Patient data to create:');
    log.data('Name', `${testPatient.firstName} ${testPatient.lastName}`);
    log.data('Contact', testPatient.contactNumber);
    log.data('Email', testPatient.email);
    log.data('Date of Birth', testPatient.dateOfBirth);
    
    try {
      log.info('Sending POST request to /api/patients with Authorization header...');
      
      const createResponse = await axios.post(`${API_URL}/patients`, testPatient, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      log.success('Patient created successfully!');
      log.data('Response', {
        id: createResponse.data.id,
        firstName: createResponse.data.firstName,
        lastName: createResponse.data.lastName,
        hasUserAccount: createResponse.data.hasUserAccount,
        generatedPassword: createResponse.data.generatedPassword
      });
      
      if (createResponse.data.generatedPassword) {
        console.log(`\n${colors.bright}${colors.green}🔑 Generated Login Credentials:${colors.reset}`);
        console.log(`   Email: ${createResponse.data.email}`);
        console.log(`   Phone: ${createResponse.data.contactNumber}`);
        console.log(`   Password: ${createResponse.data.generatedPassword}`);
      }
      
    } catch (error) {
      log.error('Patient creation FAILED!');
      log.data('Status Code', error.response?.status);
      log.data('Error Message', error.response?.data?.msg || error.message);
      
      if (error.response?.data) {
        log.data('Full Error Response', error.response.data);
      }
      
      // Additional debugging
      if (error.response?.status === 401) {
        console.log(`\n${colors.red}${colors.bright}⚠️  401 UNAUTHORIZED ERROR${colors.reset}`);
        console.log(`${colors.yellow}This means the authentication token is either:`);
        console.log(`   1. Missing from the request`);
        console.log(`   2. Invalid or expired`);
        console.log(`   3. Not properly formatted${colors.reset}`);
        
        log.info('Token used in request:');
        console.log(`   ${adminToken.substring(0, 50)}...`);
      }
      
      if (error.response?.data?.errors) {
        log.info('Validation errors:');
        error.response.data.errors.forEach(err => {
          console.log(`   - ${err.msg} (field: ${err.path || err.param})`);
        });
      }
    }
    
    // Step 3: Compare with public registration (should work)
    log.step('STEP 3: Test Public Registration (for comparison)');
    
    const timestamp2 = Date.now().toString().slice(-6);
    const publicPatient = {
      firstName: 'PublicTest',
      middleName: 'API',
      lastName: 'Patient',
      suffix: '',
      dateOfBirth: '1995-08-20',
      gender: 'Female',
      civilStatus: 'Single',
      phoneNumber: `09${timestamp2}456`,
      email: `publictest${timestamp2}@example.com`,
      houseNo: '456',
      street: 'Public Street',
      purok: 'Purok 2',
      city: 'Pasig City',
      region: 'NCR',
      philHealthNumber: '',
      bloodType: 'A+',
      password: 'Test123!'
    };
    
    try {
      log.info('Creating patient via public registration endpoint...');
      const registerResponse = await axios.post(`${API_URL}/auth/register`, publicPatient);
      
      log.success('Public registration successful!');
      log.data('Response', {
        firstName: registerResponse.data.firstName,
        lastName: registerResponse.data.lastName,
        role: registerResponse.data.role,
        hasToken: !!registerResponse.data.token
      });
      
    } catch (error) {
      log.error('Public registration also failed!');
      log.data('Error', error.response?.data || error.message);
    }
    
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}TEST COMPLETE${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${'='.repeat(70)}${colors.reset}\n`);
    
  } catch (error) {
    log.error('Unexpected error during test!');
    console.error(error);
  }
}

// Run the test
testAdminPatientCreation();
