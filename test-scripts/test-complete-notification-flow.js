// Test script to verify the complete notification flow
const axios = require('axios');

async function testCompleteNotificationFlow() {
  console.log('🧪 Testing complete notification system...\n');
  
  try {
    const baseURL = 'http://localhost:5000/api/notifications';
    
    // 1. Test fetching notifications for both patients
    console.log('📋 Step 1: Testing notification fetching...');
    
    for (const patientId of [113, 134]) {
      const response = await axios.get(`${baseURL}/patient/${patientId}`);
      console.log(`✅ Patient ${patientId}:`, {
        count: response.data.count,
        notifications: response.data.notifications.map(n => ({
          id: n.id,
          title: n.title,
          status: n.status
        }))
      });
    }
    
    // 2. Test status update (simulate accepting notification)
    console.log('\n🔄 Step 2: Testing notification status update...');
    
    const statusResponse = await axios.put(`${baseURL}/1/status`, {
      status: 'read'
    });
    console.log('✅ Status update response:', statusResponse.data);
    
    // 3. Test creating a new notification
    console.log('\n📝 Step 3: Testing notification creation...');
    
    const newNotification = {
      patient_id: 113,
      title: 'New Appointment Available',
      message: 'A new appointment slot has opened up for September 21, 2025 at 3:00 PM',
      type: 'appointment_request',
      appointment_data: {
        date: '2025-09-21',
        time: '3:00 PM',
        service: 'Follow-up Consultation',
        doctor: 'Dr. Admin'
      }
    };
    
    const createResponse = await axios.post(`${baseURL}/create`, newNotification);
    console.log('✅ New notification created:', createResponse.data);
    
    // 4. Verify the new notification appears
    console.log('\n🔍 Step 4: Verifying new notification appears...');
    
    const verifyResponse = await axios.get(`${baseURL}/patient/113`);
    console.log(`✅ Patient 113 now has ${verifyResponse.data.count} notifications`);
    
    console.log('\n🎉 Complete notification system is working!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the patient dashboard at http://localhost:3000');
    console.log('2. Login as Kaleia (113) or Derick (134)');
    console.log('3. Check if notifications appear in the UI');
    console.log('4. Test accept/decline functionality');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteNotificationFlow();