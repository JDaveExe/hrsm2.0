/**
 * Check Audit Logs Table Structure
 * Shows the actual columns in the audit_logs table
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

async function checkTableStructure() {
  console.log('🔍 Checking audit_logs table structure...\n');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Get table structure
    const [columns] = await connection.execute('DESCRIBE audit_logs');
    
    console.log('📊 audit_logs table structure:');
    console.log('=' .repeat(80));
    columns.forEach(col => {
      console.log(`${col.Field.padEnd(20)} | ${col.Type.padEnd(30)} | ${col.Null.padEnd(5)} | ${col.Key}`);
    });
    console.log('=' .repeat(80));
    console.log('');

    // Check if audit_notifications table exists
    console.log('🔍 Checking if audit_notifications table exists...\n');
    try {
      const [notifColumns] = await connection.execute('DESCRIBE audit_notifications');
      console.log('✅ audit_notifications table EXISTS!');
      console.log('📊 audit_notifications table structure:');
      console.log('=' .repeat(80));
      notifColumns.forEach(col => {
        console.log(`${col.Field.padEnd(20)} | ${col.Type.padEnd(30)} | ${col.Null.padEnd(5)} | ${col.Key}`);
      });
      console.log('=' .repeat(80));
    } catch (error) {
      console.log('❌ audit_notifications table does NOT exist yet');
      console.log('💡 It will be created when the backend server starts with Sequelize sync\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTableStructure();
