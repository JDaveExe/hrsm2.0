// Test script to check patient treatment records
const axios = require('axios');

async function testPatientTreatmentRecords() {
  console.log('🔍 Testing Patient Treatment Records...\n');
  
  // Test patient ID 47 (Josuke Joestar - PT-0047)
  const patientId = 47;
  
  try {
    console.log(`📊 Fetching treatment records for Patient ID: ${patientId}`);
    
    const response = await axios.get(`http://localhost:5000/api/checkups/history/${patientId}`);
    
    if (response.status === 200) {
      const records = response.data;
      console.log(`✅ API Response successful`);
      console.log(`📋 Total records found: ${records.length}`);
      
      if (records.length === 0) {
        console.log('❌ No records found for this patient\n');
        
        // Let's check if there are any records at all in the system
        console.log('🔍 Checking all checkup records...');
        const allRecordsResponse = await axios.get('http://localhost:5000/api/checkups');
        console.log(`📋 Total checkups in system: ${allRecordsResponse.data.length}`);
        
        // Filter for this patient
        const patientCheckups = allRecordsResponse.data.filter(checkup => 
          checkup.patientId === patientId || checkup.patientId === '47'
        );
        console.log(`👤 Checkups for patient ${patientId}: ${patientCheckups.length}`);
        
        if (patientCheckups.length > 0) {
          console.log('\n📝 Found checkups for this patient:');
          patientCheckups.forEach((checkup, index) => {
            console.log(`  ${index + 1}. ID: ${checkup.id}, Status: ${checkup.status}, Patient ID: ${checkup.patientId}`);
          });
        }
      } else {
        console.log('\n📝 Treatment Records Found:');
        records.forEach((record, index) => {
          console.log(`\n  ${index + 1}. Record ID: ${record.id}`);
          console.log(`     Patient: ${record.patientName}`);
          console.log(`     Status: ${record.status}`);
          console.log(`     Service Type: ${record.serviceType}`);
          console.log(`     Completed At: ${record.completedAt || 'N/A'}`);
          console.log(`     Chief Complaint: ${record.chiefComplaint || 'N/A'}`);
          console.log(`     Diagnosis: ${record.diagnosis || 'N/A'}`);
          console.log(`     Doctor: ${record.assignedDoctor || 'N/A'}`);
        });
      }
    } else {
      console.log(`❌ API Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error testing patient treatment records:', error.message);
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Also test with different patient IDs to see pattern
async function testMultiplePatients() {
  console.log('\n🔍 Testing Multiple Patients...\n');
  
  const patientIds = [47, 101, 102, 103]; // Test various patient IDs
  
  for (const patientId of patientIds) {
    try {
      const response = await axios.get(`http://localhost:5000/api/checkups/history/${patientId}`);
      console.log(`Patient ${patientId}: ${response.data.length} records`);
    } catch (error) {
      console.log(`Patient ${patientId}: Error - ${error.message}`);
    }
  }
}

// Run the tests
async function runTests() {
  await testPatientTreatmentRecords();
  await testMultiplePatients();
}

runTests().catch(console.error);
