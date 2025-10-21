const axios = require('axios');

async function debugWeeksSpecifically() {
  try {
    console.log('🐛 Debugging Weeks tab specifically...\n');

    // Login first
    const authResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    const token = authResponse.data.token;
    
    // Test weeks endpoint
    console.log('📊 Testing weeks endpoint:');
    const response = await axios.get('http://localhost:5000/api/dashboard/checkup-trends/weeks', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('API Response:', JSON.stringify(response.data, null, 2));
    
    // Simulate frontend processing
    console.log('\n🔄 Simulating frontend processing:');
    
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    let weeksData = [0, 0, 0, 0];
    
    const weeklyTrendsData = response.data?.data;
    
    if (weeklyTrendsData) {
      console.log('✅ API data found, processing...');
      
      // Skip first week (oldest), take last 4 weeks
      const last4Weeks = weeklyTrendsData.slice(-4);
      console.log('Last 4 weeks data:', last4Weeks);
      
      last4Weeks.forEach((trend, index) => {
        if (index < 4) {
          weeksData[index] = trend.completedCheckups || 0;
          console.log(`  Week ${index + 1}: ${trend.completedCheckups} checkups`);
        }
      });
    } else {
      console.log('❌ No API data found');
    }
    
    const finalResult = {
      labels: weeks,
      data: weeksData,
      title: 'Last 4 Weeks'
    };
    
    console.log('\n📈 Final chart data that should be displayed:');
    console.log(JSON.stringify(finalResult, null, 2));
    
    // Test what Chart.js would receive
    const chartJsData = {
      labels: finalResult.labels,
      datasets: [{
        label: 'Checkups Completed',
        data: finalResult.data,
        backgroundColor: '#9BC4E2',
        borderColor: '#7FB5DC',
        borderWidth: 2,
        fill: false
      }]
    };
    
    console.log('\n📊 Chart.js structure:');
    console.log(JSON.stringify(chartJsData, null, 2));
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  }
}

debugWeeksSpecifically();