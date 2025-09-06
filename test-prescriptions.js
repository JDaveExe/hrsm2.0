// Test script for prescription recording functionality
const fetch = require('node-fetch');

async function testPrescriptionFlow() {
  console.log('🧪 Testing Prescription Recording Flow...\n');
  
  try {
    // 1. Login as doctor
    console.log('🔐 Logging in as doctor...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: 'doctor.smith', password: 'password123'})
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('✅ Login successful\n');
    
    // 2. Check current doctor checkups
    console.log('🩺 Checking current doctor checkups...');
    const checkupsRes = await fetch('http://localhost:5000/api/doctor/checkups', {
      headers: {'Authorization': `Bearer ${token}`}
    });
    const checkupsData = await checkupsRes.json();
    
    console.log(`📊 Found ${checkupsData.length} checkups:`);
    checkupsData.forEach((checkup, index) => {
      console.log(`   ${index + 1}. ${checkup.patientName} (ID: ${checkup.id})`);
      console.log(`      Status: ${checkup.status}`);
      console.log(`      Current prescriptions: ${checkup.prescriptions ? checkup.prescriptions.length : 0}`);
      console.log(`      ---`);
    });
    
    if (checkupsData.length === 0) {
      console.log('❌ No checkups found. Please start a checkup first.');
      return;
    }
    
    const testCheckup = checkupsData[0];
    console.log(`\n🎯 Testing with: ${testCheckup.patientName} (ID: ${testCheckup.id})\n`);
    
    // 3. Add prescription to the checkup
    console.log('💊 Adding prescription...');
    const prescription = {
      medication: 'Paracetamol',
      dosage: '500mg',
      frequency: 'Every 6 hours',
      duration: '3 days',
      quantity: 12,
      instructions: 'Take with food'
    };
    
    const notesRes = await fetch(`http://localhost:5000/api/checkups/${testCheckup.id}/notes`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notes: 'Test prescription added',
        prescriptions: [prescription]
      })
    });
    
    if (notesRes.ok) {
      const notesData = await notesRes.json();
      console.log('✅ Prescription added successfully');
      console.log(`   Prescriptions count: ${notesData.prescriptions ? notesData.prescriptions.length : 0}`);
      console.log(`   Prescription details:`, notesData.prescriptions);
    } else {
      console.log('❌ Failed to add prescription:', notesRes.status);
      const error = await notesRes.text();
      console.log('   Error:', error);
      return;
    }
    
    // 4. Complete the checkup
    console.log('\n🏁 Completing checkup...');
    const completeRes = await fetch(`http://localhost:5000/api/checkups/${testCheckup.id}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 'completed',
        notes: 'Checkup completed with prescription',
        prescriptions: [prescription]
      })
    });
    
    if (completeRes.ok) {
      const completeData = await completeRes.json();
      console.log('✅ Checkup completed successfully');
    } else {
      console.log('❌ Failed to complete checkup:', completeRes.status);
    }
    
    // 5. Check finished checkups to see if prescription persists
    console.log('\n📋 Checking finished checkups...');
    const finishedRes = await fetch('http://localhost:5000/api/doctor/checkups', {
      headers: {'Authorization': `Bearer ${token}`}
    });
    const finishedData = await finishedRes.json();
    
    const completedCheckups = finishedData.filter(c => c.status === 'completed');
    console.log(`📊 Found ${completedCheckups.length} completed checkups:`);
    
    completedCheckups.forEach((checkup, index) => {
      console.log(`   ${index + 1}. ${checkup.patientName} (ID: ${checkup.id})`);
      console.log(`      Status: ${checkup.status}`);
      console.log(`      Prescriptions: ${checkup.prescriptions ? checkup.prescriptions.length : 0}`);
      if (checkup.prescriptions && checkup.prescriptions.length > 0) {
        checkup.prescriptions.forEach((presc, i) => {
          console.log(`         ${i + 1}. ${presc.medication} - ${presc.dosage} (${presc.quantity} units)`);
        });
      }
      console.log(`      ---`);
    });
    
    console.log('\n🎉 Prescription test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPrescriptionFlow();
