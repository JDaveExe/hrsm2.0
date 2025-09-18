const { Sequelize } = require('sequelize');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'hrsm2',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, // Disable logging for cleaner output
  }
);

async function verifyCleanState() {
  try {
    console.log('🔍 Verifying clean state of appointments...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Checking for sample appointments on ${today}...`);
    
    // Check for any Ricardo Aquino appointments
    const [ricardoAppointments] = await sequelize.query(`
      SELECT id, patientName, appointmentDate, appointmentTime, type, status 
      FROM appointments 
      WHERE patientName LIKE '%Ricardo Aquino%'
    `);
    
    if (ricardoAppointments.length > 0) {
      console.log(`❌ Found ${ricardoAppointments.length} Ricardo Aquino appointments that need to be removed:`);
      ricardoAppointments.forEach(apt => {
        console.log(`   ID: ${apt.id}, Date: ${apt.appointmentDate}, Time: ${apt.appointmentTime}`);
      });
    } else {
      console.log('✅ No Ricardo Aquino sample appointments found.');
    }
    
    // Check for today's appointments
    const [todayAppointments] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE appointmentDate = '${today}'
    `);
    
    const count = todayAppointments[0].count;
    if (count > 0) {
      console.log(`ℹ️ There are still ${count} appointments scheduled for today.`);
    } else {
      console.log('✅ No appointments scheduled for today.');
    }
    
    // Overall status
    if (ricardoAppointments.length === 0) {
      console.log('\n🎉 Dashboard is clean of sample data!');
    } else {
      console.log('\n⚠️ Sample data still exists. Run remove-sample-appointments.js to clean up.');
    }
    
  } catch (error) {
    console.error('❌ Error verifying clean state:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
verifyCleanState();
