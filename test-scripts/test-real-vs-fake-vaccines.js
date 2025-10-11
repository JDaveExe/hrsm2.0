// Test script to compare fake vs real vaccine data
const http = require('http');

console.log('🔬 Comparing Fake vs Real Vaccine Data...\n');

// Test REAL vaccine usage (what Admin uses)
const testRealVaccineUsage = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/dashboard/vaccine-usage',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ REAL Vaccine Usage (Admin Dashboard):');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Total Vaccines: ${result.length}`);
          console.log(`   Data Source: Patient vaccination records`);
          if (result.length > 0) {
            console.log(`   Top Vaccines:`);
            result.slice(0, 5).forEach((vaccine, index) => {
              console.log(`     ${index + 1}. ${vaccine.vaccine_name}: ${vaccine.usage_count} doses`);
            });
          }
          console.log('');
          resolve(result);
        } catch (error) {
          console.log('❌ Failed to parse real vaccine usage response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Real vaccine usage request failed:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Test FAKE vaccine usage (old Management endpoint)
const testFakeVaccineUsage = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inventory/vaccine-usage-distribution',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('⚠️  FAKE Vaccine Usage (Old Management):');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Total Usage: ${result.total_usage}`);
          console.log(`   Number of Vaccines: ${result.vaccines_count}`);
          console.log(`   Data Source: Random generated from vaccines.json`);
          if (result.usage && result.usage.length > 0) {
            console.log(`   Top Vaccines:`);
            result.usage.slice(0, 5).forEach((vaccine, index) => {
              console.log(`     ${index + 1}. ${vaccine.vaccine_name}: ${vaccine.usage_count} doses (FAKE)`);
            });
          }
          console.log('');
          resolve(result);
        } catch (error) {
          console.log('❌ Failed to parse fake vaccine usage response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Fake vaccine usage request failed:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Run the comparison
const runComparison = async () => {
  try {
    console.log('🎯 Testing REAL vs FAKE vaccine data sources:\n');
    
    const realData = await testRealVaccineUsage();
    const fakeData = await testFakeVaccineUsage();
    
    console.log('📊 COMPARISON RESULTS:');
    console.log(`   Real data shows: ${realData.length} vaccines from patient records`);
    console.log(`   Fake data shows: ${fakeData.vaccines_count} vaccines from inventory simulation`);
    console.log('');
    
    if (realData.length > 0 && fakeData.usage && fakeData.usage.length > 0) {
      console.log('📈 USAGE COMPARISON:');
      console.log(`   Real total usage: ${realData.reduce((sum, v) => sum + v.usage_count, 0)} doses (from actual patients)`);
      console.log(`   Fake total usage: ${fakeData.total_usage} doses (random generated)`);
      console.log('');
      console.log('🎯 CONCLUSION: Management Dashboard should use REAL data like Admin Dashboard!');
    }
    
  } catch (error) {
    console.log('💥 Test failed:', error.message);
    process.exit(1);
  }
};

runComparison();