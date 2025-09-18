// This script should be run after starting the main server
// It will create a test appointment and approve it

const axios = require('axios');
const API_URL = 'http://localhost:5000';

async function createAndApproveAppointment() {
  try {
    console.log('🔍 Checking existing appointments...');
    const response = await axios.get(`${API_URL}/appointments`);
    const appointments = response.data;
    
    console.log(`Found ${appointments.length} appointments`);
    
    // If there are existing appointments, check if any are pending
    if (appointments.length > 0) {
      const pendingAppointments = appointments.filter(appt => appt.status === 'pending');
      console.log(`Found ${pendingAppointments.length} pending appointments`);
      
      if (pendingAppointments.length > 0) {
        // Approve the first pending appointment
        const appointmentToApprove = pendingAppointments[0];
        console.log(`\n🔄 Approving appointment ID: ${appointmentToApprove.id}`);
        
        const approveResponse = await axios.put(`${API_URL}/appointments/${appointmentToApprove.id}`, {
          status: 'approved'
        });
        
        console.log('✅ Appointment approved successfully:');
        console.log(JSON.stringify(approveResponse.data, null, 2));
        return;
      }
    }
    
    // If no pending appointments, create a new one
    console.log('\n🆕 Creating a new test appointment...');
    const newAppointment = {
      patientId: '6135b76417a9c13c78dd17bc',  // Use an existing patient ID if possible
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: '14:30',
      type: 'checkup',
      symptoms: 'Fever, headache, fatigue',
      notes: 'Test appointment created for verification'
    };
    
    const createResponse = await axios.post(`${API_URL}/appointments`, newAppointment);
    console.log('✅ Test appointment created:');
    console.log(JSON.stringify(createResponse.data, null, 2));
    
    // Approve the newly created appointment
    console.log('\n🔄 Approving the newly created appointment...');
    const appointmentId = createResponse.data.id;
    
    const approveResponse = await axios.put(`${API_URL}/appointments/${appointmentId}`, {
      status: 'approved'
    });
    
    console.log('✅ Appointment approved successfully:');
    console.log(JSON.stringify(approveResponse.data, null, 2));
    
    console.log('\n✨ Test appointment created and approved successfully');
    console.log('🔍 You can now check the patient and admin interfaces to verify it appears correctly');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

createAndApproveAppointment();