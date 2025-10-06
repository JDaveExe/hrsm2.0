const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearAuditLogsDirectly() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database to clear audit logs...');
    
    // Create connection with environment variables
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hrsm2',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database');

    // Step 1: Check current count
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM audit_logs');
    const currentCount = countResult[0].count;
    console.log(`📊 Current audit logs count: ${currentCount}`);

    if (currentCount === 0) {
      console.log('ℹ️  No audit logs to clear');
      return;
    }

    // Step 2: Clear all audit log data
    console.log('🗑️  Clearing all audit logs...');
    await connection.execute('DELETE FROM audit_logs');

    // Step 3: Reset auto-increment counter
    console.log('🔄 Resetting auto-increment counter...');
    await connection.execute('ALTER TABLE audit_logs AUTO_INCREMENT = 1');

    // Step 4: Verify the table is empty
    const [verifyResult] = await connection.execute('SELECT COUNT(*) as count FROM audit_logs');
    const finalCount = verifyResult[0].count;

    console.log(`✅ Audit logs cleared successfully!`);
    console.log(`📈 Cleared entries: ${currentCount}`);
    console.log(`📉 Remaining entries: ${finalCount}`);
    console.log(`🕒 Cleared at: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('❌ Error clearing audit logs:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Database connection failed. Please check:');
      console.log('   - Your .env file has correct database credentials');
      console.log('   - MySQL server is running');
      console.log('   - Database user has proper permissions');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Alternative method using environment or hardcoded credentials
async function clearAuditLogsWithCredentials() {
  const credentials = {
    host: 'localhost',
    user: 'root', // Change this to your MySQL username
    password: '', // Change this to your MySQL password
    database: 'hrsm2', // Change this to your database name
    port: 3306
  };

  let connection;
  
  try {
    console.log('🔌 Connecting to database with manual credentials...');
    connection = await mysql.createConnection(credentials);
    console.log('✅ Connected to database');

    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM audit_logs');
    const currentCount = countResult[0].count;
    console.log(`📊 Current audit logs count: ${currentCount}`);

    if (currentCount > 0) {
      await connection.execute('DELETE FROM audit_logs');
      await connection.execute('ALTER TABLE audit_logs AUTO_INCREMENT = 1');
      console.log(`✅ Cleared ${currentCount} audit log entries`);
    } else {
      console.log('ℹ️  No audit logs to clear');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

console.log('🚀 Starting audit logs clearing process...');
console.log('📋 Choose method:');
console.log('   1. Using .env file credentials (default)');
console.log('   2. Using manual credentials (edit the script first)');
console.log('');

// Try .env method first, fallback to manual if needed
clearAuditLogsDirectly().catch(error => {
  console.log('\n🔄 Falling back to manual credentials method...');
  console.log('⚠️  Please edit this file and set your database credentials manually');
  // Uncomment the line below and update credentials in the function above
  // clearAuditLogsWithCredentials();
});