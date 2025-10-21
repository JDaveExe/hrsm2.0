// Debug script to check Plato Torres notification issue
const mysql = require('mysql2/promise');

async function debugPlatoNotifications() {
  console.log('🔍 Debugging Plato Torres notification issue...\n');
  
  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrsm2'
    });

    // Check Plato Torres in users table
    console.log('👤 STEP 1: Check Plato Torres in users table');
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE firstName LIKE "%Plato%" OR lastName LIKE "%Torres%"'
    );
    
    if (users.length > 0) {
      console.log('✅ Found user(s):');
      users.forEach(user => {
        console.log(`   - User ID: ${user.id}, Name: ${user.firstName} ${user.lastName}, Email: ${user.email}`);
      });
    } else {
      console.log('❌ No users found with name Plato Torres');
    }

    // Check Plato Torres in patients table
    console.log('\n🏥 STEP 2: Check Plato Torres in patients table');
    const [patients] = await connection.execute(
      'SELECT * FROM patients WHERE firstName LIKE "%Plato%" OR lastName LIKE "%Torres%"'
    );
    
    if (patients.length > 0) {
      console.log('✅ Found patient(s):');
      patients.forEach(patient => {
        console.log(`   - Patient ID: ${patient.id}, Name: ${patient.firstName} ${patient.lastName}, User ID: ${patient.userId}`);
      });
    } else {
      console.log('❌ No patients found with name Plato Torres');
    }

    // Check notifications for patient ID 135
    console.log('\n🔔 STEP 3: Check notifications for Patient ID 135');
    const [notifications] = await connection.execute(
      'SELECT * FROM notifications WHERE patient_id = 135 ORDER BY created_at DESC'
    );
    
    console.log(`📊 Found ${notifications.length} notifications:`);
    notifications.forEach((notif, index) => {
      console.log(`   ${index + 1}. ID: ${notif.id}, Title: ${notif.title}, Status: ${notif.status}, Type: ${notif.type}`);
      console.log(`      Created: ${notif.created_at}`);
    });

    // Check user-patient mapping for Plato
    if (users.length > 0 && patients.length > 0) {
      const user = users[0];
      const patient = patients[0];
      
      console.log('\n🔗 STEP 4: Check user-patient relationship');
      console.log(`   User ID ${user.id} should map to Patient ID ${patient.id}`);
      console.log(`   Patient.userId = ${patient.userId} (should match User ID ${user.id})`);
      
      if (user.id === patient.userId) {
        console.log('✅ User-Patient relationship is correct');
      } else {
        console.log('❌ User-Patient relationship is BROKEN!');
      }
    }

    // Test API endpoint for patient 135
    console.log('\n🌐 STEP 5: Test API endpoint');
    try {
      const fetch = require('node-fetch');
      const response = await fetch('http://localhost:5000/api/notifications/patient/135');
      
      if (response.ok) {
        const apiResult = await response.json();
        console.log(`✅ API returned ${apiResult.notifications?.length || 0} notifications`);
        
        if (apiResult.notifications && apiResult.notifications.length > 0) {
          console.log('   API notifications:');
          apiResult.notifications.forEach(notif => {
            console.log(`   - ${notif.title} (Status: ${notif.status}, Type: ${notif.type})`);
          });
        }
      } else {
        console.log('❌ API call failed:', response.status);
      }
    } catch (apiError) {
      console.log('❌ API error:', apiError.message);
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugPlatoNotifications();