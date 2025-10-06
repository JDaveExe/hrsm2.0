/**
 * Test Script: Critical Alert Banner Frontend Implementation
 * 
 * This script tests the frontend banner component by:
 * 1. Creating test critical notifications
 * 2. Verifying they appear in the API
 * 3. Instructions for testing in the browser
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

async function testBannerImplementation() {
  console.log('🧪 Testing Critical Alert Banner Implementation\n');
  
  let connection;
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Step 0: Get admin user ID
    console.log('🔍 Step 0: Finding admin user...');
    const [adminUsers] = await connection.execute(
      `SELECT id, firstName, lastName FROM users WHERE role = 'admin' LIMIT 1`
    );
    
    if (adminUsers.length === 0) {
      throw new Error('No admin user found in database');
    }
    
    const adminUser = adminUsers[0];
    const adminName = `${adminUser.firstName} ${adminUser.lastName}`;
    console.log(`✅ Found admin user: ${adminName} (ID: ${adminUser.id})\n`);

    // Step 1: Create test audit log
    console.log('📝 Step 1: Creating test audit log...');
    const [auditResult] = await connection.execute(
      `INSERT INTO audit_logs 
       (userId, userRole, userName, action, actionDescription, targetType, targetId, targetName, ipAddress, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        adminUser.id, // Use actual admin user ID
        'admin',
        adminName,
        'removed_patient',
        `Admin ${adminName} deleted patient record: Test Patient for Banner Testing`,
        'patient',
        999,
        'Test Patient',
        '127.0.0.1'
      ]
    );
    
    const auditLogId = auditResult.insertId;
    console.log(`✅ Created audit log with ID: ${auditLogId}\n`);

    // Step 2: Create test notification
    console.log('🚨 Step 2: Creating critical notification...');
    const [notifResult] = await connection.execute(
      `INSERT INTO audit_alert_notifications 
       (auditLogId, severity, title, message, actionType, performedBy, performedByRole, 
        targetInfo, isRead, isDismissed, expiresAt, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), NOW(), NOW())`,
      [
        auditLogId,
        'critical',
        '🚨 Patient Record Deleted',
        `Admin ${adminName} deleted patient record: Test Patient`,
        'removed_patient',
        adminName,
        'admin',
        JSON.stringify({
          patientId: 999,
          patientName: 'Test Patient'
        }),
        false,
        false
      ]
    );

    const notificationId = notifResult.insertId;
    console.log(`✅ Created notification with ID: ${notificationId}\n`);

    // Step 3: Verify notification exists
    console.log('🔍 Step 3: Verifying notification...');
    const [notifications] = await connection.execute(
      `SELECT * FROM audit_alert_notifications WHERE id = ?`,
      [notificationId]
    );

    if (notifications.length > 0) {
      console.log('✅ Notification verified in database:');
      console.log(JSON.stringify(notifications[0], null, 2));
      console.log('');
    }

    // Step 4: Get all active critical notifications
    console.log('📊 Step 4: Checking all critical notifications...');
    const [criticalNotifs] = await connection.execute(
      `SELECT * FROM audit_alert_notifications 
       WHERE severity = 'critical' 
       AND isDismissed = false 
       AND (expiresAt IS NULL OR expiresAt > NOW())
       ORDER BY createdAt DESC`
    );

    console.log(`✅ Found ${criticalNotifs.length} active critical notification(s)\n`);

    // Step 5: Print testing instructions
    console.log('=' .repeat(70));
    console.log('🎯 TESTING INSTRUCTIONS');
    console.log('=' .repeat(70));
    console.log('');
    console.log('1. Start the backend server:');
    console.log('   cd backend && npm start');
    console.log('');
    console.log('2. Start the frontend:');
    console.log('   npm start');
    console.log('');
    console.log('3. Login as Admin:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('');
    console.log('4. You should see a RED BANNER at the top with:');
    console.log('   🚨 Patient Record Deleted');
    console.log('   "Admin Jelly Test deleted patient record: Test Patient"');
    console.log('');
    console.log('5. Test features:');
    console.log('   ✓ Banner appears immediately on login');
    console.log('   ✓ Banner stays visible on all pages');
    console.log('   ✓ Click "X" button to dismiss individual alert');
    console.log('   ✓ If multiple alerts, "Dismiss All" button appears');
    console.log('   ✓ Banner auto-refreshes every 10 seconds');
    console.log('   ✓ Banner has smooth slide-down animation');
    console.log('   ✓ Hover effects on alerts and buttons work');
    console.log('');
    console.log('6. Test API endpoints directly:');
    console.log('   GET http://localhost:5000/api/audit-notifications/critical');
    console.log('   (Use Bearer token from login)');
    console.log('');
    console.log('7. Create more test alerts:');
    console.log('   - Delete a patient in admin dashboard');
    console.log('   - Create a new user');
    console.log('   - Transfer a patient');
    console.log('');
    console.log('=' .repeat(70));
    console.log('');

    // Step 6: API endpoint test
    console.log('🔌 Step 6: API Endpoint Information');
    console.log('=' .repeat(70));
    console.log('');
    console.log('GET /api/audit-notifications/critical');
    console.log('  → Returns all critical, undismissed notifications');
    console.log('');
    console.log('PUT /api/audit-notifications/:id/dismiss');
    console.log(`  → Dismiss notification ${notificationId}`);
    console.log('');
    console.log('PUT /api/audit-notifications/dismiss-all');
    console.log('  → Dismiss all notifications');
    console.log('');
    console.log('=' .repeat(70));
    console.log('');

    console.log('✅ Test setup complete!');
    console.log('');
    console.log('💡 Tip: Open browser DevTools (F12) → Network tab to see API calls');
    console.log('💡 Tip: Check Console for any errors');
    console.log('');

  } catch (error) {
    console.error('❌ Error during test:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed\n');
    }
  }
}

// Run the test
testBannerImplementation()
  .then(() => {
    console.log('🎉 Test script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  });
