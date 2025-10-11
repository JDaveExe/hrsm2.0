// Browser Diagnostic Script - Run this in the browser console on the admin page
// This will show exactly what the appointments state contains

console.log('🔍 CALENDAR DIAGNOSTIC SCRIPT');
console.log('============================\n');

// Try to access React component state
const findReactState = () => {
  // Find the root React element
  const rootElement = document.querySelector('[data-reactroot]') || document.querySelector('#root');
  if (!rootElement) {
    console.log('❌ Could not find React root element');
    return null;
  }
  
  // Try to find React fiber
  const key = Object.keys(rootElement).find(key => key.startsWith('__reactFiber'));
  if (!key) {
    console.log('❌ Could not find React fiber');
    return null;
  }
  
  const fiber = rootElement[key];
  console.log('✅ Found React fiber');
  
  // Walk up to find AppointmentManager component
  let current = fiber;
  let depth = 0;
  while (current && depth < 50) {
    if (current.type?.name === 'AppointmentManager') {
      console.log('✅ Found AppointmentManager component');
      return current.memoizedState || current.stateNode?.state;
    }
    current = current.return;
    depth++;
  }
  
  console.log('❌ Could not find AppointmentManager component');
  return null;
};

const state = findReactState();

if (state) {
  console.log('\n📊 COMPONENT STATE:');
  console.log('==================');
  
  // Try to extract appointments from state
  let appointments = null;
  if (state && typeof state === 'object') {
    // State might be a linked list in React hooks
    let current = state;
    let count = 0;
    while (current && count < 20) {
      if (Array.isArray(current.memoizedState)) {
        appointments = current.memoizedState;
        break;
      }
      if (current.queue?.pending) {
        appointments = current.queue.pending.memoizedState;
        break;
      }
      current = current.next;
      count++;
    }
  }
  
  if (appointments) {
    console.log(`\n✅ Found appointments array: ${appointments.length} items`);
    console.log('\n📋 APPOINTMENTS DATA:');
    appointments.forEach((apt, index) => {
      console.log(`\nAppointment #${index + 1}:`);
      console.log(`  ID: ${apt.id}`);
      console.log(`  Date: ${apt.appointmentDate}`);
      console.log(`  Time: ${apt.appointmentTime}`);
      console.log(`  Type: ${apt.type}`);
      console.log(`  Status: ${apt.status}`);
      console.log(`  Patient ID: ${apt.patientId}`);
    });
  } else {
    console.log('❌ Could not extract appointments from state');
  }
} else {
  console.log('\n⚠️  Could not access component state directly');
}

console.log('\n\n📋 ALTERNATIVE: Check localStorage/sessionStorage');
console.log('==================================================');

// Check for any cached data
const sessionKeys = Object.keys(sessionStorage);
const localKeys = Object.keys(localStorage);

console.log('\nSessionStorage keys:', sessionKeys);
console.log('LocalStorage keys:', localKeys);

// Look for appointment-related data
sessionKeys.forEach(key => {
  if (key.includes('appointment') || key.includes('backup')) {
    console.log(`\n📦 sessionStorage.${key}:`);
    try {
      const data = JSON.parse(sessionStorage.getItem(key));
      console.log(data);
    } catch {
      console.log(sessionStorage.getItem(key));
    }
  }
});

localKeys.forEach(key => {
  if (key.includes('appointment') || key.includes('backup')) {
    console.log(`\n📦 localStorage.${key}:`);
    try {
      const data = JSON.parse(localStorage.getItem(key));
      console.log(data);
    } catch {
      console.log(localStorage.getItem(key));
    }
  }
});

console.log('\n\n🌐 NETWORK REQUESTS');
console.log('==================');
console.log('Open DevTools Network tab and look for:');
console.log('  - GET /api/appointments');
console.log('  - Check the Response tab to see what data the server returns');
console.log('\nIf appointments are returned by API but not showing in calendar:');
console.log('  -> The issue is in the frontend component');
console.log('If appointments are NOT returned by API:');
console.log('  -> The issue is in the backend database/API');

console.log('\n\n💡 QUICK TEST:');
console.log('==============');
console.log('Run this in console to manually test the calendar function:');
console.log(`
const testDate = new Date('2025-10-13'); // Date of Kaleia's appointment
const dateStr = testDate.toISOString().split('T')[0];
console.log('Testing date:', dateStr);

// This simulates what getAppointmentsForDate does
// Replace 'appointments' with actual appointments array from component state
const appointments = [
  { id: 38, appointmentDate: '2025-10-13', appointmentTime: '10:00:00', status: 'Scheduled' }
];

const filtered = appointments.filter(apt => {
  if (!apt || !apt.appointmentDate) return false;
  const aptDate = new Date(apt.appointmentDate);
  const aptDateStr = aptDate.toISOString().split('T')[0];
  return aptDateStr === dateStr;
});

console.log('Appointments on 2025-10-13:', filtered);
`);
