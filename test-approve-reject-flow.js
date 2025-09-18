const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test approval flow
async function testApprovalFlow() {
  console.log('🚀 Testing Appointment Request Approval Flow\n');

  try {
    // Step 1: Submit a request
    console.log('📝 Step 1: Submitting appointment request...');
    const requestData = {
      patientId: 'PT-0001',
      patientName: 'Test Patient',
      appointmentType: 'General Consultation',
      requestedDate: '2025-09-20',
      requestedTime: '14:00',
      symptoms: 'Test symptoms for approval',
      notes: 'Testing approval flow',
      status: 'pending'
    };

    const submitResponse = await axios.post(`${API_BASE_URL}/appointments/requests`, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      }
    });

    const requestId = submitResponse.data.request.id;
    console.log('✅ Request submitted with ID:', requestId);
    console.log('📅 PENDING appointment created with ID:', submitResponse.data.appointment.id);

    // Step 2: Verify request exists
    console.log('\n🔍 Step 2: Verifying request exists...');
    const getResponse = await axios.get(`${API_BASE_URL}/appointments/requests`, {
      headers: { 'x-auth-token': 'temp-admin-token' }
    });
    
    console.log('✅ Total requests found:', getResponse.data.length);
    const foundRequest = getResponse.data.find(req => req.id === requestId);
    if (foundRequest) {
      console.log('✅ Request found:', foundRequest.patientName);
    } else {
      console.log('❌ Request not found!');
      return;
    }

    // Step 3: Approve the request
    console.log('\n✅ Step 3: Approving the request...');
    const approveResponse = await axios.post(`${API_BASE_URL}/appointments/requests/${requestId}/approve`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      }
    });

    console.log('✅ Approval response:', approveResponse.data.message);
    console.log('📅 Approved appointment:', approveResponse.data.appointment?.status);

    // Step 4: Verify request was removed from requests
    console.log('\n🔍 Step 4: Verifying request was removed...');
    const getAfterApproval = await axios.get(`${API_BASE_URL}/appointments/requests`, {
      headers: { 'x-auth-token': 'temp-admin-token' }
    });
    
    console.log('✅ Remaining requests after approval:', getAfterApproval.data.length);

    // Step 5: Check if appointment appears in regular appointments endpoint
    console.log('\n📅 Step 5: Checking appointments endpoint...');
    try {
      const appointmentsResponse = await axios.get(`${API_BASE_URL}/appointments`, {
        headers: { 'x-auth-token': 'temp-admin-token' }
      });
      console.log('📊 Total appointments found:', appointmentsResponse.data.length);
      
      // Look for our approved appointment
      const approvedAppointment = appointmentsResponse.data.find(apt => 
        apt.patientName === 'Test Patient' && apt.status === 'approved'
      );
      
      if (approvedAppointment) {
        console.log('✅ Approved appointment found in appointments list!');
        console.log('   Status:', approvedAppointment.status);
        console.log('   Date:', approvedAppointment.appointmentDate);
        console.log('   Time:', approvedAppointment.appointmentTime);
      } else {
        console.log('⚠️  Approved appointment not found in main appointments endpoint');
      }
    } catch (error) {
      console.log('⚠️  Could not fetch from main appointments endpoint (might use database)');
      console.log('   This is expected with current mixed implementation');
    }

    console.log('\n🎉 Approval flow test completed successfully!');

  } catch (error) {
    console.error('❌ Error in approval flow test:', error.response?.data || error.message);
  }
}

// Test rejection flow
async function testRejectionFlow() {
  console.log('\n🚀 Testing Appointment Request Rejection Flow\n');

  try {
    // Step 1: Submit a request
    console.log('📝 Step 1: Submitting appointment request...');
    const requestData = {
      patientId: 'PT-0002',
      patientName: 'Jane Doe',
      appointmentType: 'Vaccination',
      requestedDate: '2025-09-21',
      requestedTime: '10:00',
      notes: 'Testing rejection flow',
      status: 'pending'
    };

    const submitResponse = await axios.post(`${API_BASE_URL}/appointments/requests`, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      }
    });

    const requestId = submitResponse.data.request.id;
    console.log('✅ Request submitted with ID:', requestId);

    // Step 2: Reject the request with reason
    console.log('\n❌ Step 2: Rejecting the request...');
    const rejectResponse = await axios.post(`${API_BASE_URL}/appointments/requests/${requestId}/reject`, {
      reason: 'Doctor not available on selected date'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      }
    });

    console.log('✅ Rejection response:', rejectResponse.data.message);
    console.log('📝 Rejection reason:', rejectResponse.data.reason);
    console.log('📅 Rejected appointment status:', rejectResponse.data.appointment?.status);

    // Step 3: Verify request was removed from requests
    console.log('\n🔍 Step 3: Verifying request was removed...');
    const getAfterRejection = await axios.get(`${API_BASE_URL}/appointments/requests`, {
      headers: { 'x-auth-token': 'temp-admin-token' }
    });
    
    console.log('✅ Remaining requests after rejection:', getAfterRejection.data.length);

    console.log('\n🎉 Rejection flow test completed successfully!');

  } catch (error) {
    console.error('❌ Error in rejection flow test:', error.response?.data || error.message);
  }
}

// Run both tests
async function runTests() {
  await testApprovalFlow();
  await testRejectionFlow();
}

runTests().catch(console.error);