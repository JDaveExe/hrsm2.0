// Simple test for the notify-doctor endpoint
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testNotifyDoctor = async () => {
  try {
    console.log('🧪 Testing notify-doctor endpoint...');
    
    // First get today's checkups
    console.log('1. Fetching today\'s checkups...');
    const checkupsResponse = await axios.get(`${BASE_URL}/checkups/today`, {
      headers: {
        'Authorization': 'Bearer temp-admin-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Found ${checkupsResponse.data.length} checkups`);
    
    if (checkupsResponse.data.length === 0) {
      console.log('No checkups available for testing');
      return;
    }
    
    const testCheckup = checkupsResponse.data[0];
    console.log(`Testing with checkup ID: ${testCheckup.id}, Patient: ${testCheckup.patientName}`);
    console.log(`Vital signs collected: ${testCheckup.vitalSignsCollected}`);
    console.log(`Doctor notified: ${testCheckup.doctorNotified}`);
    
    // Now try to notify doctor
    console.log('\n2. Attempting to notify doctor...');
    
    try {
      const notifyResponse = await axios.post(`${BASE_URL}/checkups/${testCheckup.id}/notify-doctor`, {}, {
        headers: {
          'Authorization': 'Bearer temp-admin-token',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Success!');
      console.log('Response:', notifyResponse.data);
      
    } catch (notifyError) {
      console.log('❌ Failed to notify doctor');
      console.log('Status:', notifyError.response?.status);
      console.log('Error:', notifyError.response?.data || notifyError.message);
      
      // Try to get more details about the checkup
      console.log('\nCheckup details:');
      console.log(JSON.stringify(testCheckup, null, 2));
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
};

testNotifyDoctor();
