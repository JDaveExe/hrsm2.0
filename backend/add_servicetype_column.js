const mysql = require('mysql2/promise');
require('dotenv').config();

async function addServiceTypeColumn() {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hrsm2'
    });

    console.log('✅ Connected to database');

    // Check if column already exists
    console.log('🔍 Checking if serviceType column exists...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'hrsm2'}' 
      AND TABLE_NAME = 'appointments' 
      AND COLUMN_NAME = 'serviceType'
    `);

    if (columns.length > 0) {
      console.log('⚠️  serviceType column already exists');
      return;
    }

    // Add the column
    console.log('➕ Adding serviceType column...');
    await connection.execute(`
      ALTER TABLE appointments 
      ADD COLUMN serviceType VARCHAR(100) DEFAULT 'General Consultation'
    `);

    console.log('✅ serviceType column added successfully');

    // Update existing records
    console.log('📝 Updating existing records with default value...');
    const [result] = await connection.execute(`
      UPDATE appointments 
      SET serviceType = 'General Consultation' 
      WHERE serviceType IS NULL
    `);

    console.log(`✅ Updated ${result.affectedRows} records`);

    // Show table structure
    console.log('📋 Current appointments table structure:');
    const [structure] = await connection.execute('DESCRIBE appointments');
    console.table(structure);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

addServiceTypeColumn();
