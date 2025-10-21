// Simple test to check notification route and database table status
const axios = require('axios');

async function testNotificationRoute() {
  console.log('🔍 Testing notification route and database...\n');
  
  try {
    // Test if route exists and what error we get
    console.log('📡 Testing GET /api/notifications/patient/113...');
    
    const response = await axios.get('http://localhost:5000/api/notifications/patient/113');
    console.log('✅ Success:', response.data);
    
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    
    if (error.response?.data?.error?.includes('table') || 
        error.response?.data?.error?.includes('notifications')) {
      console.log('\n💡 The notifications table doesn\'t exist yet.');
      console.log('Let\'s create it using the existing patient table as reference...');
      
      // Try to create the table using a simpler approach
      await createTableViaAPI();
    }
  }
}

async function createTableViaAPI() {
  console.log('\n🗄️ Attempting to create notifications table...');
  
  // We need to create an endpoint that creates the table
  // Let me add a temporary route to our notifications.js file
  
  console.log('📝 Instructions to create the table:');
  console.log('');
  console.log('Since we can\'t directly access the MySQL database,');
  console.log('let\'s add a temporary route to create the table.');
  console.log('');
  console.log('Add this to the notifications.js routes file:');
  console.log('');
  console.log(`
// TEMPORARY ROUTE - Remove after setup
router.get('/setup-table', async (req, res) => {
  try {
    const createTableSQL = \`
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
        INDEX idx_notifications_status (status)
      )
    \`;
    
    await sequelize.query(createTableSQL);
    
    // Insert test data
    const insertSQL = \`
      INSERT INTO notifications (patient_id, title, message, type, status, appointment_data) VALUES 
      (113, 'Appointment Request', 'You have a new appointment request for General Consultation', 'appointment_request', 'pending', '{"date": "2025-09-20", "time": "10:00 AM", "service": "General Consultation", "notes": "Regular checkup"}'),
      (134, 'Appointment Request', 'You have a new appointment request for Follow-up Consultation', 'appointment_request', 'pending', '{"date": "2025-09-20", "time": "2:00 PM", "service": "Follow-up Consultation", "notes": "Follow-up visit"}')
    \`;
    
    await sequelize.query(insertSQL);
    
    res.json({ success: true, message: 'Notifications table created and test data inserted' });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
  `);
  
  console.log('Then visit: http://localhost:5000/api/notifications/setup-table');
  console.log('');
}

testNotificationRoute();