const axios = require('axios');

async function testWeekdayQueries() {
  try {
    console.log('🧪 Testing MySQL WEEKDAY calculations...\n');

    // Login first
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    const token = authResponse.data.token;
    
    // Test manual query to understand MySQL behavior
    console.log('Current date and weekday info:');
    const dateResponse = await axios.get('http://localhost:5000/api/dashboard/debug-date-info', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {
      console.log('Debug endpoint not available, that\'s ok');
      return null;
    });
    
    // Check what dates should be in current week
    const today = new Date();
    const currentWeekday = today.getDay(); // 0=Sunday, 1=Monday, etc.
    
    console.log('JavaScript calculations:');
    console.log('- Today:', today.toLocaleDateString('en-US', { weekday: 'long' }), today.toISOString().split('T')[0]);
    console.log('- Weekday index:', currentWeekday);
    
    // Calculate Monday of current week
    const mondayOffset = currentWeekday === 0 ? 6 : currentWeekday - 1; // Convert to Monday=0 system
    const mondayDate = new Date(today);
    mondayDate.setDate(today.getDate() - mondayOffset);
    
    const sundayDate = new Date(mondayDate);
    sundayDate.setDate(mondayDate.getDate() + 6);
    
    console.log('Expected current week:');
    console.log('- Monday:', mondayDate.toISOString().split('T')[0]);
    console.log('- Sunday:', sundayDate.toISOString().split('T')[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWeekdayQueries();