const axios = require('axios');

async function testMainDashboardStats() {
  try {
    console.log('🧪 Testing main dashboard stats endpoint...\n');

    // Login first
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    const token = authResponse.data.token;
    
    // Get main dashboard stats (includes checkup trends)
    const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Main dashboard stats response:');
    console.log('- Checkup trends data:', response.data.checkupTrends);
    
    // Check specific API endpoint
    const trendsResponse = await axios.get('http://localhost:5000/api/dashboard/checkup-trends/days', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\nDedicated trends endpoint response:');
    console.log('- Trends data:', trendsResponse.data.data);
    
    console.log('\n🔍 Comparison:');
    console.log('Main dashboard checkup trends should match dedicated endpoint');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testMainDashboardStats();