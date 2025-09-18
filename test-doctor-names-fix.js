// Test script to verify the doctor name fix
const http = require('http');

// Function to make HTTP request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testDoctorNamesFix() {
  console.log('🧪 Testing Doctor Names Fix');
  console.log('==============================');

  try {
    // First, let's test if the backend is running
    const healthCheck = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/users/doctors',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (healthCheck.statusCode === 401) {
      console.log('✅ Backend is running (authentication required)');
    } else if (healthCheck.statusCode === 200) {
      console.log('✅ Backend is running and accessible');
      const doctors = JSON.parse(healthCheck.data);
      console.log('📋 Available doctors:', doctors.users?.length || 0);
      if (doctors.users && doctors.users.length > 0) {
        console.log('First doctor example:', {
          id: doctors.users[0].id,
          name: `${doctors.users[0].firstName} ${doctors.users[0].lastName}`
        });
      }
    } else {
      console.log('⚠️  Backend response:', healthCheck.statusCode, healthCheck.data);
    }

    // Test the checkup history endpoint (this will likely require auth, but we can see the structure)
    console.log('\n🔍 Testing checkup history endpoint structure...');
    const historyTest = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/checkups/history/1',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${historyTest.statusCode}`);
    if (historyTest.statusCode === 401) {
      console.log('✅ Endpoint exists (requires authentication)');
    } else {
      console.log('Response preview:', historyTest.data.substring(0, 200) + '...');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend is not running on port 3001');
      console.log('💡 Please start the backend server first with: npm start (in backend directory)');
    } else {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n📝 What this test checked:');
  console.log('- Backend server accessibility');
  console.log('- Doctors endpoint structure');
  console.log('- Checkup history endpoint availability');
  console.log('\nTo fully test the fix:');
  console.log('1. Start the backend server');
  console.log('2. Create some test checkup records with assigned doctors');
  console.log('3. Check the checkup history in the admin panel');
}

testDoctorNamesFix();
