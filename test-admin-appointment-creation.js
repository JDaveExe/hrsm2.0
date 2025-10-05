const axios = require('axios');

async function testAdminAppointmentCreation() {
    const baseURL = 'http://localhost:3001';
    
    console.log('🔬 Testing Admin Appointment Creation with Notification...\n');
    
    try {
        // Step 1: Check notifications before creating appointment
        console.log('1. Checking notifications for Kaleia (Patient 113) before appointment...');
        const beforeResponse = await axios.get(`${baseURL}/api/notifications/patient/113`);
        const notificationsBefore = beforeResponse.data.filter(n => n.status === 'pending');
        console.log(`   Found ${notificationsBefore.length} pending notifications before\n`);
        
        // Step 2: Create a new appointment
        console.log('2. Creating new appointment for Kaleia...');
        const appointmentData = {
            patient_id: 113, // Kaleia's patient ID
            doctor_id: 1,    // Dr. Smith
            appointment_date: '2025-09-25',
            appointment_time: '14:30:00',
            service_type: 'General Checkup',
            status: 'pending',
            notes: 'Test appointment for notification verification'
        };
        
        const createResponse = await axios.post(`${baseURL}/api/appointments`, appointmentData);
        console.log(`   ✅ Appointment created successfully! ID: ${createResponse.data.id}\n`);
        
        // Step 3: Check notifications after creating appointment
        console.log('3. Checking notifications for Kaleia (Patient 113) after appointment...');
        const afterResponse = await axios.get(`${baseURL}/api/notifications/patient/113`);
        const notificationsAfter = afterResponse.data.filter(n => n.status === 'pending');
        console.log(`   Found ${notificationsAfter.length} pending notifications after\n`);
        
        // Step 4: Verify notification was created
        const newNotifications = notificationsAfter.length - notificationsBefore.length;
        if (newNotifications === 1) {
            console.log('🎉 SUCCESS: New appointment created a notification!');
            
            // Find the new notification
            const newNotification = notificationsAfter.find(n => 
                !notificationsBefore.some(before => before.id === n.id)
            );
            
            if (newNotification) {
                console.log('\n📋 New Notification Details:');
                console.log(`   ID: ${newNotification.id}`);
                console.log(`   Type: ${newNotification.notification_type}`);
                console.log(`   Message: ${newNotification.message}`);
                console.log(`   Status: ${newNotification.status}`);
                console.log(`   Created: ${newNotification.created_at}`);
            }
        } else if (newNotifications === 0) {
            console.log('❌ ISSUE: No notification was created for the new appointment');
        } else {
            console.log(`⚠️  UNEXPECTED: ${newNotifications} notifications were created`);
        }
        
    } catch (error) {
        console.error('❌ Error testing appointment creation:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testAdminAppointmentCreation();