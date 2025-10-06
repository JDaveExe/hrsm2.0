/**
 * Fix Corrupted Audit Log Entry
 * Removes the corrupted metadata entry that's causing ECONNRESET errors
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

async function fixCorruptedLog() {
  console.log('🔧 Fixing corrupted audit log entry...\n');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');

    // Find the corrupted entry (ID 1 based on error log)
    console.log('🔍 Looking for corrupted entry...');
    const [rows] = await connection.execute(
      'SELECT id, action, LENGTH(metadata) as metadataSize FROM audit_logs WHERE LENGTH(metadata) > 100000 ORDER BY LENGTH(metadata) DESC LIMIT 5'
    );

    if (rows.length === 0) {
      console.log('✅ No corrupted entries found!\n');
      return;
    }

    console.log(`Found ${rows.length} entries with large metadata:`);
    rows.forEach(row => {
      console.log(`  - ID ${row.id}: ${row.action} (${(row.metadataSize / 1024 / 1024).toFixed(2)} MB)`);
    });
    console.log('');

    // Delete the corrupted entries
    console.log('🗑️  Deleting corrupted entries...');
    for (const row of rows) {
      await connection.execute('DELETE FROM audit_logs WHERE id = ?', [row.id]);
      console.log(`✅ Deleted entry ID ${row.id}`);
    }
    console.log('');

    console.log('✅ SUCCESS! Corrupted entries removed.');
    console.log('💡 The backend should now work correctly.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed\n');
    }
  }
}

fixCorruptedLog()
  .then(() => {
    console.log('🎉 Fix complete! You can now restart the backend.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fix failed:', error);
    process.exit(1);
  });
