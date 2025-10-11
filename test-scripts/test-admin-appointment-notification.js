// Test script to verify admin appointment creation now creates notifications
const API_URL = 'http://localhost:5000/api';

// Simulated auth header (you'd get this from login)
const authHeader = {
  'Authorization': 'Bearer your_token_here',
  'Content-Type': 'application/json'
};

async function testAdminAppointmentWithNotification() {
  console.log('🧪 Testing Admin Appointment Creation with Notification');
  console.log('====================================================\n');

  try {
    // Step 1: Get a patient to test with (using Kaleia - patient ID 113)
    console.log('📋 Step 1: Using Kaleia (Patient ID 113) for test...\n');
    
    // Step 2: Create appointment through admin API
    const appointmentData = {
      patientId: 113, // Kaleia's patient ID
      doctorId: null, // Admin can schedule without specific doctor
      appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      appointmentTime: '14:30',
      type: 'Consultation',
      priority: 'Normal',
      duration: 30,
      notes: 'Test appointment created by admin - should trigger notification',
      symptoms: 'Testing notification system'
    };

    console.log('🏥 Step 2: Creating appointment via API...');
    console.log('Appointment data:', appointmentData);

    // Note: This would require proper authentication in real scenario
    const appointmentResponse = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(appointmentData)
    });

    if (appointmentResponse.ok) {
      const appointmentResult = await appointmentResponse.json();
      console.log('✅ Appointment created successfully!');
      console.log('   Appointment ID:', appointmentResult.appointment?.id);
      
      // Step 3: Check if notification was created
      console.log('\n🔔 Step 3: Checking if notification was created...');
      
      const notificationResponse = await fetch(`${API_URL}/notifications/patient/113`);
      
      if (notificationResponse.ok) {
        const notifications = await notificationResponse.json();
        
        console.log(`📊 Found ${notifications.length} total notifications for patient 113`);
        
        // Look for the most recent notification
        const recentNotifications = notifications.filter(n => 
          new Date(n.created_at) > new Date(Date.now() - 60000) // Created in last minute
        );
        
        if (recentNotifications.length > 0) {
          console.log('✅ NEW NOTIFICATION CREATED!');
          console.log('   Notification details:');
          recentNotifications.forEach(notif => {
            console.log(`   - ID: ${notif.id}`);
            console.log(`   - Title: ${notif.title}`);
            console.log(`   - Type: ${notif.type}`);
            console.log(`   - Status: ${notif.status}`);
            console.log(`   - Created: ${notif.created_at}`);
          });
        } else {
          console.log('❌ No new notification found - there may be an issue');
        }
      } else {
        console.log('❌ Could not fetch notifications to verify');
      }
      
    } else {
      const error = await appointmentResponse.text();
      console.log('❌ Failed to create appointment:', error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Instructions for manual testing
console.log('🔧 MANUAL TEST INSTRUCTIONS:');
console.log('============================');
console.log('1. Ensure backend server is running (node server.js)');
console.log('2. Login as admin in the web app');
console.log('3. Go to Patient Management');
console.log('4. Find Kaleia Aris and click "Schedule Appointment"');
console.log('5. Fill out appointment form and save');
console.log('6. Login as kal@gmail.com in another tab/window');
console.log('7. Check notifications - should see the new appointment');
console.log('\n🎯 Expected Result: New appointment should appear as notification');

// Uncomment the line below to run the automated test (requires proper auth setup)
// testAdminAppointmentWithNotification();