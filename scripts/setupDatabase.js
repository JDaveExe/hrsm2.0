const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration without database name for initial setup
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

const setupDatabase = async () => {
  let connection;
  
  try {
    console.log('🔗 Connecting to MySQL server...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL server!');
    
    const dbName = process.env.DB_NAME || 'hrsm_database';
    
    console.log(`🗄️  Creating database: ${dbName}`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log('✅ Database created successfully!');
    
    console.log(`🔄 Switching to database: ${dbName}`);
    await connection.query(`USE \`${dbName}\``);
    
    console.log('📋 Creating Families table...');
    const createFamiliesTable = `
      CREATE TABLE IF NOT EXISTS Families (
        id INT AUTO_INCREMENT PRIMARY KEY,
        familyName VARCHAR(255) NOT NULL,
        address TEXT,
        phoneNumber VARCHAR(20),
        emergencyContact VARCHAR(20),
        registrationDate DATE,
        notes TEXT,
        status ENUM('Active', 'Inactive') DEFAULT 'Active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.query(createFamiliesTable);
    console.log('✅ Families table created successfully!');
    
    console.log('📋 Creating Patients table...');
    const createPatientsTable = `
      CREATE TABLE IF NOT EXISTS Patients (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.query(createPatientsTable);
    console.log('✅ Patients table created successfully!');
    
    console.log('📋 Creating MedicalRecords table...');
    const createMedicalRecordsTable = `
      CREATE TABLE IF NOT EXISTS MedicalRecords (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patientId INT NOT NULL,
        visitDate DATE NOT NULL,
        chiefComplaint TEXT,
        diagnosis TEXT,
        treatment TEXT,
        prescription TEXT,
        notes TEXT,
        doctorName VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.query(createMedicalRecordsTable);
    console.log('✅ MedicalRecords table created successfully!');
    
    console.log('📋 Creating Appointments table...');
    const createAppointmentsTable = `
      CREATE TABLE IF NOT EXISTS Appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patientId INT NOT NULL,
        appointmentDate DATE NOT NULL,
        appointmentTime TIME NOT NULL,
        type VARCHAR(100),
        status ENUM('Scheduled', 'Confirmed', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
        doctorName VARCHAR(255),
        notes TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    await connection.query(createAppointmentsTable);
    console.log('✅ Appointments table created successfully!');
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('================================');
    console.log('✅ Database created');
    console.log('✅ Families table created');
    console.log('✅ Patients table created');
    console.log('✅ MedicalRecords table created');
    console.log('✅ Appointments table created');
    console.log('\n💡 You can now run: npm run generate-families');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Solution: Make sure MySQL server is running');
      console.error('   - Start MySQL service');
      console.error('   - Check if MySQL is installed');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Solution: Check your database credentials');
      console.error('   - Verify DB_USER and DB_PASSWORD in .env file');
      console.error('   - Make sure MySQL user has CREATE DATABASE privileges');
    }
    
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed.');
    }
  }
};

// Run the script
if (require.main === module) {
  console.log('🏥 HRSM 2.0 - Database Setup');
  console.log('============================');
  console.log('🔧 Setting up MySQL database and tables...');
  console.log('');
  
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase };
