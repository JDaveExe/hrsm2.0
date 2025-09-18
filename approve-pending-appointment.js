const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function approveExistingAppointment() {
  console.log('🔍 Getting existing appointments...');
  
  try {
    const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      }
    });
    
    if (!appointmentsResponse.ok) {
      throw new Error(`Failed to get appointments: ${appointmentsResponse.statusText}`);
    }
    
    const appointments = await appointmentsResponse.json();
    console.log(`✅ Found ${appointments.length} appointments`);
    
    if (appointments.length === 0) {
      throw new Error('No appointments found to approve');
    }
    
    // Get the first pending appointment
    const pendingAppointment = appointments.find(apt => apt.status === 'pending');
    
    if (!pendingAppointment) {
      console.log('❌ No pending appointments found');
      return;
    }
    
    console.log(`\n📅 Found pending appointment for ${pendingAppointment.patientName}:`);
    console.log(`  ID: ${pendingAppointment.id}`);
    console.log(`  Date: ${pendingAppointment.appointmentDate}`);
    console.log(`  Time: ${pendingAppointment.appointmentTime}`);
    console.log(`  Type: ${pendingAppointment.type}`);
    
    console.log('\n✏️ Updating appointment status to "approved"...');
    
    // Update the appointment status directly (normally would be done via a proper endpoint)
    const updateResponse = await fetch(`${API_BASE_URL}/appointments/${pendingAppointment.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      },
      body: JSON.stringify({
        ...pendingAppointment,
        status: 'approved',
        approvedBy: 1,
        approvedAt: new Date().toISOString()
      })
    });
    
    if (!updateResponse.ok) {
      throw new Error(`Failed to update appointment: ${updateResponse.statusText}`);
    }
    
    const updateResult = await updateResponse.json();
    console.log('✅ Successfully approved appointment!');
    console.log('📊 Updated appointment:', JSON.stringify(updateResult, null, 2));
    
    console.log('\n🔄 Refresh the admin page to see the appointment in All Appointments table!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

approveExistingAppointment();