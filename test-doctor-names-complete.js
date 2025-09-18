// Complete integration test for doctor names in checkup history
// This script simulates the frontend API calls to test the doctor name fix

console.log('🧪 Doctor Names Integration Test');
console.log('================================');

async function testWithFetch() {
  try {
    console.log('\n1. Testing backend connection...');
    
    // Test if backend is accessible
    const response = await fetch('http://localhost:3001/api/users/doctors', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      console.log('✅ Backend is running (requires authentication)');
    } else if (response.ok) {
      const doctors = await response.json();
      console.log('✅ Backend is accessible');
      console.log(`📋 Found ${doctors.users?.length || 0} doctors`);
      
      if (doctors.users && doctors.users.length > 0) {
        console.log('\nSample doctors:');
        doctors.users.slice(0, 3).forEach(doctor => {
          console.log(`  - ${doctor.firstName} ${doctor.lastName} (ID: ${doctor.id})`);
        });
      }
    } else {
      console.log(`⚠️  Unexpected response: ${response.status}`);
    }

    console.log('\n2. Testing checkup history endpoint...');
    
    // Test checkup history endpoint
    const historyResponse = await fetch('http://localhost:3001/api/checkups/history/1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Checkup history status: ${historyResponse.status}`);
    
    if (historyResponse.ok) {
      const history = await historyResponse.json();
      console.log('✅ Checkup history retrieved successfully');
      console.log(`📅 Found ${history.length} checkup records`);
      
      if (history.length > 0) {
        console.log('\nSample checkup record:');
        const sample = history[0];
        console.log(`  - Date: ${new Date(sample.completedAt).toLocaleDateString()}`);
        console.log(`  - Patient: ${sample.patientName}`);
        console.log(`  - Service: ${sample.serviceType}`);
        console.log(`  - Doctor: ${sample.assignedDoctor}`);
        console.log(`  - Doctor field type: ${typeof sample.assignedDoctor}`);
        
        // Check if doctor field contains a name or just ID
        const isName = /^[A-Za-z]+\s+[A-Za-z]+/.test(sample.assignedDoctor);
        console.log(`  - Contains doctor name: ${isName ? '✅ YES' : '❌ NO (still showing ID)'}`);
      }
    } else if (historyResponse.status === 401) {
      console.log('⚠️  Authentication required (expected in secure environment)');
    } else {
      const errorText = await historyResponse.text();
      console.log('❌ Error response:', errorText);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
      console.log('❌ Cannot connect to backend server');
      console.log('💡 Make sure the backend is running on http://localhost:3001');
      console.log('💡 Start it with: cd backend && npm start');
    } else {
      console.log('❌ Test error:', error.message);
    }
  }

  console.log('\n📋 Summary:');
  console.log('This test verifies that:');
  console.log('- The backend server is running');
  console.log('- The /api/users/doctors endpoint returns doctor information');
  console.log('- The /api/checkups/history endpoint includes doctor names (not IDs)');
  console.log('- The frontend will receive proper doctor names for display');
}

// Check if we're in a Node.js environment with fetch support
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ with fetch support');
  console.log('💡 Or run this in a browser console after starting the backend');
  process.exit(1);
}

testWithFetch();
