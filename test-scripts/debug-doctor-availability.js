/**
 * Debug Doctor Availability API
 * This script tests the actual doctor session API to see what's being returned
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function debugDoctorAvailability() {
  console.log('🔍 Debugging Doctor Availability API...');
  console.log('=====================================');
  
  try {
    // Test the API endpoint that the frontend calls
    console.log('\n📡 Calling /api/doctor/sessions/all...');
    const response = await axios.get(`${BASE_URL}/doctor/sessions/all`);
    
    console.log('\n📊 API Response:');
    console.log('================');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
    // Analyze the data
    const doctors = response.data;
    console.log('\n🔬 Analysis:');
    console.log('============');
    console.log(`Total doctors: ${doctors.length}`);
    
    doctors.forEach((doctor, index) => {
      console.log(`\n${index + 1}. ${doctor.name}:`);
      console.log(`   - Status: ${doctor.status}`);
      console.log(`   - isAvailable: ${doctor.isAvailable}`);
      console.log(`   - isBusy: ${doctor.isBusy}`);
      console.log(`   - isOffline: ${doctor.isOffline}`);
      console.log(`   - isOnline: ${doctor.isOnline}`);
      console.log(`   - Position: ${doctor.position}`);
      console.log(`   - Login Time: ${doctor.loginTime}`);
      console.log(`   - Last Activity: ${doctor.lastActivity}`);
    });
    
    // Categorize doctors
    const available = doctors.filter(d => d.isAvailable);
    const busy = doctors.filter(d => d.isBusy);
    const offline = doctors.filter(d => d.isOffline);
    
    console.log('\n📈 Summary:');
    console.log('===========');
    console.log(`✅ Available doctors: ${available.length}`);
    available.forEach(d => console.log(`   - ${d.name}`));
    
    console.log(`⚠️  Busy doctors: ${busy.length}`);
    busy.forEach(d => console.log(`   - ${d.name}`));
    
    console.log(`❌ Offline doctors: ${offline.length}`);
    offline.forEach(d => console.log(`   - ${d.name}`));
    
    // Check for the specific issue
    console.log('\n🚨 Checking for availability bug:');
    console.log('=================================');
    const incorrectlyAvailable = doctors.filter(d => 
      d.isAvailable && (!d.loginTime || d.status === 'offline')
    );
    
    if (incorrectlyAvailable.length > 0) {
      console.log('❌ FOUND BUG! These doctors show as available but are not logged in:');
      incorrectlyAvailable.forEach(d => {
        console.log(`   - ${d.name}: status="${d.status}", loginTime=${d.loginTime}`);
      });
    } else {
      console.log('✅ No availability bug detected');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

async function checkDoctorSessions() {
  console.log('\n🗃️  Checking DoctorSession table directly...');
  console.log('===========================================');
  
  try {
    // This would require database access, so we'll check via another endpoint if available
    console.log('Note: Direct database check would require backend access');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the debug
debugDoctorAvailability().then(() => {
  console.log('\n✅ Debug completed!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Debug failed:', error.message);
  process.exit(1);
});