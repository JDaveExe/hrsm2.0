const fetch = require('node-fetch');

async function testPatientPrescriptions() {
  console.log('🧪 Testing Patient Prescriptions System...\n');
  
  try {
    // 1. Login as patient (Josuke)
    console.log('🔐 Logging in as patient (Josuke)...');
    let loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({login: 'patient', password: 'patient123'})
    });
    let loginData = await loginRes.json();
    
    console.log('🔍 Josuke Login response debug:', JSON.stringify(loginData, null, 2));
    
    if (!loginData.token) {
      throw new Error('No token received from login');
    }
    
    let token = loginData.token;
    let patientId = loginData.user.patientId;
    console.log(`✅ Josuke login successful (ID: ${patientId})\n`);
    
    // Test Josuke's prescriptions first
    console.log('💊 Fetching Josuke\'s active prescriptions...');
    let activeRes = await fetch(`http://localhost:5000/api/patient/${patientId}/prescriptions/active`, {
      headers: {'Authorization': `Bearer ${token}`}
    });
    
    if (activeRes.ok) {
      let activeData = await activeRes.json();
      console.log(`✅ Josuke's active prescriptions found: ${activeData.activeCount}`);
      
      if (activeData.activePrescriptions.length > 0) {
        activeData.activePrescriptions.forEach((prescription, index) => {
          console.log(`   ${index + 1}. ${prescription.medication} - ${prescription.dosage}`);
          console.log(`      Status: ${prescription.status}`);
        });
      } else {
        console.log('   No active prescriptions found for Josuke');
      }
    }
    
    // Now test with Kaleia's Patient ID (113) using same token but different patient ID
    console.log('\n🔄 Testing Kaleia\'s prescriptions (Patient ID 113)...');
    const kaleiaPatientId = 113;
    
    console.log('💊 Fetching Kaleia\'s active prescriptions...');
    activeRes = await fetch(`http://localhost:5000/api/patient/${kaleiaPatientId}/prescriptions/active`, {
      headers: {'Authorization': `Bearer ${token}`}
    });
    
    if (activeRes.ok) {
      let activeData = await activeRes.json();
      console.log(`✅ Kaleia's active prescriptions found: ${activeData.activeCount}`);
      
      if (activeData.activePrescriptions.length > 0) {
        activeData.activePrescriptions.forEach((prescription, index) => {
          console.log(`   ${index + 1}. ${prescription.medication} - ${prescription.dosage}`);
          console.log(`      Frequency: ${prescription.frequency}`);
          console.log(`      Duration: ${prescription.duration}`);
          console.log(`      Status: ${prescription.status}`);
          console.log(`      Prescribed by: ${prescription.doctorName}`);
          console.log(`      Instructions: ${prescription.instructions}`);
          console.log(`      ---`);
        });
      } else {
        console.log('   No active prescriptions found for Kaleia');
      }
    } else {
      console.log(`❌ Failed to fetch Kaleia's active prescriptions: ${activeRes.status}`);
    }
    
    console.log('\n📋 Fetching Kaleia\'s prescription history...');
    let historyRes = await fetch(`http://localhost:5000/api/patient/${kaleiaPatientId}/prescriptions/history`, {
      headers: {'Authorization': `Bearer ${token}`}
    });
    
    if (historyRes.ok) {
      let historyData = await historyRes.json();
      console.log(`✅ Kaleia's prescription history found: ${historyData.totalCount} total`);
      
      if (historyData.prescriptionHistory.length > 0) {
        historyData.prescriptionHistory.slice(0, 5).forEach((prescription, index) => {
          console.log(`   ${index + 1}. ${prescription.medication} - ${prescription.dosage}`);
          console.log(`      Frequency: ${prescription.frequency}`);
          console.log(`      Duration: ${prescription.duration}`);
          console.log(`      Status: ${prescription.status}`);
          console.log(`      Prescribed: ${new Date(prescription.prescriptionDate).toLocaleDateString()}`);
          console.log(`      Session ID: ${prescription.sessionId}`);
          console.log(`      ---`);
        });
        
        if (historyData.prescriptionHistory.length > 5) {
          console.log(`   ... and ${historyData.prescriptionHistory.length - 5} more prescriptions`);
        }
      } else {
        console.log('   No prescription history found for Kaleia');
      }
    } else {
      console.log(`❌ Failed to fetch Kaleia's prescription history: ${historyRes.status}`);
    }
    
    console.log('\n🎉 Patient Prescriptions test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPatientPrescriptions();
