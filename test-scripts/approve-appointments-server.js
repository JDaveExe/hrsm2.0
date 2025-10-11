require('dotenv').config();
const express = require('express');
const app = express();

// Check if appointments exist in global scope
if (!global.appointments) {
  console.log('❌ No global appointments array found');
  process.exit(1);
}

console.log('🔍 Checking appointment data...');
console.log(`Found ${global.appointments.length} appointments in memory:`);

if (global.appointments.length > 0) {
  // Find pending appointments
  const pendingAppointments = global.appointments.filter(appt => appt.status === 'pending');
  console.log(`\n🔶 Found ${pendingAppointments.length} pending appointments`);
  
  // Update all pending appointments to approved
  if (pendingAppointments.length > 0) {
    console.log(`\n✅ Approving all pending appointments...`);
    
    pendingAppointments.forEach(pendingAppt => {
      const index = global.appointments.findIndex(appt => appt.id === pendingAppt.id);
      if (index !== -1) {
        global.appointments[index].status = 'approved';
        global.appointments[index].updatedAt = new Date().toISOString();
        console.log(`✅ Appointment ID: ${pendingAppt.id} updated to approved status`);
      }
    });
    
    console.log('\n📊 APPOINTMENTS AFTER APPROVAL:');
    global.appointments.forEach((appt, index) => {
      console.log(`\n📌 APPOINTMENT #${index + 1}:`);
      console.log(`ID: ${appt.id}`);
      console.log(`Patient ID: ${appt.patientId}`);
      console.log(`Date: ${appt.appointmentDate}`);
      console.log(`Time: ${appt.appointmentTime}`);
      console.log(`Type: ${appt.type}`);
      console.log(`Status: ${appt.status}`);
    });
  } else {
    console.log('❌ No pending appointments to approve');
  }
} else {
  console.log('❌ No appointments found');
}

// Make a simple API to get and update appointments
app.use(express.json());

// Get all appointments
app.get('/appointments', (req, res) => {
  res.json(global.appointments);
});

// Update appointment status
app.put('/appointments/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const appointmentIndex = global.appointments.findIndex(appt => appt.id === id);
  
  if (appointmentIndex === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }
  
  global.appointments[appointmentIndex].status = status;
  global.appointments[appointmentIndex].updatedAt = new Date().toISOString();
  
  res.json(global.appointments[appointmentIndex]);
});

// Start the server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 Appointment approval server running on port ${PORT}`);
  console.log('Use this server to check or update appointment status');
  console.log(`GET http://localhost:${PORT}/appointments - Get all appointments`);
  console.log(`PUT http://localhost:${PORT}/appointments/:id - Update appointment status`);
  console.log('\nPress Ctrl+C to stop the server');
});