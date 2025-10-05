// Test appointment creation with proper authentication
const fetch = require('node-fetch');

async function testAppointmentCreation() {
  console.log('🧪 Testing Appointment Creation with Notification...\n');
  
  try {
    // Step 1: Create appointment data
    const appointmentData = {
      patientId: 135, // Plato Torres
      appointmentDate: '2025-09-25',
      appointmentTime: '15:30',
      type: 'Check-up',
      priority: 'Normal',
      duration: 30,
      notes: 'Test appointment to verify notification creation',
      symptoms: 'Testing notification system'
    };

    console.log('📋 Creating appointment with data:', appointmentData);

    // Step 2: Make the API call (note: this will fail due to auth, but we can check server logs)
    const response = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: We don't have proper auth token, so this will fail
        // But we can see what happens in server logs
      },
      body: JSON.stringify(appointmentData)
    });

    const result = await response.text();
    console.log('\n📊 Response Status:', response.status);
    console.log('📊 Response Body:', result);

    if (response.status === 401) {
      console.log('\n❌ Expected: Authentication failed (no token provided)');
      console.log('✅ But server should have logged any errors in notification creation');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Also test the sequelize query directly
async function testDirectNotificationCreation() {
  console.log('\n🔬 Testing Direct Notification Creation...\n');
  
  try {
    // Import sequelize from the backend config
    const { sequelize } = require('./backend/config/database');
    
    const testNotification = {
      patient_id: 135,
      title: 'Direct Test Notification',
      message: 'This is a test notification created directly via sequelize',
      type: 'test',
      appointment_data: JSON.stringify({
        date: '2025-09-25',
        time: '15:30',
        service: 'Check-up'
      }),
      status: 'pending'
    };

    console.log('📝 Creating notification directly:', testNotification);

    const [result] = await sequelize.query(
      `INSERT INTO notifications (patient_id, title, message, type, appointment_data, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      { 
        replacements: [
          testNotification.patient_id,
          testNotification.title,
          testNotification.message,
          testNotification.type,
          testNotification.appointment_data,
          testNotification.status
        ]
      }
    );

    console.log('✅ Direct notification creation result:', result);
    console.log('   Insert ID:', result.insertId || result);

    // Verify it was created
    const [check] = await sequelize.query(
      'SELECT * FROM notifications WHERE patient_id = 135 ORDER BY created_at DESC LIMIT 1'
    );

    if (check.length > 0) {
      console.log('✅ Verification: Notification found in database');
      console.log('   ID:', check[0].id);
      console.log('   Title:', check[0].title);
      console.log('   Status:', check[0].status);
    } else {
      console.log('❌ Verification: No notification found');
    }

  } catch (error) {
    console.error('❌ Direct creation error:', error.message);
  }
}

// Run both tests
testAppointmentCreation().then(() => {
  return testDirectNotificationCreation();
}).then(() => {
  console.log('\n🎯 Test completed! Check server logs for any errors.');
});