/**
 * Script to clear all patient and family data from the database
 * This will remove all patients and families to start with a fresh table
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hrsm_db'
};

async function clearPatientData() {
  const mysql = require('mysql2/promise');
  
  try {
    console.log('🔄 Connecting to database...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database successfully');
    
    // Start transaction
    await connection.beginTransaction();
    
    try {
      // Clear patients table (this will also clear related records due to foreign key constraints)
      console.log('🗑️  Clearing patients table...');
      await connection.execute('DELETE FROM patients');
      
      // Clear families table
      console.log('🗑️  Clearing families table...');
      await connection.execute('DELETE FROM families');
      
      // Reset auto-increment values
      console.log('🔄 Resetting auto-increment values...');
      await connection.execute('ALTER TABLE patients AUTO_INCREMENT = 1');
      await connection.execute('ALTER TABLE families AUTO_INCREMENT = 1');
      
      // Also clear related tables if they exist
      const relatedTables = [
        'medical_records',
        'appointments',
        'vital_signs',
        'prescriptions',
        'audit_logs'
      ];
      
      for (const table of relatedTables) {
        try {
          console.log(`🗑️  Clearing ${table} table...`);
          await connection.execute(`DELETE FROM ${table}`);
          await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
        } catch (error) {
          console.log(`⚠️  Table ${table} might not exist, skipping...`);
        }
      }
      
      // Commit transaction
      await connection.commit();
      console.log('✅ All patient and family data cleared successfully!');
      console.log('📊 Database is now ready for fresh data entry');
      
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      await connection.end();
    }
    
  } catch (error) {
    console.error('❌ Error clearing data:', error.message);
    process.exit(1);
  }
}

// Alternative function for development environment (using JSON files)
async function clearDevData() {
  console.log('🔄 Clearing development data files...');
  
  const dataFiles = [
    path.join(__dirname, '../src/data/patients.json'),
    path.join(__dirname, '../src/data/families.json'),
    path.join(__dirname, '../backend/data/patients.json'),
    path.join(__dirname, '../backend/data/families.json')
  ];
  
  for (const filePath of dataFiles) {
    try {
      if (fs.existsSync(filePath)) {
        // Write empty array to JSON files
        fs.writeFileSync(filePath, JSON.stringify([], null, 2));
        console.log(`✅ Cleared: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not clear ${filePath}: ${error.message}`);
    }
  }
  
  console.log('✅ Development data cleared successfully!');
}

// Main execution
async function main() {
  console.log('🧹 Patient Data Cleanup Script');
  console.log('==============================');
  
  const args = process.argv.slice(2);
  const useDevMode = args.includes('--dev');
  
  if (useDevMode) {
    console.log('📁 Running in development mode (JSON files)');
    await clearDevData();
  } else {
    console.log('🗄️  Running in database mode');
    await clearPatientData();
  }
  
  console.log('🎉 Cleanup completed!');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { clearPatientData, clearDevData };
