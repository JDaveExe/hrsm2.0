const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_CREDENTIALS = {
  login: 'admin',
  password: 'admin123'
};

let authToken = '';

async function testStatusUpdate() {
  try {
    // Step 1: Login
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    authToken = loginResponse.data.token;
    console.log('✅ Login successful');

    // Step 2: Create a test patient and check-in
    console.log('\n👤 Creating test patient...');
    const testPatient = {
      firstName: 'StatusTest',
      lastName: 'Patient',
      dateOfBirth: '1995-01-15',
      gender: 'Female',
      contactNumber: `09${Date.now().toString().slice(-9)}`,
      address: 'Test Address'
    };

    const patientResponse = await axios.post(`${BASE_URL}/patients`, testPatient, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const patientId = patientResponse.data.patient?.id || patientResponse.data.id;
    console.log(`✅ Patient created with ID: ${patientId}`);

    // Step 3: Check-in the patient
    console.log('\n🏥 Checking in patient...');
    const checkInData = {
      patientId: patientId,
      serviceType: 'general-checkup',
      priority: 'normal',
      checkInMethod: 'staff-assisted'
    };

    const checkInResponse = await axios.post(`${BASE_URL}/checkups/check-in`, checkInData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const sessionId = checkInResponse.data.session.id;
    console.log(`✅ Patient checked in with session ID: ${sessionId}`);
    
    // Step 4: Check current status
    console.log('\n🔍 Checking initial session status...');
    const initialResponse = await axios.get(`${BASE_URL}/checkups/today`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const initialSession = initialResponse.data.find(s => s.id === sessionId);
    console.log(`Initial status: "${initialSession?.status || 'NOT FOUND'}"`);

    // Step 5: Test status update to 'vaccination-completed'
    console.log('\n🔄 Testing status update to "vaccination-completed"...');
    const statusUpdateData = {
      status: 'vaccination-completed',
      notes: 'Direct API test of vaccination completion'
    };

    const statusResponse = await axios.put(`${BASE_URL}/checkups/${sessionId}/status`, statusUpdateData, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    console.log('Status update response:', statusResponse.status, statusResponse.statusText);
    console.log('Response data keys:', Object.keys(statusResponse.data));

    // Step 6: Verify the status was actually updated
    console.log('\n✅ Verifying status update...');
    const verifyResponse = await axios.get(`${BASE_URL}/checkups/today`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const updatedSession = verifyResponse.data.find(s => s.id === sessionId);
    
    console.log('Verification results:');
    console.log(`  Session ID: ${sessionId}`);
    console.log(`  Updated status: "${updatedSession?.status || 'NOT FOUND'}"`);
    console.log(`  Updated at: ${updatedSession?.updatedAt || 'NOT FOUND'}`);
    console.log(`  Completed at: ${updatedSession?.completedAt || 'NOT FOUND'}`);

    if (updatedSession?.status === 'vaccination-completed') {
      console.log('\n🎉 SUCCESS: Status was properly updated to "vaccination-completed"');
      
      // Step 7: Check if it appears in dashboard stats
      console.log('\n📊 Checking dashboard stats...');
      const dashboardResponse = await axios.get(`${BASE_URL}/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      console.log('Dashboard stats:');
      console.log(`  Total checkups: ${dashboardResponse.data.checkups?.total || 0}`);
      console.log(`  Completed today: ${dashboardResponse.data.checkups?.completedToday || 0}`);
      console.log(`  Total completed: ${dashboardResponse.data.checkups?.totalCompleted || 0}`);
      
    } else {
      console.log('\n❌ FAILURE: Status was NOT properly updated');
      console.log(`Expected: "vaccination-completed"`);
      console.log(`Actual: "${updatedSession?.status || 'EMPTY/NULL'}"`);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

console.log('🧪 DIRECT STATUS UPDATE API TEST');
console.log('=================================');
testStatusUpdate();