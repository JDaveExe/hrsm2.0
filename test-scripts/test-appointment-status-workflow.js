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

const log = (message, data = '') => {
  console.log(`\n📋 ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

// Test the new appointment status workflow endpoints
async function testAppointmentStatusWorkflow() {
  console.log('🚀 Testing Appointment Status Workflow Endpoints\n');
  
  try {
    // Step 1: Create a test appointment first
    log('Step 1: Creating a test appointment');
    const createResult = await apiCall('POST', '/appointments', {
      patientId: 1, // Assuming we have a patient with ID 1
      doctorId: 1,   // Assuming we have a doctor with ID 1
      appointmentDate: '2024-01-15',
      appointmentTime: '10:00',
      type: 'Consultation',
      notes: 'Test appointment for status workflow'
    });
    
    if (!createResult.success) {
      console.log('❌ Failed to create test appointment:', createResult.error);
      return;
    }
    
    const appointmentId = createResult.data.appointment.id;
    log('✅ Test appointment created', { appointmentId, status: createResult.data.appointment.status });

    // Step 2: Test appointment acceptance
    log('Step 2: Testing patient appointment acceptance');
    const acceptResult = await apiCall('PUT', `/appointments/${appointmentId}/accept`);
    
    if (acceptResult.success) {
      log('✅ Appointment accepted successfully', { 
        newStatus: acceptResult.data.appointment.status,
        message: acceptResult.data.msg 
      });
    } else {
      log('❌ Failed to accept appointment', acceptResult.error);
    }

    // Step 3: Test appointment completion
    log('Step 3: Testing appointment completion by doctor');
    const completeResult = await apiCall('PUT', `/appointments/${appointmentId}/complete`, {
      diagnosis: 'Test diagnosis - regular checkup',
      treatment: 'Test treatment plan',
      prescription: 'Test medication prescription'
    });
    
    if (completeResult.success) {
      log('✅ Appointment completed successfully', { 
        newStatus: completeResult.data.appointment.status,
        diagnosis: completeResult.data.appointment.diagnosis 
      });
    } else {
      log('❌ Failed to complete appointment', completeResult.error);
    }

    // Step 4: Test status history
    log('Step 4: Testing appointment status history');
    const historyResult = await apiCall('GET', `/appointments/${appointmentId}/status-history`);
    
    if (historyResult.success) {
      log('✅ Status history retrieved successfully', historyResult.data);
    } else {
      log('❌ Failed to get status history', historyResult.error);
    }

    // Step 5: Create another appointment to test rejection
    log('Step 5: Creating another appointment to test rejection');
    const createResult2 = await apiCall('POST', '/appointments', {
      patientId: 1,
      doctorId: 1,
      appointmentDate: '2024-01-16',
      appointmentTime: '11:00',
      type: 'Follow-up',
      notes: 'Test appointment for rejection workflow'
    });
    
    if (!createResult2.success) {
      console.log('❌ Failed to create second test appointment:', createResult2.error);
      return;
    }
    
    const appointmentId2 = createResult2.data.appointment.id;
    log('✅ Second test appointment created', { appointmentId: appointmentId2 });

    // Step 6: Test appointment rejection
    log('Step 6: Testing patient appointment rejection');
    const rejectResult = await apiCall('PUT', `/appointments/${appointmentId2}/reject`, {
      reason: 'Patient is not available at scheduled time'
    });
    
    if (rejectResult.success) {
      log('✅ Appointment rejected successfully', { 
        newStatus: rejectResult.data.appointment.status,
        reason: rejectResult.data.appointment.rejectionReason 
      });
    } else {
      log('❌ Failed to reject appointment', rejectResult.error);
    }

    console.log('\n🎉 Appointment Status Workflow Test Complete!');
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
  }
}

// Run the test
testAppointmentStatusWorkflow();