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

async function removeSampleAppointments() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // The specific appointment IDs we identified (Ricardo Aquino's appointments)
    const appointmentIds = [1, 2];
    
    console.log(`🎯 Targeting specific appointment IDs for removal: ${appointmentIds.join(', ')}`);
    
    // Delete the specific appointments by ID
    const [deleteResult] = await sequelize.query(`
      DELETE FROM appointments 
      WHERE id IN (${appointmentIds.join(',')})
    `);
    
    console.log(`✅ Successfully removed ${deleteResult.affectedRows || appointmentIds.length} sample appointments.`);
    
    // Verify the appointments are gone
    const [remainingAppointments] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE id IN (${appointmentIds.join(',')})
    `);
    
    if (remainingAppointments[0].count === 0) {
      console.log('✅ Verified that appointments have been successfully removed from the database.');
    } else {
      console.log(`⚠️ Warning: ${remainingAppointments[0].count} appointments may still exist.`);
    }
    
    console.log('\n🎉 Sample appointments have been removed from the dashboard!');
    console.log('ℹ️ Note: If the server is running, you may need to restart it for changes to be visible in the UI.');
    
  } catch (error) {
    console.error('❌ Error removing sample appointments:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the function
removeSampleAppointments();