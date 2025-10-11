/**
 * Test script to verify dashboard vaccine analytics are now using real data
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testDashboardVaccineAnalytics() {
  try {
    console.log('🧪 Testing dashboard vaccine analytics with real data...');

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
    console.log('✅ Authentication successful');

    // Step 2: Fetch dashboard stats
    console.log('2. Fetching dashboard statistics...');
    
    const response = await axios.get(`${BASE_URL}/api/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 200) {
      console.log('✅ Successfully fetched dashboard stats!');
      
      const data = response.data;
      
      // Check vaccination statistics
      console.log('\n📊 Vaccination Statistics:');
      console.log(`  Total Vaccinations: ${data.vaccinations?.total || 0}`);
      console.log(`  Today: ${data.vaccinations?.today || 0}`);
      console.log(`  This Week: ${data.vaccinations?.thisWeek || 0}`);
      console.log(`  This Month: ${data.vaccinations?.thisMonth || 0}`);
      
      // Check vaccine usage data
      console.log('\n💉 Vaccine Usage Data:');
      if (data.vaccinations?.vaccineUsage && data.vaccinations.vaccineUsage.length > 0) {
        data.vaccinations.vaccineUsage.forEach((vaccine, index) => {
          console.log(`  ${index + 1}. ${vaccine.vaccine_name}: ${vaccine.usage_count} doses`);
        });
      } else {
        console.log('  No vaccine usage data found');
      }

      // Expected results based on our test data
      console.log('\n🎯 Expected Results:');
      console.log('  - Should show BCG (Bacillus Calmette-Guérin)');
      console.log('  - Should show Pentavalent Vaccine (DTP-HepB-Hib)');
      console.log('  - Should NOT show hardcoded COVID-19, Hepatitis B, Influenza');
      
    } else {
      console.log('❌ Unexpected status code:', response.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testDashboardVaccineAnalytics();
