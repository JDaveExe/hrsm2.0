const mysql = require('mysql2/promise');
const fs = require('fs');

async function importDatabase() {
  console.log('🔄 Connecting to Railway MySQL...');
  
  // Use DATABASE_URL if available, otherwise use individual vars
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;
  
  if (dbUrl) {
    console.log('📡 Using DATABASE_URL connection...');
    const connection = await mysql.createConnection({
      uri: dbUrl,
      multipleStatements: true
    });
    
    console.log('✅ Connected!');
    console.log('📂 Reading SQL file...');
    
    const sqlFile = fs.readFileSync('hrsm2.sql', 'utf8');
    
    console.log('💾 Importing database (this may take a minute)...');
    await connection.query(sqlFile);
    
    console.log('✅ Database imported successfully!');
    await connection.end();
  } else {
    console.error('❌ DATABASE_URL not found!');
    process.exit(1);
  }
}

importDatabase().catch((error) => {
  console.error('❌ Import failed:', error.message);
  process.exit(1);
});
