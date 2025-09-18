// Script to test the appointments API and see what data is being returned
const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function testAppointmentsAPI() {
  try {
    // Step 1: Login as admin
    console.log('🔐 Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    
    const authHeader = { Authorization: `Bearer ${token}` };
    
    // Step 2: Test all appointments endpoint
    console.log('\n🔍 Testing /api/appointments endpoint...');
    const allAppointmentsResponse = await axios.get(`${API_URL}/appointments`, { 
      headers: authHeader 
    });
    
    console.log(`📊 All Appointments Response (${allAppointmentsResponse.data.length} items):`);
    allAppointmentsResponse.data.forEach((appt, index) => {
      console.log(`\n📌 APPOINTMENT #${index + 1}:`);
      console.log(`ID: ${appt.id}`);
      console.log(`Patient: ${appt.patient?.firstName} ${appt.patient?.lastName}`);
      console.log(`Date: ${appt.appointmentDate}`);
      console.log(`Time: ${appt.appointmentTime}`);
      console.log(`Type: ${appt.type}`);
      console.log(`Status: ${appt.status}`);
    });
    
    // Step 3: Test today's appointments endpoint
    console.log('\n\n🔍 Testing /api/appointments/today endpoint...');
    const todayAppointmentsResponse = await axios.get(`${API_URL}/appointments/today`, { 
      headers: authHeader 
    });
    
    console.log(`📊 Today's Appointments Response (${todayAppointmentsResponse.data.length} items):`);
    todayAppointmentsResponse.data.forEach((appt, index) => {
      console.log(`\n📌 TODAY'S APPOINTMENT #${index + 1}:`);
      console.log(`ID: ${appt.id}`);
      console.log(`Patient: ${appt.patient_name || appt.Patient?.firstName + ' ' + appt.Patient?.lastName}`);
      console.log(`Date: ${appt.appointment_date}`);
      console.log(`Time: ${appt.appointment_time}`);
      console.log(`Type: ${appt.type}`);
      console.log(`Status: ${appt.status}`);
    });
    
    // Step 4: Check network requests from the frontend perspective
    console.log('\n\n🌐 Testing the exact same requests the frontend would make...');
    
    // Test without authentication (as the frontend might be doing)
    try {
      const frontendResponse = await axios.get(`${API_URL}/appointments`);
      console.log('⚠️ Frontend request WITHOUT auth succeeded - this might be the issue!');
      console.log(`Response: ${frontendResponse.data.length} appointments`);
    } catch (error) {
      console.log('✅ Frontend request WITHOUT auth failed (as expected)');
      console.log(`Error: ${error.response?.status} - ${error.response?.data?.msg || error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response status:', error.response.status);
    }
  }
}

testAppointmentsAPI();