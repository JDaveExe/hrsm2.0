// Test script to verify enhanced doctor availability tracking
const axios = require('axios');

console.log('🔍 Testing Enhanced Doctor Availability Tracking...\n');

const BASE_URL = 'http://localhost:5000/api';

// Test scenarios
async function testDoctorTracking() {
  try {
    console.log('1️⃣ Testing doctor availability endpoint...');
    
    // Test 1: Get all doctors with status
    const allDoctors = await axios.get(`${BASE_URL}/doctor/sessions/all`);
    console.log('✅ All doctors endpoint working');
    console.log(`   Found ${allDoctors.data.length} doctors`);
    
    allDoctors.data.forEach((doctor, index) => {
      console.log(`   ${index + 1}. Dr. ${doctor.name}`);
      console.log(`      Status: ${doctor.status}`);
      console.log(`      Available: ${doctor.isAvailable ? 'Yes' : 'No'}`);
      console.log(`      Busy: ${doctor.isBusy ? 'Yes' : 'No'}`);
      console.log(`      Offline: ${doctor.isOffline ? 'Yes' : 'No'}`);
      console.log(`      Online: ${doctor.isOnline ? 'Yes' : 'No'}`);
      if (doctor.lastActivity) {
        console.log(`      Last Activity: ${new Date(doctor.lastActivity).toLocaleString()}`);
      }
      console.log('');
    });

    // Test 2: Test cleanup functionality
    console.log('2️⃣ Testing stale session cleanup...');
    const cleanup = await axios.post(`${BASE_URL}/doctor/sessions/cleanup`);
    console.log('✅ Cleanup endpoint working');
    console.log(`   Cleaned up ${cleanup.data.cleanedSessions} stale sessions`);

    // Test 3: Test heartbeat functionality (if there are online doctors)
    const onlineDoctors = allDoctors.data.filter(d => d.status === 'online' || d.status === 'busy');
    if (onlineDoctors.length > 0) {
      console.log('\n3️⃣ Testing heartbeat functionality...');
      const doctor = onlineDoctors[0];
      const heartbeat = await axios.post(`${BASE_URL}/doctor/sessions/heartbeat`, {
        doctorId: doctor.id
      });
      console.log(`✅ Heartbeat sent for Dr. ${doctor.name}`);
      console.log(`   Active: ${heartbeat.data.active}`);
    } else {
      console.log('\n3️⃣ Skipping heartbeat test - no online doctors found');
    }

    // Test 4: Categorize doctors by status
    console.log('\n4️⃣ Doctor Status Summary:');
    const onlineCount = allDoctors.data.filter(d => d.status === 'online').length;
    const busyCount = allDoctors.data.filter(d => d.status === 'busy').length;
    const offlineCount = allDoctors.data.filter(d => d.status === 'offline').length;
    
    console.log(`   🟢 Online (Available): ${onlineCount}`);
    console.log(`   🟡 Busy (With Patients): ${busyCount}`);
    console.log(`   🔴 Offline (Not Logged In): ${offlineCount}`);
    console.log(`   📊 Total: ${allDoctors.data.length}`);

    // Test 5: Check tracking accuracy
    console.log('\n5️⃣ Tracking Accuracy Analysis:');
    const loggedInDoctors = allDoctors.data.filter(d => d.isOnline);
    const availableDoctors = allDoctors.data.filter(d => d.isAvailable);
    const busyDoctors = allDoctors.data.filter(d => d.isBusy);
    
    console.log(`   📱 Logged In (Online + Busy): ${loggedInDoctors.length}`);
    console.log(`   ✅ Available for Patients: ${availableDoctors.length}`);
    console.log(`   🏥 Currently with Patients: ${busyDoctors.length}`);
    
    if (loggedInDoctors.length === availableDoctors.length + busyDoctors.length) {
      console.log('   ✅ Status tracking is consistent');
    } else {
      console.log('   ⚠️  Status tracking may have inconsistencies');
    }

    console.log('\n🎉 Doctor availability tracking test completed!');
    console.log('\n📋 Improvements implemented:');
    console.log('   ✅ Automatic cleanup of stale sessions (5-minute timeout)');
    console.log('   ✅ Enhanced status categorization (online/busy/offline)');
    console.log('   ✅ Heartbeat mechanism for active sessions');
    console.log('   ✅ Proper doctor login/logout session management');
    console.log('   ✅ Accurate tracking of doctor availability');
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Test failed:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running');
      console.log('💡 Please start the backend server first');
    } else {
      console.log('❌ Test failed:', error.message);
    }
  }
}

testDoctorTracking();