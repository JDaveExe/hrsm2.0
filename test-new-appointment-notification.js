// Test script to create a new appointment and verify notification creation
const API_URL = 'http://localhost:5000/api';

async function testNewAppointmentNotification() {
  console.log('🧪 Testing New Admin Appointment → Notification Creation');
  console.log('=====================================================\n');

  try {
    // Create a new appointment for Kaleia (patient ID 113)
    const appointmentData = {
      patientId: 113,
      doctorId: null, // Admin can schedule without specific doctor
      appointmentDate: '2025-09-25', // Few days from now
      appointmentTime: '11:00',
      type: 'Check-up',
      priority: 'Normal',
      duration: 30,
      notes: 'Admin scheduled appointment - testing notification creation',
      symptoms: 'Regular checkup'
    };

    console.log('🏥 Creating appointment through backend API...');
    console.log('Appointment Data:', appointmentData);

    // Note: This requires proper auth token, but let's see what happens
    const response = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In real scenario, need: 'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify(appointmentData)
    });

    const responseText = await response.text();
    console.log('\n📊 Backend Response:');
    console.log('Status:', response.status);
    console.log('Response:', responseText);

    if (response.ok) {
      console.log('✅ Appointment created successfully!');
      
      // Wait a moment then check notifications
      console.log('\n⏳ Waiting 2 seconds then checking notifications...');
      setTimeout(async () => {
        try {
          const notifResponse = await fetch(`${API_URL}/notifications/patient/113`);
          const notifData = await notifResponse.json();
          
          console.log('🔔 Current notifications:');
          console.log(`Total: ${notifData.notifications?.length || 0}`);
          
          const pendingNotifications = notifData.notifications?.filter(n => n.status === 'pending') || [];
          console.log(`Pending: ${pendingNotifications.length}`);
          
          if (pendingNotifications.length > 0) {
            console.log('\n📋 Most recent pending notification:');
            const latest = pendingNotifications[0];
            console.log(`- ID: ${latest.id}`);
            console.log(`- Title: ${latest.title}`);
            console.log(`- Status: ${latest.status}`);
            console.log(`- Created: ${latest.created_at}`);
          }
          
        } catch (checkError) {
          console.error('❌ Error checking notifications:', checkError.message);
        }
      }, 2000);
      
    } else {
      console.log('❌ Failed to create appointment');
      if (response.status === 401) {
        console.log('   → Authentication required. Use admin login token.');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testNewAppointmentNotification();