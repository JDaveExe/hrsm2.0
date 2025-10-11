/**
 * Test script to verify Patient Checkup Trends now work correctly
 * Tests: Days (current week), Weeks, Months, Years periods
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testCheckupTrends() {
  try {
    console.log('🧪 Testing Patient Checkup Trends with corrected logic...\n');

    // Step 1: Login to get token
    console.log('1. Authenticating...');
    const authResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });

    if (!authResponse.data.token) {
      throw new Error('Authentication failed');
    }

    const token = authResponse.data.token;
    console.log('✅ Authentication successful\n');

    // Step 2: Test all checkup trends periods
    const periods = ['days', 'weeks', 'months', 'years'];
    
    for (const period of periods) {
      console.log(`📊 Testing ${period} trends...`);
      
      try {
        const response = await axios.get(`${BASE_URL}/api/dashboard/checkup-trends/${period}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 200) {
          const data = response.data;
          console.log(`✅ ${period} trends fetched successfully:`);
          console.log(`   - Success: ${data.success}`);
          console.log(`   - Period: ${data.period}`);
          console.log(`   - Records: ${data.totalRecords}`);
          
          if (data.data && data.data.length > 0) {
            console.log(`   - Sample data:`, data.data.slice(0, 3));
          } else {
            console.log(`   - No data found for ${period}`);
          }
          
          // Special check for days (current week)
          if (period === 'days') {
            console.log(`   📅 Current week analysis:`);
            const todayString = new Date().toLocaleDateString('en-US', { weekday: 'long' });
            console.log(`   - Today is: ${todayString}`);
            
            const todayData = data.data.find(d => d.dayName === todayString);
            if (todayData) {
              console.log(`   - Today's checkups: ${todayData.completedCheckups}`);
            } else {
              console.log(`   - No checkups recorded for today yet (expected for new week)`);
            }
          }
          
        } else {
          console.log(`❌ Unexpected status for ${period}:`, response.status);
        }
      } catch (periodError) {
        console.error(`❌ Error fetching ${period} trends:`, periodError.message);
      }
      
      console.log(''); // Empty line for readability
    }

    // Step 3: Check if current week resets properly
    console.log('📅 Week Reset Analysis:');
    console.log('Expected behavior:');
    console.log('- Monday (today): Should start fresh for current week');
    console.log('- Previous week data should be aggregated into weeks view');
    console.log('- Months/Years should show cumulative historical data');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testCheckupTrends();
