// Test Calendar Filtering - Verify cancelled appointments are excluded

console.log('🔍 Testing Calendar Filtering for Cancelled Appointments\n');
console.log('========================================================\n');

// Sample appointments data from the database
const appointments = [
  { id: 35, patientName: 'Derick Bautista', appointmentDate: '2025-10-09', appointmentTime: '10:30:00', type: 'Vaccination', status: 'Cancelled' },
  { id: 38, patientName: 'Kaleia Aris', appointmentDate: '2025-10-13', appointmentTime: '10:00:00', type: 'Vaccination', status: 'Scheduled' },
  { id: 36, patientName: 'Hello Marquez', appointmentDate: '2025-10-16', appointmentTime: '10:00:00', type: 'Vaccination', status: 'Cancelled' },
  { id: 37, patientName: 'Helo Cruz', appointmentDate: '2025-10-23', appointmentTime: '11:00:00', type: 'Vaccination', status: 'Cancelled' }
];

console.log('📋 Total Appointments in Database: 4');
console.log('  - 1 Scheduled (Oct 13)');
console.log('  - 3 Cancelled (Oct 9, 16, 23)\n');

// Simulate hasAppointment function with filtering
function hasAppointment(dateStr, appointments) {
  return appointments.some(apt => {
    if (!apt || !apt.appointmentDate) return false;
    
    // Exclude cancelled appointments
    if (apt.status === 'Cancelled' || apt.status === 'cancelled') return false;
    
    const aptDateStr = apt.appointmentDate.split('T')[0];
    return aptDateStr === dateStr;
  });
}

// Simulate getAppointmentsForDate function with filtering
function getAppointmentsForDate(dateStr, appointments) {
  return appointments.filter(apt => {
    if (!apt || !apt.appointmentDate) return false;
    
    // Exclude cancelled appointments
    if (apt.status === 'Cancelled' || apt.status === 'cancelled') return false;
    
    const aptDateStr = apt.appointmentDate.split('T')[0];
    return aptDateStr === dateStr;
  }).sort((a, b) => {
    if (!a.appointmentTime || !b.appointmentTime) return 0;
    return a.appointmentTime.localeCompare(b.appointmentTime);
  });
}

console.log('🗓️  CALENDAR TEST RESULTS:\n');

// Test each date
const testDates = [
  { date: '2025-10-09', description: 'October 9 (Today - Cancelled appointment)' },
  { date: '2025-10-13', description: 'October 13 (Scheduled appointment)' },
  { date: '2025-10-16', description: 'October 16 (Cancelled appointment)' },
  { date: '2025-10-23', description: 'October 23 (Cancelled appointment)' },
  { date: '2025-10-15', description: 'October 15 (No appointment)' }
];

testDates.forEach(({ date, description }) => {
  const hasAppt = hasAppointment(date, appointments);
  const appts = getAppointmentsForDate(date, appointments);
  
  console.log(`📅 ${description}`);
  console.log(`   Has Appointment Indicator: ${hasAppt ? '✅ YES' : '❌ NO'}`);
  console.log(`   Appointments to Display: ${appts.length}`);
  
  if (appts.length > 0) {
    appts.forEach(apt => {
      console.log(`     - ${apt.appointmentTime} | ${apt.patientName} | ${apt.status}`);
    });
  }
  console.log('');
});

console.log('\n✅ EXPECTED BEHAVIOR:');
console.log('===================================');
console.log('Calendar should ONLY show indicators for:');
console.log('  ✓ October 13 - Kaleia Aris (Scheduled)');
console.log('');
console.log('Calendar should NOT show indicators for:');
console.log('  ✗ October 9 - Derick Bautista (Cancelled)');
console.log('  ✗ October 16 - Hello Marquez (Cancelled)');
console.log('  ✗ October 23 - Helo Cruz (Cancelled)');
console.log('');
console.log('But "All Appointments" table will still show all 4 appointments!');
console.log('(The table has its own filtering logic in the component)');
