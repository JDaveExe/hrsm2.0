const axios = require('axios');

async function testAllPeriods() {
  try {
    console.log('🧪 Testing all checkup trends periods...\n');

    // Login first
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    const token = authResponse.data.token;
    
    const periods = ['days', 'weeks', 'months', 'years'];
    
    for (const period of periods) {
      console.log(`📊 Testing ${period}...`);
      
      try {
        const response = await axios.get(`http://localhost:5000/api/dashboard/checkup-trends/${period}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ ${period} - Status: ${response.status}`);
        console.log(`   - Records: ${response.data.totalRecords}`);
        if (response.data.data && response.data.data.length > 0) {
          console.log(`   - Sample:`, response.data.data.slice(0, 3));
        } else {
          console.log(`   - No data found`);
        }
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${period} - Error: ${error.message}`);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAllPeriods();
