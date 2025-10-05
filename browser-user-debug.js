// Simple test to verify our theory
// Run this in browser console after logging in as a patient

console.log('🔍 Checking current user data for notification debugging...');

// Check what's stored for current user
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
console.log('👤 Current user object:', currentUser);

// Check what user object is passed to components
if (window.React && window.React.version) {
  console.log('⚛️ React is available');
  // Try to get user data from React DevTools if available
}

// Check session storage as well
const sessionData = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
console.log('🔐 Session user object:', sessionData);

// Show what ID should be used for notifications
const userIdForNotifications = currentUser.id || sessionData.id;
console.log('🎯 ID to use for notifications:', userIdForNotifications);

// Test notification with this ID
const testNotification = {
  id: Date.now(),
  patientId: userIdForNotifications,
  patientName: currentUser.firstName + ' ' + currentUser.lastName,
  appointmentDate: '2025-09-20',
  appointmentTime: '3:00 PM',
  serviceType: 'Test Consultation',
  notes: 'Testing notification with correct user ID',
  isRead: false,
  createdAt: new Date().toISOString(),
  type: 'appointment_request'
};

// Store the test notification
const existingNotifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
existingNotifications.push(testNotification);
localStorage.setItem('patientNotifications', JSON.stringify(existingNotifications));

console.log('✅ Test notification created with ID:', userIdForNotifications);
console.log('🔄 Refresh the page to see if notification appears');

// Also show filtering logic test
const filteredForThisUser = existingNotifications.filter(notification => {
  return notification.patientId == userIdForNotifications || 
         notification.patientId === userIdForNotifications ||
         notification.patientId === parseInt(userIdForNotifications);
});

console.log('📋 Notifications that should show for this user:', filteredForThisUser.length);