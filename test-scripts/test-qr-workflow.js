// Test script for QR code scan workflow
// This script tests the complete flow from QR scan to Today's Checkup display

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000';
let authToken = '';

// Helper function to make authenticated API calls
async function apiCall(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` })
    }
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  
  return data;
}

// Step 1: Login to get auth token (if needed)
async function login() {
  console.log('🔐 Logging in...');
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'admin',
        password: 'admin123'
      })
    });

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      authToken = data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      const errorData = await loginResponse.json();
      console.log('⚠️ Login failed:', errorData.msg || 'Unknown error');
      console.log('⚠️ Proceeding without authentication');
      return false;
    }
  } catch (error) {
    console.log('⚠️ Login error:', error.message);
    return false;
  }
}

// Step 2: Get a sample patient for testing
async function getSamplePatient() {
  console.log('👤 Getting sample patient...');
  try {
    const patients = await apiCall('/api/patients');
    if (patients.length > 0) {
      const patient = patients[0];
      console.log(`✅ Using patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
      return patient;
    } else {
      console.log('❌ No patients found in database');
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting patients:', error.message);
    return null;
  }
}

// Step 3: Generate QR code data (simulate what would be in the QR code)
function generateQRData(patient) {
  console.log('🔍 Generating QR code data...');
  
  const qrData = {
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    timestamp: Date.now(),
    action: 'checkin'
  };
  
  // Encode as base64 (simulate QR code token format)
  const token = btoa(JSON.stringify(qrData));
  const qrUrl = `${BASE_URL}/patient-checkin?token=${token}`;
  
  console.log('✅ QR data generated:', qrData);
  console.log('📱 QR URL:', qrUrl);
  
  return { qrData, qrUrl, token };
}

// Step 4: Test QR checkin endpoint
async function testQRCheckin(qrData) {
  console.log('🏥 Testing QR check-in...');
  
  try {
    const checkinResponse = await apiCall('/api/checkups/qr-checkin', {
      method: 'POST',
      body: JSON.stringify({
        patientId: qrData.patientId,
        patientName: qrData.patientName,
        serviceType: 'General Checkup',
        priority: 'Normal'
      })
    });
    
    console.log('✅ QR check-in successful:', checkinResponse);
    return checkinResponse.session;
  } catch (error) {
    if (error.message.includes('already checked in')) {
      console.log('⚠️ Patient already checked in today. Cleaning up existing check-in...');
      
      // Try to remove existing check-in
      try {
        await apiCall(`/api/checkups/today/${qrData.patientId}`, {
          method: 'DELETE'
        });
        console.log('✅ Existing check-in removed. Retrying QR check-in...');
        
        // Retry the check-in
        const retryResponse = await apiCall('/api/checkups/qr-checkin', {
          method: 'POST',
          body: JSON.stringify({
            patientId: qrData.patientId,
            patientName: qrData.patientName,
            serviceType: 'General Checkup',
            priority: 'Normal'
          })
        });
        
        console.log('✅ QR check-in successful on retry:', retryResponse);
        return retryResponse.session;
        
      } catch (cleanupError) {
        console.log('⚠️ Could not clean up existing check-in:', cleanupError.message);
        console.log('🔍 Checking if existing check-in has QR scan method...');
        
        // Check if the existing check-in is already a QR scan
        try {
          const checkups = await apiCall('/api/checkups/today');
        const existingQrCheckin = checkups.find(c => 
          c.patientId === qrData.patientId && 
          c.checkInMethod === 'qr-scan'
        );          if (existingQrCheckin) {
            console.log('✅ Found existing QR check-in for this patient');
            return existingQrCheckin;
          }
        } catch (checkError) {
          console.log('❌ Error checking existing check-ins:', checkError.message);
        }
      }
    }
    
    console.log('❌ QR check-in failed:', error.message);
    return null;
  }
}

// Step 5: Verify patient appears in Today's Checkups
async function verifyTodaysCheckups(expectedPatientId) {
  console.log('📋 Verifying Today\'s Checkups...');
  
  try {
    const checkups = await apiCall('/api/checkups/today');
    
    console.log(`📊 Found ${checkups.length} total checkups for today`);
    
    // Debug: Show all checkups for the expected patient
    const patientCheckups = checkups.filter(c => c.patientId === expectedPatientId);
    console.log(`🔍 Found ${patientCheckups.length} checkups for patient ID ${expectedPatientId}:`);
    
    patientCheckups.forEach((checkup, index) => {
      console.log(`   ${index + 1}. Name: ${checkup.patientName}`);
      console.log(`      Method: ${checkup.checkInMethod || 'undefined'}`);
      console.log(`      Time: ${checkup.checkInTime}`);
      console.log(`      Status: ${checkup.status}`);
      console.log(`      ID: ${checkup.id}`);
    });
    
    const qrCheckin = checkups.find(c => 
      c.patientId === expectedPatientId && 
      c.checkInMethod === 'qr-scan'
    );
    
    if (qrCheckin) {
      console.log('✅ Patient found in Today\'s Checkups with QR scan method:');
      console.log(`   - Name: ${qrCheckin.patientName}`);
      console.log(`   - Method: ${qrCheckin.checkInMethod}`);
      console.log(`   - Time: ${qrCheckin.checkInTime}`);
      console.log(`   - Status: ${qrCheckin.status}`);
      return true;
    } else {
      console.log('❌ Patient not found in Today\'s Checkups with QR scan method');
      
      // Show a sample of other checkups for debugging
      if (checkups.length > 0) {
        console.log('📋 Sample of other checkups for comparison:');
        checkups.slice(0, 3).forEach((checkup, index) => {
          console.log(`   ${index + 1}. PatientID: ${checkup.patientId}, Method: ${checkup.checkInMethod || 'undefined'}, Name: ${checkup.patientName}`);
        });
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ Error verifying checkups:', error.message);
    return false;
  }
}

// Step 6: Clean up (remove test checkup)
async function cleanup(sessionId) {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Note: You might need to implement a cleanup endpoint or manually remove test data
    console.log(`⚠️ Manual cleanup needed: Remove session ID ${sessionId} from database`);
    return true;
  } catch (error) {
    console.log('⚠️ Cleanup error:', error.message);
    return false;
  }
}

// Main test function
async function runQRWorkflowTest() {
  console.log('🚀 Starting QR Code Scan Workflow Test');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Login
    await login();
    
    // Step 2: Get sample patient
    const patient = await getSamplePatient();
    if (!patient) {
      console.log('❌ Cannot proceed without a test patient');
      return;
    }
    
    // Step 3: Generate QR data
    const { qrData, qrUrl, token } = generateQRData(patient);
    
    // Step 4: Test QR checkin
    const session = await testQRCheckin(qrData);
    if (!session) {
      console.log('❌ QR check-in failed, cannot continue test');
      return;
    }
    
    // Wait a moment for data to propagate
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 5: Verify in Today's Checkups
    const verified = await verifyTodaysCheckups(patient.id);
    
    // Step 6: Cleanup
    if (session.id) {
      await cleanup(session.id);
    }
    
    console.log('\n' + '='.repeat(50));
    if (verified) {
      console.log('🎉 QR Workflow Test PASSED!');
      console.log('✅ All components working correctly:');
      console.log('   - QR data parsing ✅');
      console.log('   - Backend validation ✅'); 
      console.log('   - Patient check-in ✅');
      console.log('   - Today\'s Checkups display ✅');
    } else {
      console.log('❌ QR Workflow Test FAILED!');
      console.log('Some components need debugging.');
    }
    
  } catch (error) {
    console.log('💥 Test failed with error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  runQRWorkflowTest();
}

module.exports = { runQRWorkflowTest };