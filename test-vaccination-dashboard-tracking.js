const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test credentials - using existing admin account
const TEST_CREDENTIALS = {
  login: 'admin',
  password: 'admin123'
};

let authToken = '';

// Utility function to make authenticated requests
const makeAuthenticatedRequest = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Error in ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Step 1: Login and get auth token
const login = async () => {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_URL}/auth/login`, TEST_CREDENTIALS);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
};

// Step 2: Get baseline dashboard stats
const getBaselineStats = async () => {
  try {
    console.log('\n📊 Getting baseline dashboard statistics...');
    
    // Get dashboard stats from backend
    const dashboardStats = await makeAuthenticatedRequest('GET', '/dashboard/stats');
    console.log('Backend Dashboard Stats:', {
      totalCheckups: dashboardStats.checkups?.total || 0,
      completedToday: dashboardStats.checkups?.completedToday || 0,
      totalCompleted: dashboardStats.checkups?.totalCompleted || 0
    });
    
    // Get today's checkup trends
    const checkupTrends = await makeAuthenticatedRequest('GET', '/dashboard/checkup-trends/days');
    console.log('Checkup Trends Data:', checkupTrends);
    
    return {
      dashboardStats,
      checkupTrends,
      baselineCompletedToday: dashboardStats.checkups?.completedToday || 0,
      baselineTotalCompleted: dashboardStats.checkups?.totalCompleted || 0
    };
  } catch (error) {
    console.error('❌ Failed to get baseline stats:', error.message);
    throw error;
  }
};

// Step 3: Create a test patient and check-in
const createTestPatientAndCheckIn = async () => {
  try {
    console.log('\n👤 Creating test patient and check-in...');
    
    // Create a unique test patient
    const timestamp = new Date().getTime();
    const testPatient = {
      firstName: `TestVax${timestamp}`,
      lastName: 'Patient',
      dateOfBirth: '1998-01-15',
      gender: 'Male',
      contactNumber: `09${timestamp.toString().slice(-9)}`,
      address: 'Test Address for Vaccination',
      emergencyContact: '09999999999'
    };
    
    console.log('Creating patient:', `${testPatient.firstName} ${testPatient.lastName}`);
    
    // Create patient
    const patientResponse = await makeAuthenticatedRequest('POST', '/patients', testPatient);
    const patientId = patientResponse.patient?.id || patientResponse.id;
    
    if (!patientId) {
      throw new Error('Patient creation failed - no ID returned');
    }
    
    console.log('✅ Patient created with ID:', patientId);
    
    // Check in the patient
    const checkInData = {
      patientId: patientId,
      serviceType: 'general-checkup',
      priority: 'normal',
      checkInMethod: 'staff-assisted',
      notes: 'Test vaccination workflow'
    };
    
    console.log('Checking in patient...');
    const checkInResponse = await makeAuthenticatedRequest('POST', '/checkups/check-in', checkInData);
    console.log('Check-in Response:', checkInResponse);
    
    const sessionId = checkInResponse.sessionId || checkInResponse.id || checkInResponse.checkIn?.id || checkInResponse.session?.id;
    
    if (!sessionId) {
      console.log('Full check-in response:', JSON.stringify(checkInResponse, null, 2));
      throw new Error('Check-in failed - no session ID returned');
    }
    
    console.log('✅ Patient checked in with session ID:', sessionId);
    
    return { patientId, sessionId, patientName: `${testPatient.firstName} ${testPatient.lastName}` };
  } catch (error) {
    console.error('❌ Failed to create patient and check-in:', error.message);
    throw error;
  }
};

// Step 4: Complete the vaccination workflow
const completeVaccinationWorkflow = async (sessionId, patientId, patientName) => {
  try {
    console.log('\n💉 Completing vaccination workflow...');
    
    // Step 4a: Record vital signs (required before vaccination)
    console.log('Recording vital signs...');
    const vitalsData = {
      systolicBP: 120,
      diastolicBP: 80,
      temperature: 36.5,
      heartRate: 72,
      weight: 65,
      height: 170,
      notes: 'Normal vital signs before vaccination'
    };
    
    await makeAuthenticatedRequest('POST', `/checkups/${sessionId}/vital-signs`, vitalsData);
    console.log('✅ Vital signs recorded');
    
    // Step 4b: Start vaccination
    console.log('Starting vaccination...');
    const vaccinationData = {
      patientId: patientId,
      sessionId: sessionId,
      vaccineName: 'COVID-19 Vaccine',
      manufacturer: 'Pfizer',
      lotNumber: `TEST${Date.now()}`,
      administeredBy: 'Test Doctor',
      administrationSite: 'Left arm',
      notes: 'Test vaccination for dashboard tracking'
    };
    
    const vaccinationResponse = await makeAuthenticatedRequest('POST', '/vaccinations', vaccinationData);
    console.log('✅ Vaccination recorded:', vaccinationResponse);
    
    // Step 4c: Complete the session with vaccination-completed status
    console.log('Completing vaccination session...');
    const completionData = {
      status: 'vaccination-completed',
      notes: 'Vaccination completed successfully for dashboard test'
    };
    
    const completionResponse = await makeAuthenticatedRequest('PUT', `/checkups/${sessionId}/status`, completionData);
    console.log('✅ Session completed with vaccination-completed status');
    
    return vaccinationResponse;
  } catch (error) {
    console.error('❌ Failed to complete vaccination workflow:', error.message);
    throw error;
  }
};

// Step 5: Verify the dashboard updates
const verifyDashboardUpdates = async (baselineStats) => {
  try {
    console.log('\n🔍 Verifying dashboard updates...');
    
    // Wait a moment for database updates
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get updated dashboard stats
    const updatedStats = await makeAuthenticatedRequest('GET', '/dashboard/stats');
    console.log('Updated Backend Dashboard Stats:', {
      totalCheckups: updatedStats.checkups?.total || 0,
      completedToday: updatedStats.checkups?.completedToday || 0,
      totalCompleted: updatedStats.checkups?.totalCompleted || 0
    });
    
    // Get updated checkup trends
    const updatedTrends = await makeAuthenticatedRequest('GET', '/dashboard/checkup-trends/days');
    console.log('Updated Checkup Trends Data:', updatedTrends);
    
    // Compare the results
    const completedTodayIncrease = (updatedStats.checkups?.completedToday || 0) - baselineStats.baselineCompletedToday;
    const totalCompletedIncrease = (updatedStats.checkups?.totalCompleted || 0) - baselineStats.baselineTotalCompleted;
    
    console.log('\n📈 DASHBOARD VERIFICATION RESULTS:');
    console.log('=====================================');
    console.log(`Completed Today - Baseline: ${baselineStats.baselineCompletedToday}`);
    console.log(`Completed Today - Updated: ${updatedStats.checkups?.completedToday || 0}`);
    console.log(`Completed Today - Increase: ${completedTodayIncrease}`);
    console.log('');
    console.log(`Total Completed - Baseline: ${baselineStats.baselineTotalCompleted}`);
    console.log(`Total Completed - Updated: ${updatedStats.checkups?.totalCompleted || 0}`);
    console.log(`Total Completed - Increase: ${totalCompletedIncrease}`);
    console.log('');
    
    // Check if vaccination was counted
    if (completedTodayIncrease >= 1) {
      console.log('✅ SUCCESS: Vaccination completion was counted in "Completed Today"');
    } else {
      console.log('❌ ISSUE: Vaccination completion was NOT counted in "Completed Today"');
    }
    
    if (totalCompletedIncrease >= 1) {
      console.log('✅ SUCCESS: Vaccination completion was counted in "Total Completed"');
    } else {
      console.log('❌ ISSUE: Vaccination completion was NOT counted in "Total Completed"');
    }
    
    // Check trends data
    if (updatedTrends && updatedTrends.data) {
      const today = new Date();
      const todayName = today.toLocaleDateString('en-US', { weekday: 'long' });
      const todayTrend = updatedTrends.data.find(t => t.dayName === todayName);
      
      if (todayTrend && todayTrend.completedCheckups > 0) {
        console.log('✅ SUCCESS: Trends chart shows completed checkups for today');
        console.log(`Today (${todayName}): ${todayTrend.completedCheckups} completed checkups`);
      } else {
        console.log('⚠️  NOTE: Trends chart may not show today\'s data yet (depends on timing)');
      }
    }
    
    return {
      success: completedTodayIncrease >= 1 && totalCompletedIncrease >= 1,
      completedTodayIncrease,
      totalCompletedIncrease,
      updatedStats,
      updatedTrends
    };
  } catch (error) {
    console.error('❌ Failed to verify dashboard updates:', error.message);
    throw error;
  }
};

// Step 6: Check check_in_sessions table directly
const verifyDatabaseState = async (sessionId) => {
  try {
    console.log('\n🗄️ Verifying database state...');
    
    // Check the session status directly
    const sessionData = await makeAuthenticatedRequest('GET', `/checkups/${sessionId}`);
    console.log('Session Status in Database:', {
      id: sessionData.id,
      status: sessionData.status,
      patientId: sessionData.patientId,
      updatedAt: sessionData.updatedAt,
      completedAt: sessionData.completedAt
    });
    
    if (sessionData.status === 'vaccination-completed') {
      console.log('✅ Session status correctly set to "vaccination-completed"');
      return true;
    } else {
      console.log(`❌ Session status is "${sessionData.status}", expected "vaccination-completed"`);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to verify database state:', error.message);
    return false;
  }
};

// Main test function
const runVaccinationDashboardTest = async () => {
  console.log('🧪 VACCINATION DASHBOARD TRACKING TEST');
  console.log('=====================================');
  console.log('Testing if vaccination completions are counted in dashboard stats and charts\n');
  
  try {
    // Step 1: Login
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.error('❌ Test failed: Could not login');
      return;
    }
    
    // Step 2: Get baseline stats
    const baselineStats = await getBaselineStats();
    
    // Step 3: Create test patient and check in
    const { patientId, sessionId, patientName } = await createTestPatientAndCheckIn();
    
    // Step 4: Complete vaccination workflow
    await completeVaccinationWorkflow(sessionId, patientId, patientName);
    
    // Step 5: Verify database state
    const dbStateValid = await verifyDatabaseState(sessionId);
    
    // Step 6: Verify dashboard updates
    const verificationResult = await verifyDashboardUpdates(baselineStats);
    
    // Final summary
    console.log('\n🎯 FINAL TEST SUMMARY:');
    console.log('======================');
    console.log(`Database State: ${dbStateValid ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Dashboard Updates: ${verificationResult.success ? '✅ PASS' : '❌ FAIL'}`);
    
    if (dbStateValid && verificationResult.success) {
      console.log('\n🎉 ALL TESTS PASSED! Vaccination completions are properly tracked in dashboard.');
    } else {
      console.log('\n⚠️  ISSUES DETECTED:');
      if (!dbStateValid) {
        console.log('- Session status not set to "vaccination-completed"');
      }
      if (!verificationResult.success) {
        console.log('- Dashboard stats not properly counting vaccination completions');
      }
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:', error.message);
  }
};

// Run the test
console.log('Starting vaccination dashboard tracking test...');
console.log('Make sure the backend server is running on localhost:5000');
console.log('');

runVaccinationDashboardTest().catch(console.error);