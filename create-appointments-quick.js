// Quick script to create test appointments with correct user ID

const appointments = [
  {
    patientId: 109,
    appointmentDate: '2025-09-17',
    appointmentTime: '09:00',
    type: 'Check-up',
    duration: 30,
    priority: 'Normal',
    notes: 'Regular health check-up'
  },
  {
    patientId: 109,
    appointmentDate: '2025-09-17', 
    appointmentTime: '10:30',
    type: 'Follow-up',
    duration: 45,
    priority: 'High', 
    notes: 'Follow-up consultation'
  }
];

console.log('🏥 Creating Test Appointments');
console.log('============================\n');

async function createAppointments() {
  for (let i = 0; i < appointments.length; i++) {
    const apt = appointments[i];
    
    try {
      console.log(`Creating appointment ${i + 1}: ${apt.type} at ${apt.appointmentTime}`);
      
      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: {
          'x-auth-token': 'temp-admin-token',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apt)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success: ${result.msg}`);
        console.log(`   Appointment ID: ${result.appointment?.id}`);
      } else {
        console.log(`❌ Failed: ${result.msg || result.error}`);
        console.log(`   Details:`, result);
      }
      
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
    
    console.log('');
  }
}

createAppointments().then(() => {
  console.log('🎯 Appointment creation complete!');
  console.log('Now check the admin dashboard to see if appointments appear.');
});