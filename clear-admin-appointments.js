const axios = require('axios');

// Base configuration
const API_BASE = 'http://localhost:5000/api';
const AUTH_TOKEN = 'temp-admin-token';

// API helper function
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': AUTH_TOKEN
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

async function clearAdminAppointmentView() {
  console.log('🧹 Clearing all appointment data from admin view...\n');
  
  try {
    // Step 1: Get all current appointments
    console.log('📋 Fetching all current appointments...');
    const appointmentsResult = await apiCall('GET', '/appointments');
    
    if (!appointmentsResult.success) {
      console.log('❌ Failed to fetch appointments:', appointmentsResult.error);
      return;
    }

    const appointments = appointmentsResult.data;
    console.log(`✅ Found ${appointments.length} appointments to remove`);
    
    if (appointments.length === 0) {
      console.log('✨ No appointments found - admin view is already clean!');
      return;
    }

    // Step 2: Display appointments before deletion
    console.log('\n📋 Current appointments in admin view:');
    appointments.forEach((apt, index) => {
      console.log(`${index + 1}. ID: ${apt.id} | Patient: ${apt.patient?.firstName} ${apt.patient?.lastName} | Date: ${apt.appointmentDate} | Status: ${apt.status}`);
    });

    // Step 3: Delete all appointments
    console.log('\n🗑️ Permanently deleting all appointments...');
    
    for (const appointment of appointments) {
      console.log(`Deleting appointment ${appointment.id}...`);
      const deleteResult = await apiCall('DELETE', `/appointments/${appointment.id}?permanent=true`);
      
      if (deleteResult.success) {
        console.log(`✅ Successfully deleted appointment ${appointment.id}`);
      } else {
        console.log(`❌ Failed to delete appointment ${appointment.id}:`, deleteResult.error);
      }
    }

    // Step 4: Verify cleanup
    console.log('\n🔍 Verifying admin view is clean...');
    const verifyResult = await apiCall('GET', '/appointments');
    
    if (verifyResult.success) {
      console.log(`✅ Cleanup verified: ${verifyResult.data.length} appointments remaining`);
      
      if (verifyResult.data.length === 0) {
        console.log('\n🎉 Admin "All Appointments" view successfully cleared!');
        console.log('✨ The appointment list is now empty and ready for real data');
      } else {
        console.log('\n⚠️ Some appointments still remain:');
        verifyResult.data.forEach(apt => {
          console.log(`   - ID: ${apt.id} | Patient: ${apt.patient?.firstName} ${apt.patient?.lastName}`);
        });
      }
    } else {
      console.log('❌ Failed to verify cleanup:', verifyResult.error);
    }

    console.log('\n📊 Admin appointment view cleanup complete!');
    
  } catch (error) {
    console.error('\n💥 Cleanup failed with error:', error.message);
  }
}

// Run the cleanup
clearAdminAppointmentView();