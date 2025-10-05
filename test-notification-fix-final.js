// Test the notification fix with correct Patient IDs
const fetch = require('node-fetch');

async function testNotificationFix() {
    console.log('🧪 TESTING NOTIFICATION FIX WITH CORRECT PATIENT IDs');
    console.log('===================================================\n');
    
    // Based on our mapping:
    // User 10016 (kal@gmail.com) → Patient 113 
    // User 10015 (valentina.laurel@email.com) → Patient 112
    
    const testCases = [
        { userId: 10016, email: 'kal@gmail.com', patientId: 113, name: 'Kaleia' },
        { userId: 10015, email: 'valentina.laurel@email.com', patientId: 112, name: 'Valentina' }
    ];
    
    for (const testCase of testCases) {
        console.log(`🔍 Testing ${testCase.name} (User ${testCase.userId} → Patient ${testCase.patientId})`);
        console.log('━'.repeat(60));
        
        try {
            // Test API call with PATIENT ID (correct approach)
            const response = await fetch(`http://localhost:5000/api/notifications/patient/${testCase.patientId}`);
            
            if (!response.ok) {
                console.error(`❌ API call failed: ${response.status}`);
                continue;
            }
            
            const data = await response.json();
            
            if (data.success && data.notifications) {
                const pendingNotifications = data.notifications.filter(n => n.status === 'pending');
                
                console.log(`✅ Total notifications: ${data.notifications.length}`);
                console.log(`📋 Pending notifications: ${pendingNotifications.length}`);
                
                if (pendingNotifications.length > 0) {
                    console.log('📝 Pending notification details:');
                    pendingNotifications.forEach((notif, index) => {
                        console.log(`   ${index + 1}. "${notif.title}" (ID: ${notif.id}, Status: ${notif.status})`);
                    });
                    
                    console.log(`\n🎯 Expected UI behavior for ${testCase.name}:`);
                    console.log(`   - Notification counter: (${pendingNotifications.length})`);
                    console.log(`   - Modal shows: "Your Notifications (${pendingNotifications.length})"`);
                    console.log(`   - ${pendingNotifications.length} notification items visible`);
                } else {
                    console.log('📭 No pending notifications');
                }
                
            } else {
                console.log('❌ API returned unexpected format:', data);
            }
            
        } catch (error) {
            console.error(`❌ Test failed for ${testCase.name}:`, error.message);
        }
        
        console.log(''); // Empty line between test cases
    }
    
    console.log('🎉 TESTING COMPLETE!');
    console.log('===================');
    console.log('Next steps:');
    console.log('1. Refresh patient dashboard in browser');
    console.log('2. Login as kal@gmail.com - should see notifications now!'); 
    console.log('3. Login as valentina.laurel@email.com - should see notifications');
    console.log('4. Verify notification count displays correctly');
    console.log('5. Test accept/decline functionality');
    
    // Additional debugging info
    console.log('\n🔍 DEBUGGING INFO:');
    console.log('==================');
    console.log('The frontend fix should now:');
    console.log('- Call getPatientIdForAPI(user) to get correct patient ID');
    console.log('- User 10016 should resolve to Patient 113');
    console.log('- Patient 113 has notifications in database');
    console.log('- Notification counter should show (6) for Kaleia');
    console.log('- Notification counter should show (1) for Valentina');
}

testNotificationFix();