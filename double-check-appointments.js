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

async function doubleCheckAppointments() {
  console.log('🔍 Double-checking appointment data...\n');
  
  try {
    // Check all appointments
    console.log('📋 Checking /api/appointments endpoint:');
    const appointmentsResult = await apiCall('GET', '/appointments');
    
    if (appointmentsResult.success) {
      console.log(`✅ API Response: ${appointmentsResult.data.length} appointments found`);
      
      if (appointmentsResult.data.length > 0) {
        console.log('\n❗ Found appointments still in system:');
        appointmentsResult.data.forEach((apt, index) => {
          console.log(`${index + 1}. ID: ${apt.id} | Patient: ${apt.patient?.firstName} ${apt.patient?.lastName} | Date: ${apt.appointmentDate} | Status: ${apt.status}`);
        });
        
        // Try to delete them again
        console.log('\n🗑️ Attempting to delete remaining appointments...');
        for (const appointment of appointmentsResult.data) {
          const deleteResult = await apiCall('DELETE', `/appointments/${appointment.id}?permanent=true`);
          if (deleteResult.success) {
            console.log(`✅ Deleted appointment ${appointment.id}`);
          } else {
            console.log(`❌ Failed to delete appointment ${appointment.id}:`, deleteResult.error);
          }
        }
        
        // Final verification
        console.log('\n🔍 Final verification...');
        const finalCheck = await apiCall('GET', '/appointments');
        if (finalCheck.success) {
          console.log(`✅ Final count: ${finalCheck.data.length} appointments`);
        }
        
      } else {
        console.log('✅ API confirms: No appointments in database');
        console.log('ℹ️  If you still see appointments in the frontend, try:');
        console.log('   1. Hard refresh the browser (Ctrl+F5)');
        console.log('   2. Clear browser cache');
        console.log('   3. Check if frontend has cached data');
      }
    } else {
      console.log('❌ Failed to check appointments:', appointmentsResult.error);
    }

  } catch (error) {
    console.error('\n💥 Check failed:', error.message);
  }
}

doubleCheckAppointments();