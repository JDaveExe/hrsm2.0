// Create notifications table using existing database connection
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: console.log, // Show SQL queries for debugging
  }
);

async function createNotificationsTable() {
  console.log('🗄️ Creating notifications table in MySQL...\n');
  
  try {
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Create notifications table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'appointment_request',
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        appointment_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_notifications_patient_id (patient_id),
        INDEX idx_notifications_status (status),
        INDEX idx_notifications_created_at (created_at),
        
        FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
      );
    `;
    
    await sequelize.query(createTableSQL);
    console.log('✅ Notifications table created successfully');
    
    // Insert test data
    console.log('\n📝 Inserting test notifications...');
    
    const insertSQL = `
      INSERT INTO notifications (patient_id, title, message, type, status, appointment_data) VALUES 
      (113, 'Appointment Request', 'You have a new appointment request for General Consultation', 'appointment_request', 'pending', '{"date": "2025-09-20", "time": "10:00 AM", "service": "General Consultation", "notes": "Regular checkup"}'),
      (134, 'Appointment Request', 'You have a new appointment request for Follow-up Consultation', 'appointment_request', 'pending', '{"date": "2025-09-20", "time": "2:00 PM", "service": "Follow-up Consultation", "notes": "Follow-up visit"}')
      ON DUPLICATE KEY UPDATE id=id;
    `;
    
    await sequelize.query(insertSQL);
    console.log('✅ Test notifications inserted');
    
    // Verify data
    console.log('\n🔍 Verifying notifications...');
    const [results] = await sequelize.query('SELECT * FROM notifications ORDER BY created_at DESC');
    
    console.log(`📊 Found ${results.length} notifications:`);
    results.forEach(notif => {
      console.log(`  - ID: ${notif.id}, Patient: ${notif.patient_id}, Title: ${notif.title}, Status: ${notif.status}`);
    });
    
    console.log('\n🎉 Database setup completed!');
    console.log('📋 Next: Test the API endpoints');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    if (error.original?.code === 'ER_NO_REFERENCED_ROW_2') {
      console.log('\n💡 Tip: Make sure patients with IDs 113 and 134 exist in the patients table');
    }
  } finally {
    await sequelize.close();
  }
}

createNotificationsTable();