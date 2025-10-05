/**
 * Check Database Tables
 * This script checks what tables exist in the database
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'hrsm2'
};

async function checkTables() {
  let connection;
  
  try {
    console.log('🔍 Checking Database Tables');
    console.log('==========================');
    
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database!');
    
    // Show all tables
    console.log('\n📋 Available Tables:');
    console.log('===================');
    const [tables] = await connection.execute('SHOW TABLES');
    
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    // Check for doctor session related tables
    console.log('\n🔍 Doctor Session Related Tables:');
    console.log('=================================');
    const sessionTables = tables.filter(table => {
      const tableName = Object.values(table)[0].toLowerCase();
      return tableName.includes('doctor') || tableName.includes('session');
    });
    
    if (sessionTables.length === 0) {
      console.log('No doctor session tables found.');
    } else {
      sessionTables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`- ${tableName}`);
      });
    }
    
    // Try to describe the doctor session table structure
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      if (tableName.toLowerCase().includes('doctor') && tableName.toLowerCase().includes('session')) {
        console.log(`\n📊 Structure of ${tableName}:`);
        console.log('========================');
        try {
          const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
          columns.forEach(col => {
            console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
          });
        } catch (error) {
          console.log(`Error describing table: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔐 Database connection closed');
    }
  }
}

// Run the check
checkTables().catch(console.error);