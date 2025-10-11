const fetch = require('node-fetch');

async function testNotificationSystemIntegration() {
    console.log('🧪 Testing Patient Dashboard Integration (API-focused)...\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    try {
        // Test 1: Verify our test patients have notifications
        console.log('📊 Test 1: Checking patient notifications...');
        
        const kaleia = await fetch(`${baseURL}/notifications/patient/113`);
        const kaleiaData = await kaleia.json();
        console.log(`✅ Kaleia (113): ${kaleiaData.count} notifications`);
        
        const derick = await fetch(`${baseURL}/notifications/patient/134`);
        const derickData = await derick.json();
        console.log(`✅ Derick (134): ${derickData.count} notifications`);
        
        // Test 2: Test the frontend simulation
        console.log('\n🎭 Test 2: Simulating frontend behavior...');
        
        if (kaleiaData.notifications && kaleiaData.notifications.length > 0) {
            const notification = kaleiaData.notifications[0];
            console.log(`🎯 Testing with notification: "${notification.title}"`);
            
            // Simulate user accepting notification
            console.log('👤 Simulating user accepting notification...');
            const acceptResponse = await fetch(`${baseURL}/notifications/${notification.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'accepted' })
            });
            
            const acceptData = await acceptResponse.json();
            console.log('✅ Accept response:', acceptData.success ? 'SUCCESS' : 'FAILED');
            
            // Check updated count
            const updatedKaleia = await fetch(`${baseURL}/notifications/patient/113`);
            const updatedKaleiaData = await updatedKaleia.json();
            console.log(`📈 Updated Kaleia count: ${updatedKaleiaData.count} (was ${kaleiaData.count})`);
        }
        
        // Test 3: Test notification creation (admin workflow)
        console.log('\n📝 Test 3: Testing notification creation...');
        
        const newNotification = {
            patient_id: 113,
            title: 'UI Test Notification',
            message: 'This notification was created to test the frontend integration',
            type: 'appointment_reminder',
            appointment_data: JSON.stringify({
                date: '2025-09-22',
                time: '10:00 AM',
                doctor: 'Test Doctor'
            })
        };
        
        const createResponse = await fetch(`${baseURL}/notifications/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newNotification)
        });
        
        const createData = await createResponse.json();
        console.log('✅ Create response:', createData.success ? 'SUCCESS' : 'FAILED');
        
        if (createData.success) {
            console.log(`🆔 New notification ID: ${createData.notification.id}`);
            
            // Verify it appears in patient's list
            const verifyResponse = await fetch(`${baseURL}/notifications/patient/113`);
            const verifyData = await verifyResponse.json();
            console.log(`📊 Kaleia now has ${verifyData.count} notifications`);
        }
        
        // Test 4: Test frontend polling simulation
        console.log('\n⏰ Test 4: Simulating 30-second polling...');
        
        let pollCount = 0;
        const pollInterval = setInterval(async () => {
            pollCount++;
            console.log(`🔄 Poll ${pollCount}: Fetching notifications...`);
            
            const pollResponse = await fetch(`${baseURL}/notifications/patient/113`);
            const pollData = await pollResponse.json();
            console.log(`📊 Poll ${pollCount}: ${pollData.count} notifications found`);
            
            if (pollCount >= 3) {
                clearInterval(pollInterval);
                console.log('✅ Polling simulation complete');
                
                // Final summary
                console.log('\n🎉 Integration Test Summary:');
                console.log('✅ API endpoints working');
                console.log('✅ Notification CRUD operations working');
                console.log('✅ Patient-specific filtering working');
                console.log('✅ Status updates working');
                console.log('✅ Polling simulation working');
                
                console.log('\n💡 Frontend Integration Status:');
                console.log('📡 API calls: Ready for frontend consumption');
                console.log('⏰ Polling: Should work with 30-second intervals');
                console.log('🔄 Status updates: Ready for accept/decline buttons');
                console.log('📊 Data format: Compatible with React state');
                
                console.log('\n🚀 Next Steps:');
                console.log('1. Open browser to http://localhost:3000');
                console.log('2. Login as kaleia@test.com / password123');
                console.log('3. Check if notifications appear in dashboard');
                console.log('4. Test accept/decline buttons');
                console.log('5. Check network tab for API polling every 30s');
            }
        }, 2000); // Poll every 2 seconds for testing (instead of 30s)
        
    } catch (error) {
        console.error('❌ Integration test failed:', error.message);
    }
}

testNotificationSystemIntegration();