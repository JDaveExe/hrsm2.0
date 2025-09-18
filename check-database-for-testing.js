const axios = require('axios');

// Base configuration
const API_BASE = 'http://localhost:5000/api';
const AUTH_TOKEN = 'temp-admin-token';

// Test helper functions
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': AUTH_TOKEN
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

async function checkDatabaseData() {
  console.log('🔍 Checking database data for testing...\n');
  
  try {
    // Check patients
    console.log('📋 Checking patients:');
    const patientsResult = await apiCall('GET', '/patients');
    if (patientsResult.success) {
      console.log(`✅ Found ${patientsResult.data.length} patients`);
      if (patientsResult.data.length > 0) {
        console.log('First patient:', patientsResult.data[0]);
      }
    } else {
      console.log('❌ Failed to get patients:', patientsResult.error);
    }

    // Check doctors/users
    console.log('\n👨‍⚕️ Checking users/doctors:');
    const usersResult = await apiCall('GET', '/users');
    if (usersResult.success) {
      console.log(`✅ Found ${usersResult.data.length} users`);
      if (usersResult.data.length > 0) {
        console.log('First user:', usersResult.data[0]);
      }
    } else {
      console.log('❌ Failed to get users:', usersResult.error);
    }

    // Check existing appointments
    console.log('\n📅 Checking existing appointments:');
    const appointmentsResult = await apiCall('GET', '/appointments');
    if (appointmentsResult.success) {
      console.log(`✅ Found ${appointmentsResult.data.length} appointments`);
      if (appointmentsResult.data.length > 0) {
        console.log('First appointment:', appointmentsResult.data[0]);
      }
    } else {
      console.log('❌ Failed to get appointments:', appointmentsResult.error);
    }

  } catch (error) {
    console.error('💥 Check failed:', error.message);
  }
}

checkDatabaseData();