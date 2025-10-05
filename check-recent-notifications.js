// Check the most recent notifications to see what's happening
const mysql = require('mysql2/promise');

async function checkRecentNotifications() {
  console.log('🔍 Checking most recent notifications in database...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrsm2'
    });

    // Get the 10 most recent notifications
    const [notifications] = await connection.execute(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10'
    );
    
    console.log(`📊 Found ${notifications.length} most recent notifications:`);
    console.log('================================================\n');

    notifications.forEach((notif, index) => {
      console.log(`${index + 1}. Notification ID: ${notif.id}`);
      console.log(`   Patient ID: ${notif.patient_id}`);
      console.log(`   Title: ${notif.title}`);
      console.log(`   Type: ${notif.type}`);
      console.log(`   Status: ${notif.status}`);
      console.log(`   Created: ${notif.created_at}`);
      console.log('');
    });

    // Check if there are any notifications created in the last 5 minutes
    const [recentNotifs] = await connection.execute(
      'SELECT * FROM notifications WHERE created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE) ORDER BY created_at DESC'
    );
    
    console.log(`🕐 Notifications created in last 5 minutes: ${recentNotifs.length}`);
    if (recentNotifs.length > 0) {
      recentNotifs.forEach(notif => {
        console.log(`   - Patient ${notif.patient_id}: ${notif.title} (${notif.status})`);
      });
    } else {
      console.log('   No notifications created recently');
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRecentNotifications();