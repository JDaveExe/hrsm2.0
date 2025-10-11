const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function apiCall(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.message,
      details: error.response?.data 
    };
  }
}

async function testCompleteCheckup() {
  console.log('🏥 Testing Simple Checkup Completion');
  console.log('====================================');
  
  try {
    // Get ongoing checkups
    console.log('\n1️⃣ Fetching ongoing checkups...');
    const ongoingResult = await apiCall('/checkups/doctor');
    
    if (!ongoingResult.success) {
      console.log('❌ Failed to fetch ongoing checkups');
      console.log(`   Error: ${ongoingResult.error}`);
      return;
    }
    
    console.log(`✅ Found ${ongoingResult.data.length} total checkups`);
    
    // Filter for ongoing checkups
    const ongoingCheckups = ongoingResult.data.filter(c => c.status === 'in-progress' || c.status === 'started');
    console.log(`   ${ongoingCheckups.length} ongoing checkups`);
    
    if (ongoingCheckups.length === 0) {
      console.log('ℹ️ No ongoing checkups found. Let\'s check today\'s checkups...');
      
      const todayResult = await apiCall('/checkups/today');
      if (todayResult.success && todayResult.data.length > 0) {
        const testCheckup = todayResult.data.find(c => c.status === 'in-progress' || c.status === 'started') || todayResult.data[0];
        console.log(`   Found checkup: ${testCheckup.patientName} (Status: ${testCheckup.status})`);
        
        // Try to start this checkup if it's in the queue
        if (testCheckup.status === 'doctor-notified') {
          console.log('\n2️⃣ Starting checkup first...');
          const startResult = await apiCall(`/doctor/queue/${testCheckup.id}/start`, 'POST', {
            doctorId: 'test-doctor-123'
          });
          
          if (startResult.success) {
            console.log('✅ Checkup started successfully');
            console.log('   Now we have an ongoing checkup to complete...');
            
            // Get updated ongoing checkups
            const updatedOngoingResult = await apiCall('/checkups/status/in-progress');
            if (updatedOngoingResult.success && updatedOngoingResult.data.length > 0) {
              const ongoingCheckup = updatedOngoingResult.data[0];
              await completeCheckup(ongoingCheckup);
            }
          } else {
            console.log('❌ Failed to start checkup');
            console.log(`   Error: ${startResult.error}`);
            if (startResult.details) {
              console.log(`   Details:`, startResult.details);
            }
          }
        }
      } else {
        console.log('❌ No checkups found for today');
      }
      return;
    }
    
    // Use the first ongoing checkup for testing
    const testCheckup = ongoingResult.data[0];
    await completeCheckup(testCheckup);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function completeCheckup(checkup) {
  console.log(`\n🎯 Completing checkup for: ${checkup.patientName}`);
  console.log(`   Checkup ID: ${checkup.id}`);
  console.log(`   Current Status: ${checkup.status}`);
  
  // Step 1: Update clinical notes
  console.log('\n3️⃣ Recording clinical notes...');
  const clinicalData = {
    chiefComplaint: 'Patient complains of mild headache and fatigue',
    presentSymptoms: 'Headache (mild), fatigue, slightly elevated temperature',
    diagnosis: 'Viral syndrome - common cold',
    treatmentPlan: 'Rest, increase fluid intake, paracetamol for symptomatic relief',
    doctorNotes: 'Patient appears well. Vital signs stable. Symptoms consistent with viral upper respiratory infection. Advised to return if symptoms worsen or persist beyond 7 days.'
  };
  
  const notesResult = await apiCall(`/checkups/${checkup.id}/notes`, 'PUT', clinicalData);
  
  if (!notesResult.success) {
    console.log('❌ Failed to record clinical notes');
    console.log(`   Error: ${notesResult.error}`);
    return;
  }
  
  console.log('✅ Clinical notes recorded successfully');
  
  // Step 2: Complete the checkup
  console.log('\n4️⃣ Completing checkup...');
  const completeResult = await apiCall(`/checkups/${checkup.id}/status`, 'PUT', {
    status: 'completed',
    completedAt: new Date().toISOString()
  });
  
  if (!completeResult.success) {
    console.log('❌ Failed to complete checkup');
    console.log(`   Error: ${completeResult.error}`);
    return;
  }
  
  console.log('✅ Checkup completed successfully');
  console.log(`   Status: ${completeResult.data.status}`);
  console.log(`   Completed at: ${completeResult.data.completedAt}`);
  
  // Step 3: Verify the checkup moved to finished
  console.log('\n5️⃣ Verifying checkup moved to finished...');
  const finishedResult = await apiCall('/checkups/status/completed');
  
  if (finishedResult.success) {
    const completedCheckup = finishedResult.data.find(c => c.id === checkup.id);
    if (completedCheckup) {
      console.log('✅ Checkup found in finished section');
      console.log(`   Patient: ${completedCheckup.patientName}`);
      console.log(`   Chief Complaint: ${completedCheckup.chiefComplaint || 'Not recorded'}`);
      console.log(`   Diagnosis: ${completedCheckup.diagnosis || 'Not recorded'}`);
    } else {
      console.log('❌ Checkup not found in finished section');
    }
  }
  
  // Step 4: Check if it appears in history
  console.log('\n6️⃣ Checking history section...');
  const historyResult = await apiCall('/checkups/history');
  
  if (historyResult.success) {
    const historyCheckup = historyResult.data.find(c => c.id === checkup.id);
    if (historyCheckup) {
      console.log('✅ Checkup found in history section');
      console.log(`   Patient: ${historyCheckup.patientName}`);
      console.log(`   Clinical notes preserved: ${!!historyCheckup.chiefComplaint}`);
    } else {
      console.log('❌ Checkup not found in history section');
    }
  }
  
  console.log('\n🎉 Checkup completion test finished!');
}

// Run the test
testCompleteCheckup();
