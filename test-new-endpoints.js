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

async function testNewEndpoints() {
  console.log('🚀 Testing New Automatic Status Management Endpoints\n');
  
  try {
    // Test 1: Create a simple appointment
    console.log('Step 1: Creating a test appointment...');
    const patientsResult = await apiCall('GET', '/patients');
    
    if (!patientsResult.success || patientsResult.data.length === 0) {
      console.log('❌ No patients found');
      return;
    }
    
    const testPatient = patientsResult.data[0];
    console.log(`✅ Using patient: ${testPatient.fullName} (ID: ${testPatient.id})`);
    
    const appointment = await apiCall('POST', '/appointments', {
      patientId: testPatient.id,
      doctorId: null,
      appointmentDate: '2025-09-18',
      appointmentTime: '15:00',
      type: 'Consultation',
      notes: 'Test appointment for new endpoints'
    });
    
    if (appointment.success) {
      const appointmentId = appointment.data.appointment.id;
      console.log(`✅ Created appointment ID: ${appointmentId}`);
      
      // Test 2: Test overdue status update endpoint
      console.log('\nStep 2: Testing overdue status update endpoint...');
      const updateResult = await apiCall('PUT', '/appointments/update-overdue-status');
      
      if (updateResult.success) {
        console.log('✅ Overdue status update endpoint working:', updateResult.data.msg);
        console.log(`   Updated: ${updateResult.data.updated} appointments`);
      } else {
        console.log('❌ Overdue status update failed:', updateResult.error);
      }
      
      // Test 3: Accept appointment
      console.log('\nStep 3: Testing appointment acceptance...');
      const acceptResult = await apiCall('PUT', `/appointments/${appointmentId}/accept`);
      
      if (acceptResult.success) {
        console.log('✅ Appointment accepted successfully');
        console.log(`   New status: ${acceptResult.data.appointment.status}`);
        
        // Test 4: Mark as completed
        console.log('\nStep 4: Testing mark as completed endpoint...');
        const completeResult = await apiCall('PUT', `/appointments/${appointmentId}/mark-completed`);
        
        if (completeResult.success) {
          console.log('✅ Mark as completed endpoint working');
          console.log(`   Final status: ${completeResult.data.appointment.status}`);
        } else {
          console.log('❌ Mark as completed failed:', completeResult.error);
        }
      } else {
        console.log('❌ Appointment acceptance failed:', acceptResult.error);
      }
      
    } else {
      console.log('❌ Failed to create appointment:', appointment.error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testNewEndpoints();
