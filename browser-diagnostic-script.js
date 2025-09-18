// Browser console test script - paste this in the browser console on the admin dashboard
// This will check localStorage and test the appointmentService directly

console.log('🔍 Frontend Appointment Loading Diagnostic');
console.log('==========================================\n');

// Check localStorage
console.log('1️⃣ Checking localStorage...');
const token = localStorage.getItem('token');
const authToken = localStorage.getItem('authToken'); 
const userToken = localStorage.getItem('userToken');
const adminToken = localStorage.getItem('adminToken');

console.log('Token variations in localStorage:');
console.log('  token:', token);
console.log('  authToken:', authToken);
console.log('  userToken:', userToken);
console.log('  adminToken:', adminToken);

// Check if any token exists
const hasToken = token || authToken || userToken || adminToken;
console.log('  Has any token:', !!hasToken);

if (hasToken) {
    console.log('✅ Token found in localStorage');
} else {
    console.log('❌ No token found in localStorage - this is the problem!');
}

// Check current user info
console.log('\n2️⃣ Checking current user...');
const currentUser = localStorage.getItem('currentUser');
console.log('  currentUser:', currentUser);

// Test appointmentService directly (if available)
console.log('\n3️⃣ Testing appointmentService...');
if (typeof appointmentService !== 'undefined') {
    console.log('  appointmentService is available, testing...');
    
    appointmentService.getAllAppointments()
        .then(appointments => {
            console.log('✅ appointmentService.getAllAppointments() returned:', appointments.length, 'appointments');
            if (appointments.length > 0) {
                console.log('  Sample appointment:', appointments[0]);
            }
        })
        .catch(error => {
            console.log('❌ appointmentService.getAllAppointments() failed:', error);
        });
} else {
    console.log('  appointmentService not available globally');
    console.log('  Trying to import...');
    
    // Try to test fetch directly
    fetch('/api/appointments', {
        headers: {
            'Authorization': `Bearer ${hasToken}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        console.log('  Direct fetch response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('✅ Direct fetch returned:', data.length || 0, 'appointments');
        if (data.length > 0) {
            console.log('  Sample appointment:', data[0]);
        }
    })
    .catch(error => {
        console.log('❌ Direct fetch failed:', error);
    });
}

// Check network tab
console.log('\n4️⃣ Instructions:');
console.log('  - Open Network tab in DevTools');
console.log('  - Refresh the page or navigate to Appointments');
console.log('  - Look for /api/appointments requests');
console.log('  - Check if they have Authorization headers');
console.log('  - Check response status and data');

console.log('\n5️⃣ Expected fixes:');
console.log('  - If no token: Check login process');
console.log('  - If token exists but requests fail: Check appointmentService headers'); 
console.log('  - If requests succeed but UI empty: Check component state management');

// Log component re-render info if React DevTools available
if (typeof window !== 'undefined' && window.React) {
    console.log('\n6️⃣ React info available - check component state');
}