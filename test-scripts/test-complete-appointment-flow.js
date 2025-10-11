// Comprehensive test script to verify the complete admin → patient appointment flow
// Run this in browser console to test the integrated system

console.log('🧪 COMPREHENSIVE APPOINTMENT FLOW TEST');
console.log('=====================================');

function testCompleteAppointmentFlow() {
  console.log('\n🎯 Testing Complete Admin → Patient Appointment Flow...');
  
  // Step 1: Simulate admin creating an appointment
  console.log('\n📋 STEP 1: Admin creates appointment and notification');
  
  const adminAppointment = {
    id: `apt_${Date.now()}`,
    patientId: 47, // Current patient ID
    patientName: 'Test Patient',
    appointmentDate: '2025-09-25',
    appointmentTime: '10:30 AM',
    type: 'General Consultation',
    notes: 'Please bring your insurance card and ID',
    status: 'approved', // Admin-approved
    needsPatientAcceptance: true,
    createdBy: 'admin',
    createdAt: new Date().toISOString()
  };
  
  const patientNotification = {
    id: `notif_${Date.now()}`,
    type: 'appointment_scheduled',
    patientId: 47,
    appointmentDate: adminAppointment.appointmentDate,
    appointmentTime: adminAppointment.appointmentTime,
    serviceType: adminAppointment.type,
    doctorName: 'Dr. Smith',
    notes: adminAppointment.notes,
    status: 'pending',
    createdAt: new Date().toISOString(),
    createdBy: 'admin'
  };
  
  // Store admin appointment (simulating backend)
  try {
    const existingAppointments = JSON.parse(localStorage.getItem('admin_appointments') || '[]');
    existingAppointments.push(adminAppointment);
    localStorage.setItem('admin_appointments', JSON.stringify(existingAppointments));
    console.log('✅ Admin appointment stored:', adminAppointment);
  } catch (error) {
    console.error('❌ Failed to store admin appointment:', error);
  }
  
  // Store patient notification
  try {
    const existingNotifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
    existingNotifications.push(patientNotification);
    localStorage.setItem('patientNotifications', JSON.stringify(existingNotifications));
    console.log('✅ Patient notification stored:', patientNotification);
  } catch (error) {
    console.error('❌ Failed to store patient notification:', error);
  }
  
  console.log('\n📊 STEP 2: Check current state');
  console.log('Admin appointments:', JSON.parse(localStorage.getItem('admin_appointments') || '[]').length);
  console.log('Patient notifications:', JSON.parse(localStorage.getItem('patientNotifications') || '[]').length);
  console.log('Patient appointments:', JSON.parse(localStorage.getItem('patient_appointments') || '[]').length);
  
  console.log('\n🔄 STEP 3: Refresh page to load notifications');
  console.log('The patient should now see:');
  console.log('✓ Notification button with badge (1)');
  console.log('✓ Pulsing red button animation');
  console.log('✓ Appointment details in modal when clicked');
  console.log('✓ Accept/Decline buttons in modal');
  
  console.log('\n📝 NEXT STEPS FOR MANUAL TESTING:');
  console.log('1. Refresh the page to see notification button');
  console.log('2. Click notification button to open modal');
  console.log('3. Click "Accept" to accept appointment');
  console.log('4. Check "All Appointments" section for new appointment');
  console.log('5. Verify appointment shows with "accepted" status');
  
  // Reload page to show notifications
  setTimeout(() => {
    console.log('\n🔄 Reloading page to show notifications...');
    window.location.reload();
  }, 2000);
}

function simulateNotificationAcceptance() {
  console.log('\n🎯 Simulating notification acceptance...');
  
  const notifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
  const pendingNotifications = notifications.filter(n => n.status === 'pending');
  
  if (pendingNotifications.length === 0) {
    console.log('❌ No pending notifications to accept');
    return;
  }
  
  const notificationToAccept = pendingNotifications[0];
  console.log('📋 Accepting notification:', notificationToAccept);
  
  // Update notification status
  const updatedNotifications = notifications.map(notif => 
    notif.id === notificationToAccept.id 
      ? { ...notif, status: 'accepted', acceptedAt: new Date().toISOString() } 
      : notif
  );
  localStorage.setItem('patientNotifications', JSON.stringify(updatedNotifications));
  
  // Create appointment in patient appointments
  const newAppointment = {
    id: Date.now(),
    patientId: notificationToAccept.patientId,
    appointmentDate: notificationToAccept.appointmentDate,
    appointmentTime: notificationToAccept.appointmentTime,
    date: notificationToAccept.appointmentDate,
    time: notificationToAccept.appointmentTime,
    serviceType: notificationToAccept.serviceType,
    type: notificationToAccept.serviceType,
    notes: notificationToAccept.notes,
    status: 'accepted',
    createdBy: 'patient_acceptance',
    acceptedAt: new Date().toISOString(),
    originalNotificationId: notificationToAccept.id
  };
  
  const existingAppointments = JSON.parse(localStorage.getItem('patient_appointments') || '[]');
  existingAppointments.push(newAppointment);
  localStorage.setItem('patient_appointments', JSON.stringify(existingAppointments));
  
  console.log('✅ Notification accepted and appointment created:', newAppointment);
  console.log('🔄 Refresh page to see appointment in list');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

function checkCurrentState() {
  console.log('\n📊 CURRENT SYSTEM STATE:');
  console.log('=======================');
  
  const adminAppointments = JSON.parse(localStorage.getItem('admin_appointments') || '[]');
  const patientNotifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
  const patientAppointments = JSON.parse(localStorage.getItem('patient_appointments') || '[]');
  
  console.log(`📋 Admin Appointments: ${adminAppointments.length}`);
  adminAppointments.forEach((apt, i) => {
    console.log(`  ${i+1}. ${apt.appointmentDate} ${apt.appointmentTime} - ${apt.status}`);
  });
  
  console.log(`🔔 Patient Notifications: ${patientNotifications.length}`);
  patientNotifications.forEach((notif, i) => {
    console.log(`  ${i+1}. ${notif.appointmentDate} ${notif.appointmentTime} - ${notif.status}`);
  });
  
  console.log(`📅 Patient Appointments: ${patientAppointments.length}`);
  patientAppointments.forEach((apt, i) => {
    console.log(`  ${i+1}. ${apt.appointmentDate} ${apt.appointmentTime} - ${apt.status}`);
  });
  
  return {
    adminAppointments,
    patientNotifications,
    patientAppointments
  };
}

function clearAllTestData() {
  console.log('\n🧹 Clearing all test data...');
  localStorage.removeItem('admin_appointments');
  localStorage.removeItem('patientNotifications');
  localStorage.removeItem('patient_appointments');
  console.log('✅ All test data cleared');
  window.location.reload();
}

// Export functions to global scope
window.testCompleteAppointmentFlow = testCompleteAppointmentFlow;
window.simulateNotificationAcceptance = simulateNotificationAcceptance;
window.checkCurrentState = checkCurrentState;
window.clearAllTestData = clearAllTestData;

console.log('\n🚀 Test functions loaded!');
console.log('📝 Available commands:');
console.log('   testCompleteAppointmentFlow() - Create test appointment and notification');
console.log('   simulateNotificationAcceptance() - Accept the first pending notification');
console.log('   checkCurrentState() - View current data in localStorage');
console.log('   clearAllTestData() - Clear all test data');

console.log('\n💡 RECOMMENDED TEST SEQUENCE:');
console.log('1. testCompleteAppointmentFlow() - Creates admin appointment + patient notification');
console.log('2. Check notification button appears with badge');
console.log('3. Click notification button and use Accept button');
console.log('4. Check appointment appears in "All Appointments" section');
console.log('5. clearAllTestData() when done testing');