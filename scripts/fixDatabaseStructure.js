const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hrsm_database'
};

const checkAndFixDatabase = async () => {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database!');
    
    console.log('📋 Checking Families table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Families'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('Current Families table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if status column exists
    const hasStatusColumn = columns.some(col => col.COLUMN_NAME === 'status');
    
    if (!hasStatusColumn) {
      console.log('\n❌ Missing status column! Adding it now...');
      await connection.execute(`
        ALTER TABLE Families 
        ADD COLUMN status ENUM('Active', 'Inactive') DEFAULT 'Active'
      `);
      console.log('✅ Status column added successfully!');
    } else {
      console.log('✅ Status column already exists!');
    }
    
    console.log('\n📋 Checking Patients table structure...');
    const [patientColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Patients'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('Current Patients table columns:');
    patientColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Check if status column exists in Patients
    const hasPatientStatusColumn = patientColumns.some(col => col.COLUMN_NAME === 'status');
    
    if (!hasPatientStatusColumn) {
      console.log('\n❌ Missing status column in Patients! Adding it now...');
      await connection.execute(`
        ALTER TABLE Patients 
        ADD COLUMN status ENUM('Active', 'Inactive') DEFAULT 'Active'
      `);
      console.log('✅ Patients status column added successfully!');
    } else {
      console.log('✅ Patients status column already exists!');
    }
    
    // Check if gender column exists and has the right type
    const genderColumn = patientColumns.find(col => col.COLUMN_NAME === 'gender');
    if (!genderColumn) {
      console.log('\n❌ Missing gender column in Patients! Adding it now...');
      await connection.execute(`
        ALTER TABLE Patients 
        ADD COLUMN gender ENUM('Male', 'Female', 'Other') DEFAULT NULL
      `);
      console.log('✅ Gender column added successfully!');
    } else {
      console.log('✅ Gender column already exists!');
    }
    
    console.log('\n🔢 Checking current data counts...');
    const [familyCount] = await connection.execute('SELECT COUNT(*) as count FROM Families');
    const [patientCount] = await connection.execute('SELECT COUNT(*) as count FROM Patients');
    const [appointmentCount] = await connection.execute('SELECT COUNT(*) as count FROM Appointments');
    const [recordCount] = await connection.execute('SELECT COUNT(*) as count FROM MedicalRecords');
    
    console.log(`📊 Current Database Stats:`);
    console.log(`   Families: ${familyCount[0].count}`);
    console.log(`   Patients: ${patientCount[0].count}`);
    console.log(`   Appointments: ${appointmentCount[0].count}`);
    console.log(`   Medical Records: ${recordCount[0].count}`);
    
    console.log('\n✅ Database structure check and fix completed!');
    console.log('💡 You can now refresh the dashboard to see the data.');
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
};

// Run the script
if (require.main === module) {
  console.log('🏥 HRSM 2.0 - Database Structure Check & Fix');
  console.log('============================================');
  console.log('🔧 Checking and fixing database table structure...');
  console.log('');
  
  checkAndFixDatabase().catch(console.error);
}

module.exports = { checkAndFixDatabase };
