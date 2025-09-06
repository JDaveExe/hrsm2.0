/**
 * Database Migration: Add serviceType column to appointments table
 * Run this to fix the "Unknown column 'Appointment.serviceType'" error
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function addServiceTypeColumn() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'healthcare_db'
    });

    console.log('🔧 Connected to database...');

    // Check if column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'serviceType'
    `, [process.env.DB_NAME || 'healthcare_db']);

    if (columns.length > 0) {
      console.log('✅ serviceType column already exists in appointments table');
      return;
    }

    // Add the serviceType column
    console.log('📝 Adding serviceType column to appointments table...');
    
    await connection.execute(`
      ALTER TABLE appointments 
      ADD COLUMN serviceType VARCHAR(100) NULL 
      COMMENT 'Type of service for the appointment'
    `);

    // Set default values based on existing 'type' column
    console.log('🔄 Setting default serviceType values based on existing type column...');
    
    await connection.execute(`
      UPDATE appointments 
      SET serviceType = CASE 
        WHEN type = 'Consultation' THEN 'General Consultation'
        WHEN type = 'Follow-up' THEN 'Follow-up Visit'
        WHEN type = 'Check-up' THEN 'Health Check-up'
        WHEN type = 'Vaccination' THEN 'Vaccination Service'
        WHEN type = 'Dental Consultation' THEN 'Dental Consultation'
        WHEN type = 'Dental Procedure' THEN 'Dental Procedure'
        WHEN type = 'Out-Patient' THEN 'Out-Patient Service'
        WHEN type = 'Emergency' THEN 'Emergency Service'
        WHEN type = 'Lab Test' THEN 'Laboratory Test'
        ELSE 'General Service'
      END
      WHERE serviceType IS NULL
    `);

    // Check the results
    const [result] = await connection.execute(`
      SELECT COUNT(*) as total, serviceType 
      FROM appointments 
      GROUP BY serviceType
    `);

    console.log('✅ Migration completed successfully!');
    console.log('📊 ServiceType distribution:');
    result.forEach(row => {
      console.log(`   - ${row.serviceType}: ${row.total} appointments`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  Column already exists');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('ℹ️  Check your database credentials in .env file');
    } else {
      console.log('ℹ️  Full error:', error);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
if (require.main === module) {
  console.log('🚀 Starting serviceType column migration...');
  addServiceTypeColumn();
}

module.exports = addServiceTypeColumn;
