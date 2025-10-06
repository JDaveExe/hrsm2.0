/**
 * Clear Audit Logs and Alert Notifications for Fresh Start
 * 
 * This script:
 * 1. Clears all audit_logs
 * 2. Clears all audit_alert_notifications
 * 3. Resets auto-increment counters
 * 4. Provides a clean slate for testing
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

async function clearAuditData() {
  console.log('🧹 Clearing audit logs and notifications for fresh start...\n');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Step 1: Get current counts
    console.log('📊 Current database status:');
    console.log('=' .repeat(70));
    
    const [auditLogs] = await connection.execute('SELECT COUNT(*) as count FROM audit_logs');
    const [auditNotifs] = await connection.execute('SELECT COUNT(*) as count FROM audit_alert_notifications');
    
    console.log(`Audit Logs: ${auditLogs[0].count} records`);
    console.log(`Alert Notifications: ${auditNotifs[0].count} records`);
    console.log('=' .repeat(70));
    console.log('');

    if (auditLogs[0].count === 0 && auditNotifs[0].count === 0) {
      console.log('✅ Already clean! No records to delete.\n');
      return;
    }

    // Step 2: Clear audit_alert_notifications first (foreign key dependency)
    console.log('🗑️  Step 1: Clearing audit_alert_notifications...');
    const [deleteNotifs] = await connection.execute('DELETE FROM audit_alert_notifications');
    console.log(`✅ Deleted ${deleteNotifs.affectedRows} alert notification(s)\n`);

    // Step 3: Clear audit_logs
    console.log('🗑️  Step 2: Clearing audit_logs...');
    const [deleteLogs] = await connection.execute('DELETE FROM audit_logs');
    console.log(`✅ Deleted ${deleteLogs.affectedRows} audit log(s)\n`);

    // Step 4: Reset auto-increment counters
    console.log('🔄 Step 3: Resetting auto-increment counters...');
    await connection.execute('ALTER TABLE audit_alert_notifications AUTO_INCREMENT = 1');
    await connection.execute('ALTER TABLE audit_logs AUTO_INCREMENT = 1');
    console.log('✅ Auto-increment counters reset\n');

    // Step 5: Verify cleanup
    console.log('🔍 Step 4: Verifying cleanup...');
    const [verifyLogs] = await connection.execute('SELECT COUNT(*) as count FROM audit_logs');
    const [verifyNotifs] = await connection.execute('SELECT COUNT(*) as count FROM audit_alert_notifications');
    
    console.log('=' .repeat(70));
    console.log('📊 Final status:');
    console.log(`Audit Logs: ${verifyLogs[0].count} records`);
    console.log(`Alert Notifications: ${verifyNotifs[0].count} records`);
    console.log('=' .repeat(70));
    console.log('');

    if (verifyLogs[0].count === 0 && verifyNotifs[0].count === 0) {
      console.log('✅ SUCCESS! All audit data cleared.\n');
      console.log('🎯 Next steps:');
      console.log('   1. Start testing the banner system');
      console.log('   2. Perform actions that create audit logs');
      console.log('   3. Watch for critical alerts to appear');
      console.log('');
    } else {
      console.log('⚠️  Warning: Some records remain');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed\n');
    }
  }
}

// Run the cleanup
clearAuditData()
  .then(() => {
    console.log('🎉 Cleanup complete! You now have a fresh start.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });
