const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'hrsm_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

async function clearAllAppointments() {
  try {
    console.log('🗑️  Starting to clear all appointments...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Get count before deletion
    const [countResult] = await sequelize.query('SELECT COUNT(*) as count FROM appointments');
    const appointmentCount = countResult[0].count;
    console.log(`📊 Found ${appointmentCount} appointments in the database.`);
    
    if (appointmentCount === 0) {
      console.log('ℹ️  No appointments to delete. Database is already clean.');
      return;
    }
    
    // Confirm deletion
    console.log('⚠️  This will permanently delete ALL appointments from the database.');
    console.log('⚠️  This action cannot be undone!');
    
    // Delete all appointments
    const [deleteResult] = await sequelize.query('DELETE FROM appointments');
    console.log(`✅ Successfully deleted ${appointmentCount} appointments.`);
    
    // Reset auto-increment counter (optional)
    await sequelize.query('ALTER TABLE appointments AUTO_INCREMENT = 1');
    console.log('✅ Reset appointment ID counter to start from 1.');
    
    // Verify deletion
    const [verifyResult] = await sequelize.query('SELECT COUNT(*) as count FROM appointments');
    const remainingCount = verifyResult[0].count;
    
    if (remainingCount === 0) {
      console.log('🎉 All appointments have been successfully cleared!');
      console.log('📅 The calendar should now show no pins.');
      console.log('🆕 You can start creating new appointments from scratch.');
    } else {
      console.log(`❌ Warning: ${remainingCount} appointments still remain in the database.`);
    }
    
  } catch (error) {
    console.error('❌ Error clearing appointments:', error);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Make sure your MySQL server is running and the database exists.');
    } else if (error.name === 'SequelizeAccessDeniedError') {
      console.error('💡 Check your database credentials in the .env file.');
    } else {
      console.error('💡 Full error details:', error);
    }
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed.');
  }
}

// Add confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚨 APPOINTMENT DELETION TOOL 🚨');
console.log('===============================');
console.log('This script will delete ALL appointments from the database.');
console.log('This includes:');
console.log('- All scheduled appointments');
console.log('- All completed appointments');
console.log('- All cancelled appointments');
console.log('- All appointment history');
console.log('');
console.log('⚠️  THIS ACTION CANNOT BE UNDONE! ⚠️');
console.log('');

rl.question('Are you sure you want to proceed? Type "DELETE ALL" to confirm: ', (answer) => {
  if (answer === 'DELETE ALL') {
    console.log('✅ Confirmation received. Starting deletion...');
    rl.close();
    clearAllAppointments();
  } else {
    console.log('❌ Deletion cancelled. No appointments were deleted.');
    rl.close();
  }
});
