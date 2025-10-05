// Quick test to check Kaleia's current notifications in database
const mysql = require('mysql2/promise');

async function checkKaleiaNotifications() {
  console.log('🔍 Checking Kaleia\'s notifications in database...\n');
  
  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrsm2'
    });

    // Check notifications for patient 113 (Kaleia)
    const [notifications] = await connection.execute(
      'SELECT * FROM notifications WHERE patient_id = ? ORDER BY created_at DESC',
      [113]
    );

    console.log(`📊 Found ${notifications.length} notifications for Patient 113 (Kaleia):`);
    console.log('================================================\n');

    if (notifications.length === 0) {
      console.log('❌ No notifications found in database');
    } else {
      notifications.forEach((notif, index) => {
        console.log(`${index + 1}. Notification ID: ${notif.id}`);
        console.log(`   Title: ${notif.title}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Status: ${notif.status}`);
        console.log(`   Created: ${notif.created_at}`);
        console.log(`   Message: ${notif.message.substring(0, 80)}...`);
        if (notif.appointment_data) {
          try {
            const appointmentData = JSON.parse(notif.appointment_data);
            console.log(`   Appointment: ${appointmentData.date} at ${appointmentData.time}`);
          } catch (e) {
            console.log(`   Appointment Data: ${notif.appointment_data}`);
          }
        }
        console.log('');
      });
    }

    // Also check what the API endpoint returns
    console.log('🌐 Testing API endpoint...');
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:5000/api/notifications/patient/113');
    
    if (response.ok) {
      const apiNotifications = await response.json();
      console.log(`✅ API returned ${apiNotifications.length} notifications`);
      
      if (apiNotifications.length > 0) {
        console.log('   API Response Sample:');
        console.log(`   - First notification: ${apiNotifications[0].title}`);
        console.log(`   - Status: ${apiNotifications[0].status}`);
        console.log(`   - Type: ${apiNotifications[0].type}`);
      }
    } else {
      console.log('❌ API call failed:', response.status, response.statusText);
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkKaleiaNotifications();