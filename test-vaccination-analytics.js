/**
 * Test script to verify Patient Checkup Trends now includes completed vaccinations
 */
const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:5000';

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

async function makeAuthenticatedRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}/api${endpoint}`,
      headers: {
        'Authorization': 'Bearer dummy-token-for-testing',
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error with ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

async function testVaccinationAnalytics() {
  console.log('🧪 Testing Patient Checkup Trends with Vaccination Analytics Fix\n');
  
  try {
    // Step 1: Get current checkup trends
    console.log('📊 Step 1: Getting current checkup trends...');
    const currentTrends = await makeAuthenticatedRequest('GET', '/dashboard/checkup-trends/days');
    console.log('Current trends data:', JSON.stringify(currentTrends.data, null, 2));
    
    const currentTotal = currentTrends.data.reduce((sum, day) => sum + day.completedCheckups, 0);
    console.log(`📈 Current total completed items this week: ${currentTotal}`);
    
    // Step 2: Check what's in the database
    console.log('\n🔍 Step 2: Checking database tables...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Check completed checkups
    const [checkupRows] = await connection.execute(`
      SELECT DATE(updatedAt) as date, COUNT(*) as count 
      FROM check_in_sessions 
      WHERE updatedAt >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        AND updatedAt < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
        AND status = 'completed'
      GROUP BY DATE(updatedAt)
      ORDER BY date
    `);
    console.log('✅ Completed checkups this week:', checkupRows);
    
    // Check completed vaccinations
    const [vaccinationRows] = await connection.execute(`
      SELECT DATE(administeredAt) as date, COUNT(*) as count 
      FROM vaccinations 
      WHERE administeredAt >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
        AND administeredAt < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
      GROUP BY DATE(administeredAt)
      ORDER BY date
    `);
    console.log('💉 Completed vaccinations this week:', vaccinationRows);
    
    // Step 3: Add test vaccination data
    console.log('\n💉 Step 3: Adding test vaccination for today...');
    const today = new Date().toISOString().split('T')[0];
    
    await connection.execute(`
      INSERT INTO vaccinations (
        patientId, vaccineId, administeredAt, administeredBy, 
        lotNumber, expiryDate, notes, createdAt, updatedAt
      ) VALUES (
        1, 1, ?, 'Dr. Test', 'TEST-LOT-001', '2026-01-01', 
        'Test vaccination for analytics verification', NOW(), NOW()
      )
    `, [today]);
    
    console.log('✅ Added test vaccination for today');
    
    // Step 4: Get updated checkup trends
    console.log('\n📊 Step 4: Getting updated checkup trends...');
    const updatedTrends = await makeAuthenticatedRequest('GET', '/dashboard/checkup-trends/days');
    console.log('Updated trends data:', JSON.stringify(updatedTrends.data, null, 2));
    
    const updatedTotal = updatedTrends.data.reduce((sum, day) => sum + day.completedCheckups, 0);
    console.log(`📈 Updated total completed items this week: ${updatedTotal}`);
    
    // Step 5: Verify the fix
    console.log('\n🧮 Step 5: Verification...');
    const difference = updatedTotal - currentTotal;
    console.log(`📊 Difference: ${difference} (should be +1 if fix is working)`);
    
    if (difference === 1) {
      console.log('✅ SUCCESS: Vaccination analytics fix is working!');
      console.log('   - Patient Checkup Trends now includes completed vaccinations');
      console.log('   - The count increased by 1 after adding a vaccination');
    } else {
      console.log('❌ ISSUE: Expected increase of 1, but got:', difference);
      console.log('   - The vaccination may not be counted in analytics');
    }
    
    // Step 6: Test all time periods
    console.log('\n🕐 Step 6: Testing all time periods...');
    const periods = ['days', 'weeks', 'months', 'years'];
    
    for (const period of periods) {
      try {
        const periodTrends = await makeAuthenticatedRequest('GET', `/dashboard/checkup-trends/${period}`);
        const periodTotal = periodTrends.data.reduce((sum, item) => sum + item.completedCheckups, 0);
        console.log(`📊 ${period.toUpperCase()}: ${periodTotal} total completed items`);
      } catch (error) {
        console.log(`❌ Error testing ${period}:`, error.message);
      }
    }
    
    // Step 7: Cleanup
    console.log('\n🧹 Step 7: Cleaning up test data...');
    await connection.execute(`
      DELETE FROM vaccinations 
      WHERE lotNumber = 'TEST-LOT-001' AND notes = 'Test vaccination for analytics verification'
    `);
    console.log('✅ Cleaned up test vaccination data');
    
    await connection.end();
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testVaccinationAnalytics();