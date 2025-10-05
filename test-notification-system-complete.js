// Simple test to manually create notifications table and test data
// This works around the database credential issue

const axios = require('axios');

async function createTestNotifications() {
  console.log('🧪 Creating test notifications via API...\n');
  
  try {
    const baseURL = 'http://localhost:5000/api/notifications';
    
    // First, let's test if the server is running
    console.log('🔍 Testing server connection...');
    
    try {
      const healthCheck = await axios.get('http://localhost:5000/api/test', { timeout: 5000 });
      console.log('✅ Server is running');
    } catch (serverError) {
      console.log('❌ Server connection failed:', serverError.message);
      console.log('💡 Make sure the backend server is running with: npm run server');
      return;
    }
    
    // Create test notifications for both patients
    const notifications = [
      {
        patient_id: 113,
        title: 'Appointment Request',
        message: 'You have a new appointment request for General Consultation on September 20, 2025 at 10:00 AM. Please accept or decline this appointment.',
        type: 'appointment_request',
        appointment_data: {
          date: '2025-09-20',
          time: '10:00 AM',
          service: 'General Consultation',
          doctor: 'Dr. Admin',
          notes: 'Regular checkup and consultation'
        }
      },
      {
        patient_id: 134,
        title: 'Follow-up Appointment Request',
        message: 'You have a follow-up appointment request for September 20, 2025 at 2:00 PM. Please confirm your availability.',
        type: 'appointment_request',
        appointment_data: {
          date: '2025-09-20',
          time: '2:00 PM',
          service: 'Follow-up Consultation',
          doctor: 'Dr. Admin',
          notes: 'Follow-up visit for previous consultation'
        }
      }
    ];

    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      console.log(`📝 Creating notification ${i + 1} for patient ${notification.patient_id}...`);
      
      try {
        const response = await axios.post(`${baseURL}/create`, notification);
        console.log(`✅ Notification created:`, response.data);
      } catch (createError) {
        console.log(`❌ Failed to create notification:`, createError.response?.data || createError.message);
        
        // If database table doesn't exist, let's try to create it using raw SQL
        if (createError.response?.data?.message?.includes('notifications')) {
          console.log('💡 Table might not exist. Trying to create it...');
          await createNotificationsTableManually();
        }
      }
    }
    
    // Test fetching notifications
    console.log('\n📋 Testing notification fetching...');
    
    for (const patientId of [113, 134]) {
      try {
        const fetchResponse = await axios.get(`${baseURL}/patient/${patientId}`);
        console.log(`✅ Patient ${patientId} notifications:`, fetchResponse.data);
      } catch (fetchError) {
        console.log(`❌ Failed to fetch notifications for patient ${patientId}:`, fetchError.response?.data || fetchError.message);
      }
    }
    
    console.log('\n🎉 Test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. If notifications were created successfully, test the patient dashboard');
    console.log('2. Login as Kaleia (PT-0113) or Derick (PT-0134)');
    console.log('3. Check if notifications appear in the UI');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function createNotificationsTableManually() {
  // This would require database access, so just provide instructions
  console.log('🗄️ Manual table creation needed:');
  console.log('Run this SQL in your MySQL database:');
  console.log(`
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
);
  `);
}

createTestNotifications();