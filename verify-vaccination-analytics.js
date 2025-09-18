/**
 * Simple verification script for vaccination analytics fix
 */
const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:5000';

async function verifyAnalyticsFix() {
  console.log('🔍 Verifying Patient Checkup Trends includes vaccinations\n');
  
  try {
    // Step 1: Check database tables directly
    console.log('📊 Step 1: Checking database data...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'hrsm2'
    });
    
    // Count completed checkups this week
    const [checkups] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM check_in_sessions 
      WHERE updatedAt >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        AND updatedAt < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
        AND status = 'completed'
    `);
    console.log('✅ Completed checkups this week:', checkups[0].count);
    
    // Count completed vaccinations this week  
    const [vaccinations] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM vaccinations 
      WHERE administeredAt >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        AND administeredAt < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
    `);
    console.log('💉 Completed vaccinations this week:', vaccinations[0].count);
    
    const expectedTotal = checkups[0].count + vaccinations[0].count;
    console.log(`🧮 Expected total in analytics: ${expectedTotal}`);
    
    await connection.end();
    
    // Step 2: Check API response
    console.log('\n📡 Step 2: Testing API endpoint...');
    
    try {
      const response = await axios.get(`${BASE_URL}/api/dashboard/checkup-trends/days`, {
        headers: {
          'Authorization': 'Bearer dummy-token-for-testing'
        }
      });
      
      console.log('✅ API Response received');
      console.log('📊 Trends data:', JSON.stringify(response.data.data, null, 2));
      
      const apiTotal = response.data.data.reduce((sum, day) => sum + day.completedCheckups, 0);
      console.log(`📈 API total: ${apiTotal}`);
      
      // Step 3: Compare results
      console.log('\n🔍 Step 3: Verification...');
      if (apiTotal === expectedTotal) {
        console.log('✅ SUCCESS: API matches database totals!');
        console.log('   - Vaccination analytics fix is working correctly');
        console.log('   - Patient Checkup Trends now includes both checkups and vaccinations');
      } else {
        console.log('❌ MISMATCH:');
        console.log(`   - Database total: ${expectedTotal}`);
        console.log(`   - API total: ${apiTotal}`);
        console.log('   - The fix may not be working properly');
      }
      
    } catch (apiError) {
      console.error('❌ API Error:', apiError.response?.data || apiError.message);
      console.log('💡 Make sure the backend server is running on port 5000');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyAnalyticsFix();