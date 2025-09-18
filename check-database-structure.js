const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkDatabaseStructure() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'hrsm2'
    });

    console.log('🔍 CHECKING DATABASE STRUCTURE\n');

    // 1. List all tables
    console.log('📊 TABLES IN DATABASE:');
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('  No tables found in database');
      return;
    }

    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
    });

    // 2. Look for checkup-related tables
    console.log('\n🔍 LOOKING FOR CHECKUP/MEDICAL TABLES:');
    const checkupTables = tables.filter(table => {
      const tableName = Object.values(table)[0].toLowerCase();
      return tableName.includes('checkup') || tableName.includes('medical') || tableName.includes('appointment') || tableName.includes('treatment');
    });

    if (checkupTables.length > 0) {
      console.log('  Found potential checkup tables:');
      for (const table of checkupTables) {
        const tableName = Object.values(table)[0];
        console.log(`  - ${tableName}`);
        
        // Get sample data from each table
        try {
          const [sampleData] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 5`);
          console.log(`    Sample records: ${sampleData.length}`);
          if (sampleData.length > 0) {
            console.log(`    Columns: ${Object.keys(sampleData[0]).join(', ')}`);
          }
        } catch (error) {
          console.log(`    Error reading table: ${error.message}`);
        }
      }
    } else {
      console.log('  No obvious checkup tables found');
    }

    // 3. Look for vaccination tables
    console.log('\n💉 LOOKING FOR VACCINATION TABLES:');
    const vaccinationTables = tables.filter(table => {
      const tableName = Object.values(table)[0].toLowerCase();
      return tableName.includes('vaccin') || tableName.includes('immun');
    });

    if (vaccinationTables.length > 0) {
      vaccinationTables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`  - ${tableName}`);
      });
    } else {
      console.log('  No vaccination tables found');
    }

    // 4. Check the most likely table for patient records
    console.log('\n👥 LOOKING FOR PATIENT TABLES:');
    const patientTables = tables.filter(table => {
      const tableName = Object.values(table)[0].toLowerCase();
      return tableName.includes('patient') || tableName.includes('member') || tableName.includes('user');
    });

    for (const table of patientTables) {
      const tableName = Object.values(table)[0];
      console.log(`  - ${tableName}`);
      
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
        console.log(`    Total records: ${count[0].total}`);
        
        const [sampleData] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
        if (sampleData.length > 0) {
          console.log(`    Columns: ${Object.keys(sampleData[0]).join(', ')}`);
        }
      } catch (error) {
        console.log(`    Error reading table: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking database structure:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseStructure();