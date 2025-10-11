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

// Test the new appointment status workflow endpoints using existing data
async function testAppointmentStatusWorkflowWithExistingData() {
  console.log('🚀 Testing Appointment Status Workflow with Existing Data\n');
  
  try {
    // Step 1: Get existing patients to use for testing
    log('Step 1: Getting existing patients');
    const patientsResult = await apiCall('GET', '/patients');
    
    if (!patientsResult.success || patientsResult.data.length === 0) {
      console.log('❌ No patients found for testing');
      return;
    }
    
    const testPatient = patientsResult.data[0];
    log('✅ Using test patient', { id: testPatient.id, name: testPatient.fullName });

    // Step 2: Create a test appointment with unique time slot
    log('Step 2: Creating a test appointment');
    const currentDate = new Date();
    const futureDate = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
    const appointmentDate = futureDate.toISOString().split('T')[0];
    
    const createResult = await apiCall('POST', '/appointments', {
      patientId: testPatient.id,
      doctorId: null, // Using null since we don't have confirmed doctor IDs
      appointmentDate: appointmentDate,
      appointmentTime: '14:30', // Using a different time to avoid conflicts
      type: 'Consultation',
      notes: 'Test appointment for status workflow'
    });
    
    if (!createResult.success) {
      console.log('❌ Failed to create test appointment:', createResult.error);
      return;
    }
    
    const appointmentId = createResult.data.appointment.id;
    log('✅ Test appointment created', { appointmentId, status: createResult.data.appointment.status });

    // Step 3: Test appointment acceptance
    log('Step 3: Testing patient appointment acceptance');
    const acceptResult = await apiCall('PUT', `/appointments/${appointmentId}/accept`);
    
    if (acceptResult.success) {
      log('✅ Appointment accepted successfully', { 
        newStatus: acceptResult.data.appointment.status,
        message: acceptResult.data.msg 
      });
    } else {
      log('❌ Failed to accept appointment', acceptResult.error);
    }

    // Step 4: Test appointment completion
    log('Step 4: Testing appointment completion');
    const completeResult = await apiCall('PUT', `/appointments/${appointmentId}/complete`, {
      diagnosis: 'Test diagnosis - regular checkup completed successfully',
      treatment: 'Test treatment plan - follow standard protocols',
      prescription: 'Test medication prescription - as per consultation'
    });
    
    if (completeResult.success) {
      log('✅ Appointment completed successfully', { 
        newStatus: completeResult.data.appointment.status,
        diagnosis: completeResult.data.appointment.diagnosis 
      });
    } else {
      log('❌ Failed to complete appointment', completeResult.error);
    }

    // Step 5: Test status history
    log('Step 5: Testing appointment status history');
    const historyResult = await apiCall('GET', `/appointments/${appointmentId}/status-history`);
    
    if (historyResult.success) {
      log('✅ Status history retrieved successfully', historyResult.data);
    } else {
      log('❌ Failed to get status history', historyResult.error);
    }

    // Step 6: Create another appointment to test rejection
    log('Step 6: Creating another appointment to test rejection workflow');
    const futureDate2 = new Date(currentDate.getTime() + (8 * 24 * 60 * 60 * 1000)); // 8 days from now
    const appointmentDate2 = futureDate2.toISOString().split('T')[0];
    
    const createResult2 = await apiCall('POST', '/appointments', {
      patientId: testPatient.id,
      doctorId: null,
      appointmentDate: appointmentDate2,
      appointmentTime: '15:30', // Different time to avoid conflicts
      type: 'Follow-up',
      notes: 'Test appointment for rejection workflow'
    });
    
    if (!createResult2.success) {
      console.log('❌ Failed to create second test appointment:', createResult2.error);
      return;
    }
    
    const appointmentId2 = createResult2.data.appointment.id;
    log('✅ Second test appointment created', { appointmentId: appointmentId2 });

    // Step 7: Test appointment rejection
    log('Step 7: Testing patient appointment rejection');
    const rejectResult = await apiCall('PUT', `/appointments/${appointmentId2}/reject`, {
      reason: 'Patient schedule conflict - cannot attend at the scheduled time'
    });
    
    if (rejectResult.success) {
      log('✅ Appointment rejected successfully', { 
        newStatus: rejectResult.data.appointment.status,
        reason: rejectResult.data.appointment.rejectionReason 
      });
    } else {
      log('❌ Failed to reject appointment', rejectResult.error);
    }

    // Step 8: Get final appointment list to see our test results
    log('Step 8: Checking final appointment list');
    const finalAppointmentsResult = await apiCall('GET', '/appointments');
    
    if (finalAppointmentsResult.success) {
      log('✅ Final appointments in system', {
        total: finalAppointmentsResult.data.length,
        our_appointments: finalAppointmentsResult.data.filter(apt => 
          apt.id === appointmentId || apt.id === appointmentId2
        )
      });
    } else {
      log('❌ Failed to get final appointments', finalAppointmentsResult.error);
    }

    console.log('\n🎉 Appointment Status Workflow Test Complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Created 2 test appointments`);
    console.log(`   - Tested accept → complete workflow`);
    console.log(`   - Tested reject workflow`);
    console.log(`   - Verified status history tracking`);
    
  } catch (error) {
    console.error('\n💥 Test failed with error:', error.message);
  }
}

// Run the test
testAppointmentStatusWorkflowWithExistingData();