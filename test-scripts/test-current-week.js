const axios = require('axios');

async function testCurrentWeekData() {
  try {
    // Login first
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    const token = authResponse.data.token;
    
    // Get current week data
    const response = await axios.get('http://localhost:5000/api/dashboard/checkup-trends/days', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Current week API response:', JSON.stringify(response.data, null, 2));
    
    // Check what day it thinks today is
    const today = new Date();
    console.log('Today is:', today.toLocaleDateString('en-US', { weekday: 'long' }));
    console.log('Today date:', today.toISOString().split('T')[0]);
    
    // Create the expected frontend format
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let checkupTrendsData = [0, 0, 0, 0, 0, 0, 0];
    
    if (response.data.data) {
      response.data.data.forEach(trend => {
        const dayIndex = weekDays.indexOf(trend.dayName);
        if (dayIndex !== -1) {
          checkupTrendsData[dayIndex] = trend.completedCheckups;
        }
      });
    }
    
    console.log('Frontend should show:', {
      labels: weekDays,
      data: checkupTrendsData
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCurrentWeekData();