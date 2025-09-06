const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hrsm_database'
};

// Sample data for generating realistic families
const filipinoFamilyNames = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Tomas', 'Andres',
  'Marquez', 'Romualdez', 'Bersamin', 'Duterte', 'Aquino', 'Ramos', 'Estrada', 'Arroyo', 'Macapagal', 'Roxas',
  'Quezon', 'Laurel', 'Osmeña', 'Magsaysay', 'Quirino', 'Elpidio', 'Manuel', 'Sergio', 'Diosdado', 'Ferdinand',
  'Corazon', 'Fidel', 'Joseph', 'Gloria', 'Benigno', 'Rodrigo', 'Sara', 'Leni', 'Bongbong', 'Manny',
  'Dela Cruz', 'Villanueva', 'Francisco', 'Soriano', 'Castillo', 'Ramos', 'Flores', 'Hernandez', 'Perez', 'Gonzales',
  'Rivera', 'Gomez', 'Fernandez', 'Lopez', 'Gonzalez', 'Rodriguez', 'Martinez', 'Sanchez', 'Ramirez', 'Vargas'
];

const barangays = [
  'Barangay Maligaya', 'Barangay Masaya', 'Barangay Maunlad', 'Barangay Tahanan', 'Barangay Kalinawan',
  'Barangay Maginhawa', 'Barangay Payapa', 'Barangay Masagana', 'Barangay Maayos', 'Barangay Malinis',
  'Barangay Santo Niño', 'Barangay San Jose', 'Barangay Santa Maria', 'Barangay San Antonio', 'Barangay Santa Cruz',
  'Barangay San Pedro', 'Barangay Santa Ana', 'Barangay San Miguel', 'Barangay Santo Tomas', 'Barangay San Juan',
  'Barangay New Era', 'Barangay Sunrise', 'Barangay Golden Valley', 'Barangay Green Hills', 'Barangay Blue Ridge',
  'Barangay Sunset View', 'Barangay Mountain View', 'Barangay River Side', 'Barangay Garden Grove', 'Barangay Pine Tree'
];

const streets = [
  'Rizal Street', 'Bonifacio Avenue', 'Mabini Street', 'Del Pilar Road', 'Luna Street', 'Quezon Boulevard',
  'Marcos Highway', 'EDSA Extension', 'Ortigas Avenue', 'Shaw Boulevard', 'Taft Avenue', 'Espana Boulevard',
  'Aurora Boulevard', 'Katipunan Avenue', 'Commonwealth Avenue', 'Mindanao Avenue', 'Magsaysay Boulevard',
  'Roxas Boulevard', 'Dewey Boulevard', 'Harrison Street', 'Padre Faura Street', 'Ayala Avenue',
  'Makati Avenue', 'Paseo de Roxas', 'Gil Puyat Avenue', 'Chino Roces Avenue', 'Buendia Avenue',
  'Kalayaan Avenue', 'Magallanes Street', 'Legaspi Street', 'Salcedo Street', 'Herrera Street'
];

// Helper functions
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomPhoneNumber = () => {
  const prefixes = ['0917', '0918', '0919', '0920', '0921', '0922', '0923', '0924', '0925', '0926', '0927', '0928', '0929'];
  const prefix = getRandomItem(prefixes);
  const suffix = String(getRandomNumber(1000000, 9999999));
  return prefix + suffix;
};

const generateFamilyData = () => {
  const familyName = getRandomItem(filipinoFamilyNames);
  const barangay = getRandomItem(barangays);
  const street = getRandomItem(streets);
  const houseNumber = getRandomNumber(1, 999);
  
  return {
    familyName: familyName,
    address: `${houseNumber} ${street}, ${barangay}, Maybunga, Pasig City`,
    phoneNumber: getRandomPhoneNumber(),
    emergencyContact: getRandomPhoneNumber(),
    registrationDate: getRandomDate(),
    notes: generateFamilyNotes(),
    status: getRandomItem(['Active', 'Active', 'Active', 'Inactive']) // 75% active
  };
};

const getRandomDate = () => {
  const start = new Date(2020, 0, 1); // January 1, 2020
  const end = new Date(2025, 7, 21);  // August 21, 2025
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime).toISOString().split('T')[0];
};

const generateFamilyNotes = () => {
  const notes = [
    'Regular check-ups scheduled',
    'Complete vaccination records maintained',
    'No known allergies reported',
    'Annual health screening completed',
    'Preventive care program enrolled',
    'Health insurance active',
    'Dental check-up due next month',
    'Eye examination completed',
    'No chronic conditions reported',
    'Emergency contact verified',
    'Medical history updated',
    'Nutrition counseling provided',
    'Health education sessions attended',
    'Community health program participant',
    'Referral services coordinated'
  ];
  
  // Return 1-3 random notes
  const numNotes = getRandomNumber(1, 3);
  const selectedNotes = [];
  for (let i = 0; i < numNotes; i++) {
    const note = getRandomItem(notes);
    if (!selectedNotes.includes(note)) {
      selectedNotes.push(note);
    }
  }
  return selectedNotes.join('; ');
};

// Database operations
const generateFamilies = async () => {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully!');
    
    console.log('🏠 Generating 60 family records...');
    
    const families = [];
    for (let i = 0; i < 60; i++) {
      const family = generateFamilyData();
      families.push(family);
    }
    
    console.log('💾 Inserting families into database...');
    
    // Insert families
    for (let i = 0; i < families.length; i++) {
      const family = families[i];
      const insertQuery = `
        INSERT INTO Families (
          familyName, 
          address, 
          phoneNumber, 
          emergencyContact, 
          registrationDate, 
          notes, 
          status,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      await connection.execute(insertQuery, [
        family.familyName,
        family.address,
        family.phoneNumber,
        family.emergencyContact,
        family.registrationDate,
        family.notes,
        family.status
      ]);
      
      // Progress indicator
      if ((i + 1) % 10 === 0) {
        console.log(`   ✓ ${i + 1}/60 families created...`);
      }
    }
    
    console.log('✅ All 60 families created successfully!');
    
    // Display summary
    console.log('\n📊 Family Generation Summary:');
    console.log('================================');
    
    const [activeCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM Families WHERE status = "Active"'
    );
    const [inactiveCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM Families WHERE status = "Inactive"'
    );
    const [totalCount] = await connection.execute(
      'SELECT COUNT(*) as count FROM Families'
    );
    
    console.log(`📊 Total Families: ${totalCount[0].count}`);
    console.log(`✅ Active Families: ${activeCount[0].count}`);
    console.log(`⏸️  Inactive Families: ${inactiveCount[0].count}`);
    
    // Show sample families
    console.log('\n🏠 Sample Generated Families:');
    console.log('==============================');
    const [sampleFamilies] = await connection.execute(
      'SELECT * FROM Families ORDER BY id DESC LIMIT 5'
    );
    
    sampleFamilies.forEach((family, index) => {
      console.log(`${index + 1}. ${family.familyName} Family`);
      console.log(`   📍 Address: ${family.address}`);
      console.log(`   📞 Phone: ${family.phoneNumber}`);
      console.log(`   🚨 Emergency: ${family.emergencyContact}`);
      console.log(`   📅 Registered: ${family.registrationDate}`);
      console.log(`   📝 Status: ${family.status}`);
      console.log('');
    });
    
    console.log('🎉 Family data generation completed!');
    console.log('💡 You can now add patients to these families through the admin dashboard.');
    
  } catch (error) {
    console.error('❌ Error generating families:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Solution: Make sure MySQL server is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Solution: Check your database credentials in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Solution: Make sure the database exists and is accessible');
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
  console.log('🏥 HRSM 2.0 - Family Data Generator');
  console.log('===================================');
  console.log('📋 Generating 60 realistic Filipino families...');
  console.log('🎯 Ready for patient registration in admin dashboard');
  console.log('');
  
  generateFamilies().catch(console.error);
}

module.exports = { generateFamilies };
