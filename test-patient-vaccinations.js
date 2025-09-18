/**
 * Test script to verify patient vaccination endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testPatientVaccinations() {
  try {
    console.log('🧪 Testing patient vaccination history endpoint...');

    // Step 1: Login to get token
    console.log('1. Authenticating...');
    const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });

    if (!authResponse.data.token) {
      throw new Error('Authentication failed');
    }

    const token = authResponse.data.token;
    console.log('✅ Authentication successful');

    // Step 2: Test getting vaccinations for Sofia's patient ID (104)
    console.log('2. Fetching vaccination records for patient 104 (Sofia Gonzales)...');
    
    const response = await axios.get(`${BASE_URL}/api/vaccinations/patient/104`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      console.log('✅ Successfully fetched vaccination records!');
      console.log('📋 Response data:', JSON.stringify(response.data, null, 2));
      console.log('📊 Number of vaccination records:', response.data.length);
    } else {
      console.log('❌ Unexpected status code:', response.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPatientVaccinations();