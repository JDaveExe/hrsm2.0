const axios = require('axios');

async function testNotificationAPI() {
  console.log('🧪 Testing new notification API endpoints...\n');
  
  try {
    const baseURL = 'http://localhost:5000/api/notifications';
    
    // 1. Test creating a notification for Kaleia (patient ID 113)
    console.log('📝 Step 1: Creating test notification for Kaleia...');
    
    const newNotification = {
      patient_id: 113,
      title: 'Appointment Request',
      message: 'You have a new appointment request for General Consultation on September 20, 2025 at 10:00 AM',
      type: 'appointment_request',
      appointment_data: {
        date: '2025-09-20',
        time: '10:00 AM',
        service: 'General Consultation',
        notes: 'Regular checkup'
      }
    };
    
    try {
      const createResponse = await axios.post(`${baseURL}/create`, newNotification);
      console.log('✅ Notification created:', createResponse.data);
    } catch (createError) {
      console.log('❌ Create failed:', createError.response?.data || createError.message);
    }
    
    // 2. Test fetching notifications for Kaleia
    console.log('\n📋 Step 2: Fetching notifications for patient 113...');
    
    try {
      const fetchResponse = await axios.get(`${baseURL}/patient/113`);
      console.log('✅ Notifications fetched:', fetchResponse.data);
    } catch (fetchError) {
      console.log('❌ Fetch failed:', fetchError.response?.data || fetchError.message);
    }
    
    // 3. Test unread count
    console.log('\n🔢 Step 3: Getting unread count for patient 113...');
    
    try {
      const countResponse = await axios.get(`${baseURL}/patient/113/unread`);
      console.log('✅ Unread count:', countResponse.data);
    } catch (countError) {
      console.log('❌ Count failed:', countError.response?.data || countError.message);
    }
    
    // 4. Test creating notification for Derick (patient ID 134)
    console.log('\n📝 Step 4: Creating test notification for Derick...');
    
    const derickNotification = {
      patient_id: 134,
      title: 'Follow-up Appointment',
      message: 'You have a follow-up appointment scheduled for September 20, 2025 at 2:00 PM',
      type: 'appointment_request',
      appointment_data: {
        date: '2025-09-20',
        time: '2:00 PM',
        service: 'Follow-up Consultation',
        notes: 'Follow-up visit'
      }
    };
    
    try {
      const derickResponse = await axios.post(`${baseURL}/create`, derickNotification);
      console.log('✅ Derick notification created:', derickResponse.data);
      
      // Update status to test the update endpoint
      const notificationId = derickResponse.data.notification.id;
      const statusResponse = await axios.put(`${baseURL}/${notificationId}/status`, {
        status: 'read'
      });
      console.log('✅ Status updated:', statusResponse.data);
      
    } catch (derickError) {
      console.log('❌ Derick notification failed:', derickError.response?.data || derickError.message);
    }
    
    console.log('\n🎉 API testing completed!');
    console.log('\n📊 Next steps:');
    console.log('1. If APIs work, update frontend to use these endpoints');
    console.log('2. Replace localStorage with API polling');
    console.log('3. Test with patient dashboard');
    
  } catch (error) {
    console.error('❌ Test script error:', error.message);
  }
}

testNotificationAPI();