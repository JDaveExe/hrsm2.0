// Script to check patient data structure
const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function checkPatientData() {
  try {
    // Step 1: Login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, got authentication token');
    
    // Set the auth header for all subsequent requests
    const authHeader = { Authorization: `Bearer ${token}` };
    
    // Step 2: Get patient data
    console.log('\n🔍 Fetching patient data...');
    const patientsResponse = await axios.get(`${API_URL}/patients`, { 
      headers: authHeader 
    });
    
    const patients = patientsResponse.data;
    console.log(`Found ${patients.length} patients`);
    
    if (patients.length > 0) {
      // Display the first patient's data structure
      console.log('\n📋 First patient data structure:');
      const patient = patients[0];
      console.log(JSON.stringify(patient, null, 2));
      
      // Extract important fields
      console.log('\n🔑 Important patient fields:');
      console.log(`Patient ID: ${patient.id || patient._id}`);
      console.log(`Name: ${patient.firstName} ${patient.lastName}`);
      console.log(`Gender: ${patient.gender}`);
      console.log(`DOB: ${patient.dateOfBirth}`);
    } else {
      console.log('❌ No patients found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response status:', error.response.status);
    }
  }
}

checkPatientData();