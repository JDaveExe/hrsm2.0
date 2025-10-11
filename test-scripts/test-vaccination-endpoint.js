/**
 * Test script to verify the vaccination endpoint is working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testVaccinationEndpoint() {
  try {
    console.log('🧪 Testing vaccination endpoint...');

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

    // Step 2: Test vaccination record creation
    console.log('2. Creating vaccination record...');
    
    const vaccinationData = {
      patientId: 40, // Josuke's patient ID
      vaccineName: 'Test COVID-19 Vaccine',
      batchNumber: 'TEST-001-2024',
      expiryDate: '2025-12-31',
      administeredBy: 'Dr. Test Doctor',
      administrationSite: 'Left upper arm',
      administrationRoute: 'Intramuscular',
      doseNumber: 1,
      notes: 'Test vaccination from validation script',
      adverseReactions: 'None observed'
    };

    const vaccinationResponse = await axios.post(`${BASE_URL}/api/vaccinations`, vaccinationData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (vaccinationResponse.status === 201 || vaccinationResponse.status === 200) {
      console.log('✅ Vaccination record created successfully!');
      console.log('📋 Response:', vaccinationResponse.data);
    } else {
      console.log('❌ Unexpected status code:', vaccinationResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testVaccinationEndpoint();