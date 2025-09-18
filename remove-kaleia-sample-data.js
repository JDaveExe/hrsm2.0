const axios = require('axios');

// Base configuration
const API_BASE = 'http://localhost:5000/api';
const AUTH_TOKEN = 'temp-admin-token';

// Test helper functions
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

async function removeKaleiaSampleData() {
  console.log('🧹 Removing sample data for Kaleia Aris...\n');
  
  try {
    // Get all appointments
    console.log('📋 Fetching all appointments...');
    const appointmentsResult = await apiCall('GET', '/appointments');
    
    if (!appointmentsResult.success) {
      console.log('❌ Failed to fetch appointments:', appointmentsResult.error);
      return;
    }

    // Filter Kaleia's appointments (Patient ID 113)
    const kaleiaAppointments = appointmentsResult.data.filter(apt => apt.patientId === 113);
    
    console.log(`✅ Found ${appointmentsResult.data.length} total appointments`);
    console.log(`📋 Found ${kaleiaAppointments.length} appointments for Kaleia Aris (Patient ID: 113)`);
    
    if (kaleiaAppointments.length === 0) {
      console.log('✨ No sample data found for Kaleia Aris - already clean!');
      return;
    }

    // Display Kaleia's appointments before deletion
    console.log('\n📋 Kaleia\'s appointments to remove:');
    kaleiaAppointments.forEach((apt, index) => {
      console.log(`${index + 1}. ID: ${apt.id} | Date: ${apt.appointmentDate} | Time: ${apt.appointmentTime} | Status: ${apt.status}`);
    });

    // Delete all of Kaleia's test appointments
    console.log('\n🗑️ Removing Kaleia\'s sample appointments...');
    
    for (const appointment of kaleiaAppointments) {
      console.log(`Deleting appointment ${appointment.id}...`);
      const deleteResult = await apiCall('DELETE', `/appointments/${appointment.id}?permanent=true`);
      
      if (deleteResult.success) {
        console.log(`✅ Successfully deleted appointment ${appointment.id}`);
      } else {
        console.log(`❌ Failed to delete appointment ${appointment.id}:`, deleteResult.error);
      }
    }

    // Verify cleanup
    console.log('\n🔍 Verifying Kaleia\'s data cleanup...');
    const verifyResult = await apiCall('GET', '/appointments');
    
    if (verifyResult.success) {
      const remainingKaleiaAppointments = verifyResult.data.filter(apt => apt.patientId === 113);
      
      console.log(`✅ Cleanup verified: ${remainingKaleiaAppointments.length} appointments remaining for Kaleia Aris`);
      
      if (remainingKaleiaAppointments.length === 0) {
        console.log('🎉 All sample data for Kaleia Aris successfully removed!');
        console.log('✨ System is clean and ready for real appointments');
      } else {
        console.log('⚠️ Some appointments still remain:');
        remainingKaleiaAppointments.forEach(apt => {
          console.log(`   - ID: ${apt.id} | Date: ${apt.appointmentDate} | Status: ${apt.status}`);
        });
      }
      
      console.log(`\n📊 Total appointments in system: ${verifyResult.data.length}`);
    } else {
      console.log('❌ Failed to verify cleanup:', verifyResult.error);
    }

    console.log('\n📊 Kaleia Aris sample data cleanup complete!');
    
  } catch (error) {
    console.error('\n💥 Cleanup failed with error:', error.message);
  }
}

// Run the cleanup
removeKaleiaSampleData();