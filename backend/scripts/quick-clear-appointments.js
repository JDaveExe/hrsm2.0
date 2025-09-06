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
    logging: false, // Disable logging for cleaner output
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

async function quickClearAppointments() {
  try {
    console.log('🗑️  Quick clearing all appointments...');
    
    // Test database connection
    await sequelize.authenticate();
    
    // Get count before deletion
    const [countResult] = await sequelize.query('SELECT COUNT(*) as count FROM appointments');
    const appointmentCount = countResult[0].count;
    
    if (appointmentCount === 0) {
      console.log('✅ No appointments to delete. Database is already clean.');
      return;
    }
    
    // Delete all appointments
    await sequelize.query('DELETE FROM appointments');
    
    // Reset auto-increment counter
    await sequelize.query('ALTER TABLE appointments AUTO_INCREMENT = 1');
    
    console.log(`✅ Successfully deleted ${appointmentCount} appointments.`);
    console.log('🎉 Calendar is now clean and ready for fresh appointments!');
    
  } catch (error) {
    console.error('❌ Error clearing appointments:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Run immediately without confirmation
quickClearAppointments();
