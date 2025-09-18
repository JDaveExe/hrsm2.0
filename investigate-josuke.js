// Diagnostic script to investigate Josuke Joestar patient data
const axios = require('axios');

async function investigateJosukeJoestar() {
  console.log('🔍 Investigating Josuke Joestar Patient Data...\n');
  
  try {
    // Test 1: Check both patient IDs
    console.log('📋 Test 1: Checking treatment records for both patient IDs');
    
    const ids = [40, 47];
    for (const id of ids) {
      try {
        const response = await axios.get(`http://localhost:5000/api/checkups/history/${id}`);
        console.log(`Patient ID ${id}: ${response.data.length} treatment records`);
        if (response.data.length > 0) {
          const record = response.data[0];
          console.log(`  - Patient Name: ${record.patientName}`);
          console.log(`  - Status: ${record.status}`);
          console.log(`  - Completed: ${record.completedAt || 'N/A'}`);
          console.log(`  - Age: ${record.age || 'N/A'}`);
        }
      } catch (error) {
        console.log(`Patient ID ${id}: Error - ${error.message}`);
      }
      console.log('');
    }
    
    // Test 2: Search all checkup sessions for Josuke
    console.log('📋 Test 2: Searching all checkup sessions for "Josuke"');
    try {
      const todayResponse = await axios.get('http://localhost:5000/api/checkups/today');
      const josukesSessions = todayResponse.data.filter(session => 
        session.patientName && session.patientName.toLowerCase().includes('josuke')
      );
      
      console.log(`Found ${josukesSessions.length} checkup sessions with "Josuke" in name:`);
      josukesSessions.forEach((session, index) => {
        console.log(`  ${index + 1}. Session ID: ${session.id}, Patient ID: ${session.patientId}, Name: ${session.patientName}, Status: ${session.status}`);
      });
    } catch (error) {
      console.log('Error searching sessions:', error.message);
    }
    
    console.log('\n📋 Test 3: Checking what user data is being passed to patient portal');
    console.log('(This would come from your authentication/login context)');
    
    // Test 4: Check all patients endpoint if available
    console.log('\n📋 Test 4: Trying to list all patients (if endpoint exists)');
    const patientEndpoints = [
      '/api/patients',
      '/api/patient',
      '/api/users'
    ];
    
    for (const endpoint of patientEndpoints) {
      try {
        const response = await axios.get(`http://localhost:5000${endpoint}`);
        const josukesInDb = response.data.filter(patient => 
          (patient.firstName && patient.firstName.toLowerCase().includes('josuke')) ||
          (patient.name && patient.name.toLowerCase().includes('josuke'))
        );
        
        console.log(`${endpoint}: Found ${josukesInDb.length} Josuke(s)`);
        josukesInDb.forEach((patient, index) => {
          console.log(`  ${index + 1}. ID: ${patient.id}, Name: ${patient.firstName || patient.name} ${patient.lastName || ''}, DOB: ${patient.dateOfBirth || 'N/A'}`);
        });
        break;
      } catch (error) {
        console.log(`${endpoint}: Not available`);
      }
    }
    
  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  }
}

investigateJosukeJoestar().catch(console.error);
