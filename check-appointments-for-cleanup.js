// check-appointments-for-cleanup.js
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
    logging: false
  }
);

async function checkAppointments() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Today's date in YYYY-MM-DD format for filtering appointments
    const today = '2025-09-16'; // From the screenshot

    // Get all appointments for today
    const [todayAppointments] = await sequelize.query(`
      SELECT a.*, p.firstName, p.lastName 
      FROM appointments a 
      JOIN patients p ON a.patientId = p.id 
      WHERE a.appointmentDate = '${today}'
    `);
    
    console.log(`\nFound ${todayAppointments.length} appointments for today (${today}):`);
    
    if (todayAppointments.length === 0) {
      console.log('No appointments found for today.');
      return;
    }

    todayAppointments.forEach(apt => {
      console.log(`ID: ${apt.id}, Patient: ${apt.firstName} ${apt.lastName}, Time: ${apt.appointmentTime}, Type: ${apt.type}, Status: ${apt.status}`);
    });

    // Look for Ricardo Aquino specifically
    const ricardoAppointments = todayAppointments.filter(
      apt => apt.firstName === 'Ricardo' && apt.lastName === 'Aquino'
    );
    
    console.log(`\nFound ${ricardoAppointments.length} appointments for Ricardo Aquino:`);
    
    if (ricardoAppointments.length > 0) {
      ricardoAppointments.forEach(apt => {
        console.log(`ID: ${apt.id}, Time: ${apt.appointmentTime}, Type: ${apt.type}, Status: ${apt.status}`);
      });
    } else {
      console.log('No Ricardo Aquino appointments found.');
    }

  } catch (error) {
    console.error('❌ Error checking appointments:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
checkAppointments();