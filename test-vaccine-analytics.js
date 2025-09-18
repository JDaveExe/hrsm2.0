// Test script to verify vaccine analytics endpoints are working
const http = require('http');

console.log('🔬 Testing Vaccine Analytics Endpoints...\n');

// Test vaccine usage distribution endpoint
const testVaccineUsage = () => {
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
          console.log('✅ Vaccine Usage Distribution Endpoint:');
          console.log(`   Status: ${res.statusCode}`);
          console.log('   Raw response:', JSON.stringify(result).substring(0, 200) + '...');
          console.log(`   Total Usage: ${result.total_usage || 'N/A'}`);
          console.log(`   Number of Vaccines: ${result.usage ? result.usage.length : 'N/A'}`);
          if (result.usage && result.usage.length > 0) {
            console.log(`   Top 3 Vaccines:`);
            result.usage.slice(0, 3).forEach((vaccine, index) => {
              console.log(`     ${index + 1}. ${vaccine.vaccine_name}: ${vaccine.usage_count} doses`);
            });
          } else if (Array.isArray(result) && result.length > 0) {
            console.log(`   Raw array length: ${result.length}`);
            console.log(`   Top 3 Vaccines (array format):`);
            result.slice(0, 3).forEach((vaccine, index) => {
              console.log(`     ${index + 1}. ${vaccine.vaccine_name}: ${vaccine.usage_count} doses`);
            });
          }
          console.log('');
          resolve(result);
        } catch (error) {
          console.log('❌ Failed to parse vaccine usage response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Vaccine usage request failed:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Test vaccine category distribution endpoint
const testVaccineCategory = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inventory/vaccine-category-distribution',
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
          console.log('✅ Vaccine Category Distribution Endpoint:');
          console.log(`   Status: ${res.statusCode}`);
          console.log('   Raw response:', JSON.stringify(result).substring(0, 200) + '...');
          console.log(`   Total Categories: ${result.categories ? result.categories.length : 'N/A'}`);
          if (result.categories && result.categories.length > 0) {
            console.log(`   Categories:`);
            result.categories.forEach((category, index) => {
              console.log(`     ${index + 1}. ${category.category}: ${category.count} vaccines (${category.percentage.toFixed(1)}%)`);
            });
          } else if (Array.isArray(result) && result.length > 0) {
            console.log(`   Raw array length: ${result.length}`);
            console.log(`   Categories (array format):`);
            result.slice(0, 5).forEach((category, index) => {
              console.log(`     ${index + 1}. ${category.category}: ${category.vaccine_count} vaccines (${category.percentage}%)`);
            });
          }
          console.log('');
          resolve(result);
        } catch (error) {
          console.log('❌ Failed to parse vaccine category response:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Vaccine category request failed:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Run the tests
const runTests = async () => {
  try {
    await testVaccineUsage();
    await testVaccineCategory();
    console.log('🎉 All vaccine analytics endpoints are working correctly!');
  } catch (error) {
    console.log('💥 Test failed:', error.message);
    console.log('\n🛠️  Make sure the backend server is running on port 5000');
    process.exit(1);
  }
};

runTests();