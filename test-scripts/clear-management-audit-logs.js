// Script to clear management audit logs for fresh start
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function clearManagementAuditLogs() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database to clear management audit logs...');
    
    // Create connection with environment variables
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hrsm2',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Step 1: Check current count of management audit logs
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM audit_logs WHERE userRole = ?',
      ['management']
    );
    const currentCount = countResult[0].count;
    console.log(`📊 Current management audit logs count: ${currentCount}`);

    if (currentCount === 0) {
      console.log('ℹ️  No management audit logs to clear');
      await connection.end();
      process.exit(0);
      return;
    }

    // Step 2: Clear management audit log data
    console.log('🗑️  Clearing management audit logs...');
    await connection.execute('DELETE FROM audit_logs WHERE userRole = ?', ['management']);

    // Step 3: Verify the deletion
    const [verifyResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM audit_logs WHERE userRole = ?',
      ['management']
    );
    const finalCount = verifyResult[0].count;

    console.log(`✅ Management audit logs cleared successfully!`);
    console.log(`📈 Cleared entries: ${currentCount}`);
    console.log(`📉 Remaining management entries: ${finalCount}`);
    console.log(`🕒 Cleared at: ${new Date().toLocaleString()}`);
    console.log('🎉 Management audit trail is now ready for fresh data!');

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error clearing management audit logs:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

clearManagementAuditLogs();
