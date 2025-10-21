// Debug script to check PatientQueue data flow
const fetch = require('node-fetch');

async function debugQueue() {
  console.log('🔍 Debug: Checking PatientQueue data flow...');
  
  try {
    // Login as doctor
    console.log('🔐 Logging in as doctor...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: 'doctor.smith', password: 'password123'})
    });
    const loginData = await loginRes.json();
    console.log('✅ Login successful');
    
    // Check doctor queue
    console.log('🏥 Fetching doctor queue...');
    const queueRes = await fetch('http://localhost:5000/api/doctor/queue', {
      headers: {'Authorization': `Bearer ${loginData.token}`}
    });
    const queueData = await queueRes.json();
    
    console.log('📊 Queue Status:');
    console.log(`   Total patients: ${queueData.length}`);
    
    queueData.forEach((patient, index) => {
      console.log(`   ${index + 1}. ${patient.patientName}`);
      console.log(`      Status: ${patient.status}`);
      console.log(`      Service: ${patient.serviceType}`);
      console.log(`      ID: ${patient.id}`);
      console.log(`      ---`);
    });
    
    // Check if any patients are in 'waiting' status
    const waitingPatients = queueData.filter(p => p.status === 'waiting');
    console.log(`🎯 Patients ready for checkup: ${waitingPatients.length}`);
    
    if (waitingPatients.length > 0) {
      console.log('🚀 Try clicking "Start Checkup" for:');
      waitingPatients.forEach(patient => {
        console.log(`   - ${patient.patientName} (ID: ${patient.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugQueue();
