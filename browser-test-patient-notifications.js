// Browser Test Script for Patient Dashboard Notifications
// Run this in browser console on the patient dashboard page

console.log('🧪 Testing Patient Dashboard Notification API Integration...\n');

// Test 1: Check if loadNotifications function exists and works
console.log('📡 Test 1: Testing loadNotifications API call...');

// Simulate the API call that the dashboard should be making
async function testNotificationAPI() {
    try {
        // Get patient ID from localStorage or URL
        const patientId = localStorage.getItem('patientId') || '113';
        console.log(`🆔 Testing with patient ID: ${patientId}`);
        
        // Test the API endpoint directly
        const response = await fetch(`http://localhost:5000/api/notifications/patient/${patientId}`);
        const data = await response.json();
        
        console.log('✅ API Response:', data);
        console.log(`📊 Notification count: ${data.count}`);
        console.log(`📋 Notifications:`, data.notifications);
        
        // Test 2: Check if notifications are in component state
        console.log('\n🔍 Test 2: Checking component state...');
        
        // Look for React component state
        const reactComponents = document.querySelectorAll('[data-reactroot]');
        console.log(`⚛️ Found ${reactComponents.length} React components`);
        
        // Test 3: Check notification display elements
        console.log('\n🎨 Test 3: Checking UI elements...');
        
        const notificationItems = document.querySelectorAll('.notification-item');
        const notificationCounter = document.querySelector('.notification-counter');
        const notificationList = document.querySelector('.notification-list');
        
        console.log(`📝 Notification items found: ${notificationItems.length}`);
        console.log(`🔢 Notification counter element:`, notificationCounter ? notificationCounter.textContent : 'Not found');
        console.log(`📋 Notification list element:`, notificationList ? 'Found' : 'Not found');
        
        // Test 4: Simulate notification status update
        console.log('\n✅ Test 4: Testing status update API...');
        
        if (data.notifications && data.notifications.length > 0) {
            const firstNotification = data.notifications[0];
            console.log(`🎯 Testing status update for notification ID: ${firstNotification.id}`);
            
            const updateResponse = await fetch(`http://localhost:5000/api/notifications/${firstNotification.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'read' })
            });
            
            const updateData = await updateResponse.json();
            console.log('✅ Status update response:', updateData);
        }
        
        // Test 5: Check for polling interval
        console.log('\n⏰ Test 5: Checking for polling setup...');
        
        // Look for any active intervals
        const intervalCount = setInterval(() => {}, 999999); // Create a dummy interval to get the current interval count
        clearInterval(intervalCount);
        console.log(`🔄 Active interval ID range suggests polling may be active: ${intervalCount}`);
        
        console.log('\n🎉 Browser API test complete!');
        
        return {
            apiWorking: response.ok,
            notificationCount: data.count,
            uiElements: {
                notificationItems: notificationItems.length,
                hasCounter: !!notificationCounter,
                hasList: !!notificationList
            }
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return { error: error.message };
    }
}

// Run the test
testNotificationAPI().then(result => {
    console.log('\n📊 Final Test Results:', result);
});

// Helper function to manually trigger notification loading
window.testLoadNotifications = async function() {
    console.log('🔄 Manually triggering notification load...');
    const patientId = localStorage.getItem('patientId') || '113';
    
    try {
        const response = await fetch(`http://localhost:5000/api/notifications/patient/${patientId}`);
        const data = await response.json();
        console.log('📡 Manual load result:', data);
        
        // Try to update the UI manually if component exists
        if (window.React && window.ReactDOM) {
            console.log('⚛️ React detected - UI should update automatically');
        }
        
        return data;
    } catch (error) {
        console.error('❌ Manual load failed:', error);
        return null;
    }
};

console.log('\n💡 Tip: You can run window.testLoadNotifications() to manually test notification loading');
console.log('💡 Tip: Check the Network tab in DevTools to see if API calls are being made every 30 seconds');