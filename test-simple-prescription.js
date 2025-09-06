// Simple prescription test after backend restart
const fetch = require('node-fetch');

async function simpleTest() {
  console.log('🔍 Simple Prescription Test\n');
  
  try {
    // Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: 'doctor.smith', password: 'password123'})
    });
    const loginData = await loginRes.json();
    
    // Get checkups
    const checkupsRes = await fetch('http://localhost:5000/api/doctor/checkups', {
      headers: {'Authorization': `Bearer ${loginData.token}`}
    });
    const checkupsData = await checkupsRes.json();
    
    if (checkupsData.length > 0) {
      const checkup = checkupsData[0];
      console.log(`🎯 Testing with: ${checkup.patientName} (ID: ${checkup.id})`);
      console.log(`   Current prescriptions: ${checkup.prescriptions?.length || 0}`);
      
      // Test adding a simple prescription
      console.log('\n💊 Adding simple prescription...');
      const testPrescription = {
        medication: 'Aspirin',
        dosage: '100mg',
        quantity: 10
      };
      
      const addRes = await fetch(`http://localhost:5000/api/checkups/${checkup.id}/notes`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: 'Added simple prescription test',
          prescriptions: [testPrescription]
        })
      });
      
      if (addRes.ok) {
        const result = await addRes.json();
        console.log('✅ Prescription add response:');
        console.log(`   Prescriptions count: ${result.prescriptions?.length || 0}`);
        console.log(`   Prescriptions data:`, result.prescriptions);
      } else {
        console.log('❌ Failed to add prescription:', addRes.status);
      }
      
    } else {
      console.log('❌ No checkups found for testing');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

simpleTest();
