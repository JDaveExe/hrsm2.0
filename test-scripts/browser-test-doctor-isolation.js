/**
 * Browser Test for Doctor Checkup Isolation
 * 
 * Run this in the browser console while logged in as a doctor
 * to test the checkup isolation validation.
 */

console.log('🔬 Testing Doctor Checkup Isolation in Browser');
console.log('=' .repeat(50));

const testDoctorIsolation = async () => {
  try {
    // Step 1: Check current doctor checkups
    console.log('\n1️⃣ Checking current doctor checkups...');
    
    const checkupsResponse = await fetch('/api/checkups/doctor', {
      headers: {
        'Authorization': `Bearer ${window.__authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (checkupsResponse.ok) {
      const checkups = await checkupsResponse.json();
      const inProgressCheckups = checkups.filter(c => 
        c.status === 'in-progress' || c.status === 'started'
      );
      
      console.log(`✅ Found ${checkups.length} total checkups`);
      console.log(`   ${inProgressCheckups.length} in-progress checkups`);
      
      if (inProgressCheckups.length > 0) {
        console.log('⚠️  Doctor already has in-progress checkups:');
        inProgressCheckups.forEach(checkup => {
          console.log(`   - ${checkup.patientName} (Status: ${checkup.status})`);
        });
      }
      
      // Step 2: Try to create a new checkup
      console.log('\n2️⃣ Attempting to create a new checkup...');
      
      const newCheckupData = {
        patientId: 999,
        patientName: 'Test Patient for Isolation',
        age: 25,
        gender: 'Female',
        contactNumber: '09123456789',
        serviceType: 'General Checkup',
        priority: 'Normal',
        notes: 'Test checkup for isolation validation'
      };

      const createResponse = await fetch('/api/checkups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCheckupData)
      });

      if (createResponse.ok) {
        const result = await createResponse.json();
        console.log('✅ Checkup created successfully');
        console.log(`   Checkup ID: ${result.id}`);
        
        if (inProgressCheckups.length > 0) {
          console.log('⚠️  WARNING: Validation may not be working!');
          console.log('   Doctor had in-progress checkups but new checkup was still created');
        } else {
          console.log('✅ This is expected - doctor had no in-progress checkups');
        }
      } else {
        const error = await createResponse.json();
        if (createResponse.status === 400 && error.error.includes('already have a checkup in progress')) {
          console.log('✅ Validation working correctly!');
          console.log(`   Error: ${error.error}`);
          console.log('   Doctor isolation is preventing multiple concurrent checkups');
        } else {
          console.log('❌ Unexpected error');
          console.log(`   Status: ${createResponse.status}`);
          console.log(`   Error: ${error.error || 'Unknown error'}`);
        }
      }
      
    } else {
      console.log('❌ Failed to fetch current checkups');
      console.log(`   Status: ${checkupsResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🏁 Doctor isolation test completed');
  console.log('\nTo test further:');
  console.log('1. If you have an in-progress checkup, try starting another one');
  console.log('2. Complete your current checkup, then try starting two checkups quickly');
  console.log('3. Check the Network tab for API responses');
};

// Run the test
testDoctorIsolation();