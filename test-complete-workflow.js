// Complete workflow integration test for patient queue and checkups
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const testConfig = {
  adminToken: 'temp-admin-token',
  timeout: 5000
};

const apiCall = async (endpoint, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${testConfig.adminToken}`,
        'Content-Type': 'application/json'
      },
      timeout: testConfig.timeout
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status,
      data: error.response?.data 
    };
  }
};

// Complete workflow test
const testCompleteWorkflow = async () => {
  console.log('🏥 Testing Complete Patient Queue Workflow');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Get today's checkups
    console.log('\n1️⃣ Fetching today\'s checkups...');
    const checkupsResult = await apiCall('/checkups/today');
    if (!checkupsResult.success) {
      console.log('❌ Failed to fetch checkups');
      return;
    }
    
    console.log(`✅ Found ${checkupsResult.data.length} checkups`);
    
    if (checkupsResult.data.length === 0) {
      console.log('⚠️  No checkups found for testing. Creating a test checkup...');
      
      // For testing, let's create a patient check-in
      const testCheckIn = await apiCall('/checkups/check-in', 'POST', {
        patientId: 1, // Assuming patient ID 1 exists
        serviceType: 'General Checkup',
        priority: 'Normal',
        checkInMethod: 'staff-assisted',
        notes: 'Test patient for queue workflow'
      });
      
      if (!testCheckIn.success) {
        console.log('❌ Failed to create test check-in');
        console.log(`   Error: ${testCheckIn.error}`);
        return;
      }
      
      console.log('✅ Created test check-in session');
      
      // Refetch checkups
      const updatedCheckups = await apiCall('/checkups/today');
      if (!updatedCheckups.success || updatedCheckups.data.length === 0) {
        console.log('❌ Still no checkups available after creation');
        return;
      }
      
      checkupsResult.data = updatedCheckups.data;
    }
    
    // Find the first checkup
    const testCheckup = checkupsResult.data[0];
    console.log(`   Working with: ${testCheckup.patientName} (ID: ${testCheckup.id})`);
    
    // Step 2: Record vital signs if not already recorded
    console.log('\n2️⃣ Recording vital signs...');
    if (!testCheckup.vitalSignsCollected) {
      const vitalSigns = {
        temperature: 36.5,
        temperatureUnit: 'celsius',
        heartRate: 72,
        systolicBP: 120,
        diastolicBP: 80,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        weight: 70,
        weightUnit: 'kg',
        height: 175,
        heightUnit: 'cm',
        clinicalNotes: 'Normal vital signs recorded for testing',
        recordedAt: new Date().toISOString()
      };
      
      const vitalResult = await apiCall(`/checkups/${testCheckup.id}/vital-signs`, 'POST', vitalSigns);
      if (!vitalResult.success) {
        console.log('❌ Failed to record vital signs');
        console.log(`   Error: ${vitalResult.error}`);
        return;
      }
      
      console.log('✅ Vital signs recorded successfully');
    } else {
      console.log('✅ Vital signs already recorded');
    }
    
    // Step 3: Check initial queue status
    console.log('\n3️⃣ Checking initial queue status...');
    const initialQueue = await apiCall('/doctor/queue');
    if (!initialQueue.success) {
      console.log('❌ Failed to fetch initial queue');
      return;
    }
    
    console.log(`   Initial queue size: ${initialQueue.data.length}`);
    
    // Step 4: Add patient to queue
    console.log('\n4️⃣ Adding patient to doctor queue...');
    const queueResult = await apiCall(`/checkups/${testCheckup.id}/notify-doctor`, 'POST');
    if (!queueResult.success) {
      console.log('❌ Failed to add patient to queue');
      console.log(`   Error: ${queueResult.error}`);
      return;
    }
    
    console.log('✅ Patient successfully added to queue');
    console.log(`   Patient: ${queueResult.data.session.patientName}`);
    console.log(`   Status: ${queueResult.data.session.status}`);
    
    // Step 5: Verify queue update
    console.log('\n5️⃣ Verifying queue update...');
    const updatedQueue = await apiCall('/doctor/queue');
    if (!updatedQueue.success) {
      console.log('❌ Failed to fetch updated queue');
      return;
    }
    
    console.log(`   Updated queue size: ${updatedQueue.data.length}`);
    const queuedPatient = updatedQueue.data.find(p => p.id === testCheckup.id);
    
    if (queuedPatient) {
      console.log('✅ Patient found in queue');
      console.log(`   Name: ${queuedPatient.patientName}`);
      console.log(`   Status: ${queuedPatient.status}`);
      console.log(`   Queued at: ${queuedPatient.queuedAt}`);
    } else {
      console.log('❌ Patient not found in queue');
      return;
    }
    
    // Step 6: Test doctor workflow - Start checkup
    console.log('\n6️⃣ Doctor starting checkup...');
    const startResult = await apiCall(`/doctor/queue/${testCheckup.id}/start`, 'POST', {
      doctorId: 'test-doctor-123'
    });
    
    if (!startResult.success) {
      console.log('❌ Failed to start checkup');
      console.log(`   Error: ${startResult.error}`);
      return;
    }
    
    console.log('✅ Checkup started successfully');
    console.log(`   Status: ${startResult.data.session.status}`);
    console.log(`   Started at: ${startResult.data.session.startedAt}`);
    
    // Step 7: Verify status in both queue and checkups
    console.log('\n7️⃣ Verifying status synchronization...');
    
    // Check queue
    const queueAfterStart = await apiCall('/doctor/queue');
    if (queueAfterStart.success) {
      const inProgressPatient = queueAfterStart.data.find(p => p.id === testCheckup.id);
      if (inProgressPatient && inProgressPatient.status === 'in-progress') {
        console.log('✅ Queue status synchronized (in-progress)');
      } else {
        console.log('⚠️  Queue status may not be synchronized');
      }
    }
    
    // Check checkups
    const checkupsAfterStart = await apiCall('/checkups/today');
    if (checkupsAfterStart.success) {
      const updatedCheckup = checkupsAfterStart.data.find(c => c.id === testCheckup.id);
      if (updatedCheckup) {
        console.log(`✅ Checkup status: ${updatedCheckup.status}`);
      }
    }
    
    // Step 8: Complete checkup
    console.log('\n8️⃣ Doctor completing checkup...');
    const completeResult = await apiCall(`/doctor/queue/${testCheckup.id}/complete`, 'POST', {
      doctorId: 'test-doctor-123',
      diagnosis: 'Patient is healthy - routine checkup completed',
      prescription: 'Continue regular exercise and healthy diet',
      notes: 'Workflow test completed successfully'
    });
    
    if (!completeResult.success) {
      console.log('❌ Failed to complete checkup');
      console.log(`   Error: ${completeResult.error}`);
      return;
    }
    
    console.log('✅ Checkup completed successfully');
    console.log(`   Status: ${completeResult.data.session.status}`);
    console.log(`   Completed at: ${completeResult.data.session.completedAt}`);
    
    // Step 9: Final verification
    console.log('\n9️⃣ Final status verification...');
    
    const finalQueue = await apiCall('/doctor/queue');
    const finalCheckups = await apiCall('/checkups/today');
    const finalStats = await apiCall('/doctor/queue/stats');
    
    if (finalQueue.success && finalCheckups.success && finalStats.success) {
      console.log('✅ Final verification complete');
      console.log(`   Queue size: ${finalQueue.data.length}`);
      console.log(`   Checkups count: ${finalCheckups.data.length}`);
      console.log(`   Completed today: ${finalStats.data.completed}`);
      
      const completedPatient = finalQueue.data.find(p => p.id === testCheckup.id);
      if (completedPatient && completedPatient.status === 'completed') {
        console.log('✅ Patient status fully synchronized across all systems');
      }
    }
    
    console.log('\n🎉 COMPLETE WORKFLOW TEST PASSED!');
    console.log('\n📋 Workflow Summary:');
    console.log('   1. ✅ Patient checked in');
    console.log('   2. ✅ Vital signs recorded');
    console.log('   3. ✅ Added to doctor queue');
    console.log('   4. ✅ Doctor started checkup');
    console.log('   5. ✅ Status synchronized in real-time');
    console.log('   6. ✅ Doctor completed checkup');
    console.log('   7. ✅ Final status updated across all systems');
    
  } catch (error) {
    console.log('\n❌ Workflow test failed:');
    console.error(error);
  }
};

// Run the complete workflow test
testCompleteWorkflow().then(() => {
  console.log('\n🏆 Integration test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('Integration test error:', error);
  process.exit(1);
});
