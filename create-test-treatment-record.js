// Script to create test treatment records for patient 47 (Josuke Joestar)
const axios = require('axios');

async function createTestTreatmentRecord() {
  console.log('🏥 Creating test treatment record for Patient 47 (Josuke Joestar)...\n');
  
  try {
    // Let's first check if we can find any existing sessions for this patient
    console.log('� Step 1: Checking existing sessions...');
    
    // Try to find any checkup sessions (check different endpoints)
    const endpoints = [
      '/api/checkups/today',
      '/api/checkups',
      '/api/checkups/all'
    ];
    
    let allSessions = [];
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint}`);
        console.log(`✅ Found ${response.data.length} sessions at ${endpoint}`);
        allSessions = response.data;
        break;
      } catch (error) {
        console.log(`❌ ${endpoint} not found`);
      }
    }
    
    if (allSessions.length === 0) {
      console.log('❌ No existing sessions found. Let\'s create one using direct database approach...');
      
      // Instead of API, let's manually create a record using SQL
      console.log('📝 Creating manual test record...');
      
      const testRecord = {
        method: 'POST',
        url: 'http://localhost:5000/api/checkups/manual-create',
        data: {
          patientId: 47,
          patientName: 'Josuke Joestar',
          serviceType: 'general',
          status: 'completed',
          completedAt: new Date().toISOString(),
          chiefComplaint: 'Routine health checkup and wellness assessment',
          presentSymptoms: 'No specific symptoms reported, feeling generally well',
          diagnosis: 'Healthy individual with no acute issues identified',
          treatmentPlan: 'Continue current lifestyle, recommended annual follow-up',
          doctorNotes: 'Patient appears to be in good health. All systems normal.',
          assignedDoctor: 'Dr. Test Physician',
          prescriptions: JSON.stringify([
            {
              medication: 'Multivitamin',
              quantity: '30 tablets',
              instructions: 'Take 1 tablet daily with breakfast',
              genericName: 'Multi-vitamin complex'
            }
          ])
        }
      };
      
      try {
        const createResponse = await axios(testRecord);
        console.log('✅ Test record created successfully');
      } catch (error) {
        console.log('❌ Manual creation failed, trying alternative approach...');
        
        // Alternative: Let's try to update an existing session to completed
        console.log('🔄 Looking for existing sessions to convert...');
        
        // Get all sessions and find one for patient 47
        try {
          const allResponse = await axios.get('http://localhost:5000/api/checkups/history/47');
          console.log(`Found ${allResponse.data.length} existing records for patient 47`);
          
          if (allResponse.data.length === 0) {
            console.log('💡 No existing records. Let\'s use the database directly...');
            console.log('📋 Please run this SQL query in your database:');
            console.log(`
INSERT INTO CheckInSessions (
  patientId, patientName, serviceType, status, 
  completedAt, chiefComplaint, presentSymptoms, 
  diagnosis, treatmentPlan, doctorNotes, assignedDoctor,
  prescription, createdAt, updatedAt
) VALUES (
  47, 'Josuke Joestar', 'general', 'completed',
  '${new Date().toISOString()}', 
  'Routine health checkup and wellness assessment',
  'No specific symptoms reported, feeling generally well',
  'Healthy individual with no acute issues identified',
  'Continue current lifestyle, recommended annual follow-up',
  'Patient appears to be in good health. All systems normal.',
  'Dr. Test Physician',
  '[{"medication":"Multivitamin","quantity":"30 tablets","instructions":"Take 1 tablet daily with breakfast","genericName":"Multi-vitamin complex"}]',
  '${new Date().toISOString()}',
  '${new Date().toISOString()}'
);
            `);
          }
        } catch (historyError) {
          console.log('❌ Could not access history endpoint');
        }
      }
    } else {
      console.log('🎯 Found existing sessions. Let\'s check if any belong to patient 47...');
      const patient47Sessions = allSessions.filter(s => 
        s.patientId === 47 || s.patientId === '47'
      );
      
      console.log(`📋 Sessions for patient 47: ${patient47Sessions.length}`);
      
      if (patient47Sessions.length > 0) {
        // Try to complete one of the sessions
        const session = patient47Sessions[0];
        console.log(`🔄 Converting session ${session.id} to completed...`);
        
        try {
          await axios.put(`http://localhost:5000/api/checkups/${session.id}/status`, {
            status: 'completed',
            completedAt: new Date().toISOString(),
            doctorName: 'Dr. Test Physician'
          });
          console.log('✅ Session completed successfully');
        } catch (statusError) {
          console.log('❌ Could not update session status');
        }
      }
    }
    
    // Final verification
    console.log('\n🔍 Final verification...');
    try {
      const finalCheck = await axios.get('http://localhost:5000/api/checkups/history/47');
      console.log(`� Final count of treatment records for patient 47: ${finalCheck.data.length}`);
      
      if (finalCheck.data.length > 0) {
        console.log('🎉 Success! Treatment records are now available.');
        finalCheck.data.forEach((record, index) => {
          console.log(`   ${index + 1}. Status: ${record.status}, Completed: ${record.completedAt || 'N/A'}`);
        });
      }
    } catch (error) {
      console.log('❌ Could not verify final results');
    }
    
  } catch (error) {
    console.error('❌ Error in test script:', error.message);
  }
}

createTestTreatmentRecord().catch(console.error);
