// Test script for debugging patient queue data transfer issue
// This script will test the flow from admin checkups to doctor queue

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Helper function to make authenticated API calls
async function apiCall(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Step 1: Login to get auth token
async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        login: 'admin',
        password: 'admin123'
      })
    });
    
    authToken = response.token;
    console.log('✅ Login successful, token received');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.message);
    return false;
  }
}

// Step 2: Check if we have any patients in the system
async function checkPatients() {
  console.log('👥 Checking patients in system...');
  try {
    const patients = await apiCall('/api/patients');
    console.log(`📊 Found ${patients.length} patients in system`);
    
    if (patients.length > 0) {
      console.log('🔍 Sample patient:', {
        id: patients[0].id,
        name: `${patients[0].firstName} ${patients[0].lastName}`,
        gender: patients[0].gender,
        dateOfBirth: patients[0].dateOfBirth
      });
    }
    
    return patients;
  } catch (error) {
    console.error('❌ Failed to fetch patients:', error.message);
    return [];
  }
}

// Step 3: Create a test check-in session if needed
async function createTestCheckIn(patients) {
  console.log('🏥 Creating test check-in session...');
  
  if (patients.length === 0) {
    console.log('⚠️ No patients found, skipping check-in creation');
    return null;
  }

  try {
    const testPatient = patients[0];
    const checkInData = {
      patientId: testPatient.id,
      checkInMethod: 'staff-assisted',
      serviceType: 'General Checkup',
      priority: 'Normal',
      notes: 'Test check-in for queue debugging'
    };

    const checkIn = await apiCall('/api/checkups/check-in', {
      method: 'POST',
      body: JSON.stringify(checkInData)
    });

    console.log('✅ Test check-in created:', {
      id: checkIn.id,
      patientId: checkIn.patientId,
      status: checkIn.status
    });

    return checkIn;
  } catch (error) {
    console.error('❌ Failed to create test check-in:', error.message);
    return null;
  }
}

// Step 4: Add vital signs to make patient ready for doctor queue
async function addVitalSigns(checkInId) {
  console.log('🩺 Adding vital signs...');
  
  try {
    const vitalSigns = {
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 98.6,
      weight: 70,
      height: 170,
      notes: 'Normal vital signs'
    };

    const response = await apiCall(`/api/checkups/${checkInId}/vital-signs`, {
      method: 'POST',
      body: JSON.stringify(vitalSigns)
    });

    console.log('✅ Vital signs added successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to add vital signs:', error.message);
    return false;
  }
}

// Step 5: Get today's checkups and examine data structure
async function getTodaysCheckups() {
  console.log('📋 Fetching today\'s checkups...');
  
  try {
    const checkups = await apiCall('/api/checkups/today');
    console.log(`📊 Found ${checkups.length} checkups today`);
    
    if (checkups.length > 0) {
      const sampleCheckup = checkups[0];
      console.log('🔍 Sample checkup data structure:');
      console.log(JSON.stringify(sampleCheckup, null, 2));
      
      // Check specifically for patientName and serviceType
      console.log('🎯 Key fields for queue transfer:');
      console.log(`   - patientName: "${sampleCheckup.patientName}"`);
      console.log(`   - serviceType: "${sampleCheckup.serviceType}"`);
      console.log(`   - vitalSignsCollected: ${sampleCheckup.vitalSignsCollected}`);
    }
    
    return checkups;
  } catch (error) {
    console.error('❌ Failed to fetch today\'s checkups:', error.message);
    return [];
  }
}

// Step 6: Test adding patient to doctor queue
async function testAddToQueue(checkup) {
  console.log('🚀 Testing add to doctor queue...');
  
  try {
    const response = await apiCall(`/api/checkups/${checkup.id}/notify-doctor`, {
      method: 'POST'
    });

    console.log('✅ Successfully notified doctor');
    return true;
  } catch (error) {
    console.error('❌ Failed to notify doctor:', error.message);
    return false;
  }
}

// Step 7: Check doctor queue to see if patient appears correctly
async function checkDoctorQueue() {
  console.log('👨‍⚕️ Checking doctor queue...');
  
  try {
    const queue = await apiCall('/api/doctor/queue');
    console.log(`📊 Found ${queue.length} patients in doctor queue`);
    
    if (queue.length > 0) {
      console.log('🔍 Doctor queue entries:');
      queue.forEach((patient, index) => {
        console.log(`   ${index + 1}. Patient: "${patient.patientName || 'MISSING NAME'}"`)
        console.log(`      Service: "${patient.serviceType || 'MISSING SERVICE'}"`)
        console.log(`      Status: "${patient.status}"`)
        console.log(`      ID: ${patient.id}`)
        console.log('      ---');
      });
    }
    
    return queue;
  } catch (error) {
    console.error('❌ Failed to fetch doctor queue:', error.message);
    return [];
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Patient Queue Debug Tests\n');
  
  // Step 1: Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 2: Check patients
  const patients = await checkPatients();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 3: Create test check-in if needed
  let testCheckIn = await createTestCheckIn(patients);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 4: Add vital signs if we created a check-in
  if (testCheckIn) {
    await addVitalSigns(testCheckIn.id);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 5: Get today's checkups and examine structure
  const checkups = await getTodaysCheckups();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 6: Test adding to queue if we have checkups with vital signs
  const readyCheckups = checkups.filter(c => c.vitalSignsCollected);
  if (readyCheckups.length > 0) {
    await testAddToQueue(readyCheckups[0]);
  } else {
    console.log('⚠️ No checkups with vital signs available for queue testing');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Step 7: Check final doctor queue state
  await checkDoctorQueue();
  
  console.log('\n🏁 Test completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test script failed:', error.message);
  process.exit(1);
});
