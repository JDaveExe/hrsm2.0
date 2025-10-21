const mysql = require('mysql2/promise');

async function checkTables() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hrsm_database'
    });
    
    console.log('✅ Connected to database\n');
    
    // List all tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📋 Available tables:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();
