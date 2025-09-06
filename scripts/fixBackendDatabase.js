const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'hrsm2'
};

const fixBackendDatabase = async () => {
  let connection;
  
  try {
    console.log('🔗 Connecting to backend database...');
    console.log(`📍 Database: ${dbConfig.database} on ${dbConfig.host}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to backend database!');
    
    // Check if database exists and create if not
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await connection.query(`USE ${dbConfig.database}`);
    
    console.log('📋 Checking Families table in backend database...');
    
    // Check if table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Families'
    `, [dbConfig.database]);
    
    if (tables.length === 0) {
      console.log('❌ Families table does not exist! Creating it...');
      await connection.execute(`
        CREATE TABLE Families (
          id INT PRIMARY KEY AUTO_INCREMENT,
          familyName VARCHAR(255) NOT NULL,
          address TEXT,
          phoneNumber VARCHAR(20),
          emergencyContact VARCHAR(255),
          registrationDate DATE,
          notes TEXT,
          status ENUM('Active', 'Inactive') DEFAULT 'Active',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Families table created!');
    } else {
      console.log('✅ Families table exists!');
    }
    
    // Check table structure
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
    
    // Check for Patients table
    console.log('\n📋 Checking Patients table...');
    const [patientTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Patients'
    `, [dbConfig.database]);
    
    if (patientTables.length === 0) {
      console.log('❌ Patients table does not exist! Creating it...');
      await connection.execute(`
        CREATE TABLE Patients (
          id INT PRIMARY KEY AUTO_INCREMENT,
          familyId INT,
          firstName VARCHAR(255) NOT NULL,
          lastName VARCHAR(255) NOT NULL,
          middleName VARCHAR(255),
          dateOfBirth DATE,
          gender ENUM('Male', 'Female', 'Other'),
          relationshipToHead VARCHAR(100),
          phoneNumber VARCHAR(20),
          email VARCHAR(255),
          occupation VARCHAR(255),
          civilStatus ENUM('Single', 'Married', 'Divorced', 'Widowed'),
          bloodType ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'),
          allergies TEXT,
          medicalHistory TEXT,
          emergencyContactName VARCHAR(255),
          emergencyContactPhone VARCHAR(20),
          emergencyContactRelation VARCHAR(100),
          status ENUM('Active', 'Inactive') DEFAULT 'Active',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (familyId) REFERENCES Families(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Patients table created!');
    }
    
    // Check for other required tables
    console.log('\n📋 Checking other required tables...');
    
    // Appointments table
    const [appointmentTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Appointments'
    `, [dbConfig.database]);
    
    if (appointmentTables.length === 0) {
      console.log('❌ Appointments table does not exist! Creating it...');
      await connection.execute(`
        CREATE TABLE Appointments (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patientId INT,
          appointmentDate DATE NOT NULL,
          appointmentTime TIME NOT NULL,
          purpose VARCHAR(255),
          status ENUM('Scheduled', 'Completed', 'Cancelled', 'No-Show') DEFAULT 'Scheduled',
          notes TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ Appointments table created!');
    }
    
    // Medical Records table
    const [recordTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'MedicalRecords'
    `, [dbConfig.database]);
    
    if (recordTables.length === 0) {
      console.log('❌ MedicalRecords table does not exist! Creating it...');
      await connection.execute(`
        CREATE TABLE MedicalRecords (
          id INT PRIMARY KEY AUTO_INCREMENT,
          patientId INT,
          visitDate DATE NOT NULL,
          chiefComplaint TEXT,
          diagnosis TEXT,
          treatment TEXT,
          prescription TEXT,
          notes TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patientId) REFERENCES Patients(id) ON DELETE CASCADE
        )
      `);
      console.log('✅ MedicalRecords table created!');
    }
    
    console.log('\n🔢 Checking current data counts in backend database...');
    const [familyCount] = await connection.execute('SELECT COUNT(*) as count FROM Families');
    const [patientCount] = await connection.execute('SELECT COUNT(*) as count FROM Patients');
    const [appointmentCount] = await connection.execute('SELECT COUNT(*) as count FROM Appointments');
    const [recordCount] = await connection.execute('SELECT COUNT(*) as count FROM MedicalRecords');
    
    console.log(`📊 Backend Database Stats:`);
    console.log(`   Families: ${familyCount[0].count}`);
    console.log(`   Patients: ${patientCount[0].count}`);
    console.log(`   Appointments: ${appointmentCount[0].count}`);
    console.log(`   Medical Records: ${recordCount[0].count}`);
    
    // If no families exist, copy from the other database or create sample data
    if (familyCount[0].count === 0) {
      console.log('\n💾 No families found, creating sample families...');
      
      // Check which columns actually exist for inserting data
      const columnExists = (columnName) => columns.some(col => col.COLUMN_NAME === columnName);
      
      const sampleFamilies = [
        ['Santos', 'Juan Santos', '123 Maybunga St., Marikina City', '09171234567', 1],
        ['Cruz', 'Maria Cruz', '456 Riverside Ave., Marikina City', '09272345678', 1],
        ['Reyes', 'Pedro Reyes', '789 Health Center Rd., Marikina City', '09373456789', 1],
        ['Garcia', 'Ana Garcia', '321 Wellness St., Marikina City', '09474567890', 1],
        ['Lopez', 'Rosa Lopez', '654 Care Ave., Marikina City', '09575678901', 1]
      ];
      
      for (const family of sampleFamilies) {
        if (columnExists('surname') && columnExists('headOfFamily')) {
          // Use existing column structure
          await connection.execute(`
            INSERT INTO Families (familyName, surname, headOfFamily, address, contactNumber, isActive)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [family[0] + ' Family', family[0], family[1], family[2], family[3], family[4]]);
        } else {
          // Use new column structure
          await connection.execute(`
            INSERT INTO Families (familyName, address, status)
            VALUES (?, ?, ?)
          `, [family[0] + ' Family', family[2], 'Active']);
        }
      }
      
      console.log(`✅ Created ${sampleFamilies.length} sample families!`);
    }
    
    console.log('\n✅ Backend database structure check and fix completed!');
    console.log('💡 You can now restart the backend server to see the data.');
    
  } catch (error) {
    console.error('❌ Error fixing backend database:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
};

// Run the script
if (require.main === module) {
  console.log('🏥 HRSM 2.0 - Backend Database Fix');
  console.log('==================================');
  console.log('🔧 Checking and fixing backend database structure...');
  console.log('');
  
  fixBackendDatabase().catch(console.error);
}

module.exports = { fixBackendDatabase };
