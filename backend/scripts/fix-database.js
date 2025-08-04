// Script to fix the database issues with duplicate indexes
const { sequelize } = require('../config/database');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Family = require('../models/Family');

async function fixDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database');
    
    console.log('Dropping Patients table...');
    await sequelize.query('DROP TABLE IF EXISTS Patients');
    console.log('✅ Dropped old Patients table with duplicate indexes');
    
    console.log('Recreating Patients table with correct indexes...');
    await Patient.sync({ force: true });
    console.log('✅ Created new Patients table with proper indexes');
    
    // Verify the new table
    const [results] = await sequelize.query('SHOW INDEXES FROM Patients');
    console.log(`New index count: ${results.length}`);
    console.table(results.map(idx => ({ 
      key_name: idx.Key_name, 
      column_name: idx.Column_name, 
      non_unique: idx.Non_unique 
    })));
    
    console.log('✅ Database fixed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixDatabase();
