require('dotenv').config();
const express = require('express');
const app = express();

// Check if appointments exist in global scope
if (!global.appointments) {
  // Create the appointments array if it doesn't exist
  global.appointments = [];
}

console.log('🔍 Checking appointment data...');
console.log(`Found ${global.appointments.length} appointments in memory:`);

if (global.appointments.length > 0) {
  global.appointments.forEach((appt, index) => {
    console.log(`\n📌 APPOINTMENT #${index + 1}:`);
    console.log(JSON.stringify(appt, null, 2));
  });
  
  // Count appointments by status
  const statusCounts = global.appointments.reduce((acc, appt) => {
    acc[appt.status] = (acc[appt.status] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📊 APPOINTMENTS BY STATUS:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });
  
  // Find pending appointments
  const pendingAppointments = global.appointments.filter(appt => appt.status === 'pending');
  console.log(`\n🔶 Found ${pendingAppointments.length} pending appointments`);
  
  // Update first pending appointment to approved if any exist
  if (pendingAppointments.length > 0) {
    const appointmentToApprove = pendingAppointments[0];
    console.log(`\n✅ Approving appointment ID: ${appointmentToApprove.id}`);
    
    // Find the appointment in the global array and update it
    const index = global.appointments.findIndex(appt => appt.id === appointmentToApprove.id);
    if (index !== -1) {
      global.appointments[index].status = 'approved';
      console.log('✅ Appointment updated to approved status');
      console.log(JSON.stringify(global.appointments[index], null, 2));
    }
  }
} else {
  console.log('❌ No appointments found');
  
  // Create a test appointment if none exist
  console.log('\n🆕 Creating a test appointment...');
  const newAppointment = {
    id: '1234567890',
    patientId: '123456',
    doctorId: '654321',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00 AM',
    type: 'checkup',
    status: 'pending',
    symptoms: 'Fever, headache',
    notes: 'Test appointment',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  global.appointments.push(newAppointment);
  console.log('✅ Test appointment created:');
  console.log(JSON.stringify(newAppointment, null, 2));
}

// Show all appointments after changes
console.log('\n📋 CURRENT APPOINTMENTS:');
global.appointments.forEach((appt, index) => {
  console.log(`\n📌 APPOINTMENT #${index + 1}:`);
  console.log(JSON.stringify(appt, null, 2));
});