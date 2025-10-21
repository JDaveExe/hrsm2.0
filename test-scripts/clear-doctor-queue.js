/**
 * Clear Doctor Queue Script
 * Removes all patients from doctor_sessions table
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

console.log('======================================================================');
console.log('  🧹 CLEAR DOCTOR QUEUE');
console.log('======================================================================\n');

async function clearDoctorQueue() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✓ Connected to database\n');
    
    // Check if table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'hrsm2' 
      AND TABLE_NAME = 'doctor_sessions'
    `);
    
    if (tables.length === 0) {
      console.log('ℹ Table "doctor_sessions" does not exist. Queue is clean.\n');
      return { deleted: 0 };
    }
    
    // Get current queue
    const [queueRecords] = await connection.execute(`
      SELECT * FROM doctor_sessions
    `);
    
    console.log(`Found ${queueRecords.length} records in doctor queue:\n`);
    
    if (queueRecords.length > 0) {
      queueRecords.slice(0, 10).forEach((record, idx) => {
        console.log(`  ${idx + 1}. Record ID: ${record.id} | Status: ${record.status || 'N/A'}`);
      });
      if (queueRecords.length > 10) {
        console.log(`  ... and ${queueRecords.length - 10} more records\n`);
      } else {
        console.log('');
      }
      
      // Delete all records
      console.log('▶ Deleting all doctor queue records...\n');
      const [result] = await connection.execute('DELETE FROM doctor_sessions');
      console.log(`  ✓ Deleted ${result.affectedRows} doctor queue records\n`);
      
      return { deleted: result.affectedRows };
    } else {
      console.log('✅ Doctor queue is already empty!\n');
      return { deleted: 0 };
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed\n');
    }
  }
}

async function main() {
  try {
    const result = await clearDoctorQueue();
    
    console.log('======================================================================');
    console.log('  📊 SUMMARY');
    console.log('======================================================================\n');
    console.log(`  Doctor queue records deleted: ${result.deleted}\n`);
    console.log('======================================================================');
    console.log('  ✅ DOCTOR QUEUE CLEARED!');
    console.log('======================================================================\n');
    
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
  }
}

main();
