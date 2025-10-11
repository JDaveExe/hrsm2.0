const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test appointment request submission
async function testAppointmentRequestSubmission() {
  console.log('🧪 Testing Appointment Request Submission...\n');
  
  try {
    // Test data for appointment request
    const appointmentRequestData = {
      patientId: 'PT-0001',
      patientName: 'Test Patient',
      appointmentType: 'General Consultation',
      requestedDate: '2025-09-20',
      requestedTime: '10:00',
      symptoms: 'Test symptoms - headache and fever',
      notes: 'Test notes - patient prefers morning appointments',
      status: 'pending',
      requestDate: new Date().toISOString()
    };

    console.log('📤 Submitting appointment request with data:');
    console.log(JSON.stringify(appointmentRequestData, null, 2));
    console.log();

    // Submit the appointment request
    const response = await axios.post(`${API_BASE_URL}/appointments/requests`, appointmentRequestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      }
    });

    console.log('✅ SUCCESS: Appointment request submitted!');
    console.log('Status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    console.log();

    const requestId = response.data.id;
    return { success: true, requestId, data: response.data };

  } catch (error) {
    console.log('❌ ERROR: Failed to submit appointment request');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log();
    return { success: false, error: error.response?.data || error.message };
  }
}

// Test fetching appointment requests
async function testFetchAppointmentRequests() {
  console.log('🔍 Testing Fetch Appointment Requests...\n');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/appointments/requests`, {
      headers: { 'x-auth-token': 'temp-admin-token' }
    });

    console.log('✅ SUCCESS: Fetched appointment requests!');
    console.log('Status:', response.status);
    console.log('Total requests:', response.data.length);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    console.log();

    return { success: true, data: response.data };

  } catch (error) {
    console.log('❌ ERROR: Failed to fetch appointment requests');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    console.log();
    return { success: false, error: error.response?.data || error.message };
  }
}

// Test endpoint availability
async function testEndpointsAvailability() {
  console.log('🌐 Testing Endpoints Availability...\n');
  
  const endpoints = [
    { name: 'Get Appointment Requests', url: `${API_BASE_URL}/appointments/requests`, method: 'GET' },
    { name: 'Submit Appointment Request', url: `${API_BASE_URL}/appointments/requests`, method: 'POST' }
  ];

  for (const endpoint of endpoints) {
    try {
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(endpoint.url, {
          headers: { 'x-auth-token': 'temp-admin-token' },
          timeout: 5000
        });
      } else {
        response = await axios.post(endpoint.url, {}, {
          headers: { 'x-auth-token': 'temp-admin-token' },
          timeout: 5000
        });
      }
      console.log(`✅ ${endpoint.name}: Available (${response.status})`);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ ${endpoint.name}: Not found (404)`);
      } else {
        console.log(`✅ ${endpoint.name}: Available (${error.response?.status})`);
      }
    }
  }
  console.log();
}

// Main test runner
async function runAppointmentRequestTests() {
  console.log('🚀 Starting Appointment Request Flow Tests\n');
  console.log('==================================================\n');

  await testEndpointsAvailability();
  const fetchResult = await testFetchAppointmentRequests();
  const submitResult = await testAppointmentRequestSubmission();

  if (submitResult.success) {
    await testFetchAppointmentRequests();
  }

  console.log('✨ Test completed!');
}

runAppointmentRequestTests().catch(console.error);