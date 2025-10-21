const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function debugAppointments() {
  console.log('🔍 Debugging appointment data structure...\n');
  
  try {
    // Check appointments endpoint
    console.log('📅 Fetching appointments from backend...');
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const appointments = await response.json();
    console.log(`✅ Found ${appointments.length} appointments\n`);
    
    if (appointments.length > 0) {
      console.log('📊 Appointment data structure:');
      appointments.forEach((apt, index) => {
        console.log(`\n--- Appointment ${index + 1} ---`);
        console.log('Raw data:', JSON.stringify(apt, null, 2));
        console.log('\nKey fields:');
        console.log(`  ID: ${apt.id}`);
        console.log(`  Date: ${apt.date} (type: ${typeof apt.date})`);
        console.log(`  Time: ${apt.time}`);
        console.log(`  Service Type: ${apt.serviceType}`);
        console.log(`  Appointment Type: ${apt.appointmentType}`);
        console.log(`  Status: ${apt.status}`);
        console.log(`  Patient ID: ${apt.patientId}`);
        
        // Test date parsing
        console.log('\nDate parsing test:');
        console.log(`  new Date(apt.date): ${new Date(apt.date)}`);
        console.log(`  toLocaleDateString(): ${new Date(apt.date).toLocaleDateString()}`);
      });
    } else {
      console.log('ℹ️ No appointments found in system');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugAppointments();