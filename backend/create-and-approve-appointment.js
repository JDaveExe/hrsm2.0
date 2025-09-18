// This script creates and approves a test appointment using the backend API
const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function createAndApproveAppointment() {
  try {
    // Step 1: Login as admin
    console.log('� Logging in as admin...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful, got authentication token');
    
    // Set the auth header for all subsequent requests
    const authHeader = { Authorization: `Bearer ${token}` };
    
    // Step 2: Check existing appointments
    console.log('\n�🔍 Checking existing appointments...');
    const response = await axios.get(`${API_URL}/appointments`, { 
      headers: authHeader 
    });
    
    const appointments = response.data;
    console.log(`Found ${appointments.length} appointments`);
    
    // Check if there are any pending appointments
    if (appointments.length > 0) {
      const pendingAppointments = appointments.filter(appt => appt.status === 'pending');
      console.log(`Found ${pendingAppointments.length} pending appointments`);
      
      if (pendingAppointments.length > 0) {
        // Approve the first pending appointment
        const appointmentToApprove = pendingAppointments[0];
        console.log(`\n🔄 Approving appointment ID: ${appointmentToApprove._id}`);
        
        const approveResponse = await axios.put(
          `${API_URL}/appointments/${appointmentToApprove._id}/status`, 
          { status: 'approved' },
          { headers: authHeader }
        );
        
        console.log('✅ Appointment approved successfully');
        console.log(`👉 Appointment details: ${JSON.stringify(appointmentToApprove, null, 2)}`);
        return;
      }
    }
    
    // Step 3: If no pending appointments, create a new one
    console.log('\n🆕 Creating a new test appointment...');
    
    // First get a list of patients to use a valid patientId
    const patientsResponse = await axios.get(`${API_URL}/patients`, { 
      headers: authHeader 
    });
    
    const patients = patientsResponse.data;
    
    if (patients.length === 0) {
      console.log('❌ No patients found to create an appointment');
      return;
    }
    
    const patient = patients[0];
    console.log(`Using patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
    
    // Create a new appointment
    const today = new Date();
    const hours = String(15 + Math.floor(Math.random() * 3)).padStart(2, '0');
    const minutes = ['00', '15', '30', '45'][Math.floor(Math.random() * 4)];
    const randomTime = `${hours}:${minutes}`;
    
    const newAppointment = {
      patientId: patient.id,
      appointmentDate: today.toISOString().split('T')[0],
      appointmentTime: randomTime,  // Random time to avoid conflicts
      type: 'Check-up',
      symptoms: 'Fever, headache, fatigue',
      notes: 'Test appointment created for verification'
    };
    
    console.log('Creating appointment with data:', JSON.stringify(newAppointment, null, 2));
    
    const createResponse = await axios.post(
      `${API_URL}/appointments`, 
      newAppointment,
      { headers: authHeader }
    );
    
    console.log('✅ Test appointment created');
    console.log('Response:', JSON.stringify(createResponse.data, null, 2));
    
    const appointmentId = createResponse.data.appointment.id;
    
    // Step 4: Approve the newly created appointment
    console.log(`\n🔄 Approving the newly created appointment (ID: ${appointmentId})...`);
    
    const approveResponse = await axios.put(
      `${API_URL}/appointments/${appointmentId}`, 
      { status: 'Confirmed' },  // Using the valid status 'Confirmed' instead of 'approved'
      { headers: authHeader }
    );
    
    console.log('✅ Appointment approved successfully');
    console.log('Response:', JSON.stringify(approveResponse.data, null, 2));
    
    console.log('\n✨ Test appointment created and approved successfully');
    console.log('🔍 You can now check the patient and admin interfaces to verify it appears correctly');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received from server. Is the server running?');
    }
  }
}

createAndApproveAppointment();