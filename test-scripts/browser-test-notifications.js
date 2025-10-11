// Browser test script to check notification system in real environment
console.log('🔍 Checking notification system in browser...');

// 1. Check current localStorage
const currentNotifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
console.log('📋 Current notifications in localStorage:', currentNotifications);

// 2. Check what user data we have
const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
console.log('👤 Current user data:', currentUser);

// 3. Check session data
const sessionData = JSON.parse(localStorage.getItem('sessionData') || '{}');
console.log('🔐 Session data:', sessionData);

// 4. Create test notifications for both patients
const testNotifications = [
  {
    id: Date.now() + 1,
    patientId: 113,
    patientName: 'Kaleia Aris',
    appointmentDate: '2025-09-20',
    appointmentTime: '10:00 AM',
    serviceType: 'General Consultation',
    notes: 'Test notification for Kaleia',
    isRead: false,
    createdAt: new Date().toISOString(),
    type: 'appointment_request'
  },
  {
    id: Date.now() + 2,
    patientId: 134,
    patientName: 'Derick Bautista',
    appointmentDate: '2025-09-20',
    appointmentTime: '2:00 PM',
    serviceType: 'Follow-up Consultation',
    notes: 'Test notification for Derick',
    isRead: false,
    createdAt: new Date().toISOString(),
    type: 'appointment_request'
  }
];

// 5. Store test notifications
localStorage.setItem('patientNotifications', JSON.stringify(testNotifications));
console.log('✅ Test notifications stored!');

// 6. Test notification filtering logic
function testNotificationFiltering(userId) {
  const notifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
  
  // This is the exact logic from PatientAppointments.js
  const filteredNotifications = notifications.filter(notification => {
    return notification.patientId == userId || 
           notification.patientId === userId ||
           notification.patientId === parseInt(userId);
  });
  
  console.log(`🧪 User ID ${userId}: ${filteredNotifications.length} notifications found`);
  return filteredNotifications;
}

// Test with different user ID formats
console.log('\n🔬 Testing notification filtering:');
testNotificationFiltering(113);
testNotificationFiltering('113');
testNotificationFiltering(134);
testNotificationFiltering('134');

// 7. Provide instructions
console.log('\n📝 INSTRUCTIONS:');
console.log('1. Copy and paste this script in browser console while on patient dashboard');
console.log('2. Refresh the page to see if notifications appear');
console.log('3. Check if notification count badge updates');
console.log('4. Try logging in as different patients to test filtering');

// 8. Cleanup function
window.clearTestNotifications = function() {
  localStorage.removeItem('patientNotifications');
  console.log('🧹 Test notifications cleared');
};

console.log('\n🧹 To clear test notifications, run: clearTestNotifications()');