// Browser Console Test for Doctor Names Fix
// Copy and paste this into your browser's developer console while on the admin dashboard

console.log('🧪 Testing Doctor Names Fix in Browser');
console.log('=====================================');

async function testDoctorNamesFix() {
  try {
    // Get the auth token from the current session
    const authToken = window.__authToken || localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!authToken) {
      console.log('❌ No auth token found. Make sure you are logged in.');
      return;
    }

    console.log('✅ Found auth token, testing APIs...');

    // Test 1: Check doctors endpoint
    console.log('\n1. Testing doctors endpoint...');
    const doctorsResponse = await fetch('/api/users/doctors', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (doctorsResponse.ok) {
      const doctors = await doctorsResponse.json();
      console.log(`✅ Found ${doctors.users?.length || 0} doctors`);
      if (doctors.users && doctors.users.length > 0) {
        console.log('Sample doctors:');
        doctors.users.slice(0, 3).forEach(doctor => {
          console.log(`  - ${doctor.firstName} ${doctor.lastName} (ID: ${doctor.id})`);
        });
      }
    } else {
      console.log(`❌ Doctors endpoint failed: ${doctorsResponse.status}`);
    }

    // Test 2: Check checkup history for first patient
    console.log('\n2. Testing checkup history endpoint...');
    
    // Try a few patient IDs to find one with history
    for (let patientId of [1, 2, 3, 4, 5]) {
      try {
        const historyResponse = await fetch(`/api/checkups/history/${patientId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (historyResponse.ok) {
          const history = await historyResponse.json();
          console.log(`✅ Patient ${patientId}: Found ${history.length} checkup records`);
          
          if (history.length > 0) {
            const sample = history[0];
            console.log(`Sample record for Patient ${patientId}:`);
            console.log(`  - Date: ${new Date(sample.completedAt || sample.checkInTime).toLocaleDateString()}`);
            console.log(`  - Service: ${sample.serviceType}`);
            console.log(`  - Doctor: "${sample.assignedDoctor}"`);
            
            // Check if it's a name or just an ID
            const isNumericId = /^\d+$/.test(sample.assignedDoctor.toString().trim());
            const isName = /^[A-Za-z]+\s+[A-Za-z]+/.test(sample.assignedDoctor);
            
            console.log(`  - Is Numeric ID: ${isNumericId ? '❌ YES (bug not fixed)' : '✅ NO'}`);
            console.log(`  - Is Name Format: ${isName ? '✅ YES (fix working!)' : '❌ NO'}`);
            
            if (isNumericId) {
              console.log('🚨 BUG STILL EXISTS: Doctor field shows ID instead of name');
            } else if (isName) {
              console.log('🎉 FIX CONFIRMED: Doctor field shows proper name!');
            } else {
              console.log('⚠️  Doctor field format unclear:', sample.assignedDoctor);
            }
            break;
          }
        } else if (historyResponse.status !== 404) {
          console.log(`❌ Patient ${patientId} history failed: ${historyResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ Error testing patient ${patientId}:`, error.message);
      }
    }

    console.log('\n✅ Test completed! Check the results above.');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testDoctorNamesFix();

// Instructions
console.log('\n📋 To manually verify:');
console.log('1. Go to Patient Database in the sidebar');
console.log('2. Click "View Info" on any patient');
console.log('3. Click "Check Up History" in Patient Actions');
console.log('4. Look at the "Doctor Assisted" column');
console.log('5. It should show names like "Johnny Davis" not IDs like "10017"');
