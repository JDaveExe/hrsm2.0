const axios = require('axios');

async function checkAvailablePatients() {
  console.log('🧪 Checking Available Patients...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('🔍 Fetching patients...');
    
    const patientsResponse = await axios.get(`${baseURL}/patients`, {
      headers: authHeaders
    });

    console.log('✅ Patients found!');
    console.log(`📊 Total patients: ${patientsResponse.data.length || 'unknown'}`);
    
    if (patientsResponse.data.length > 0) {
      console.log('\n📋 First 5 patients:');
      patientsResponse.data.slice(0, 5).forEach((patient, index) => {
        console.log(`   ${index + 1}. ID: ${patient.id}, Name: ${patient.firstName} ${patient.lastName}`);
        console.log(`      Active: ${patient.isActive}, Created: ${patient.createdAt}`);
      });
      
      return patientsResponse.data[0]; // Return first patient for testing
    } else {
      console.log('⚠️  No patients found in database');
      return null;
    }

  } catch (error) {
    console.error('❌ Error fetching patients:');
    console.error('   Status:', error.response?.status);
    console.error('   Data:', error.response?.data);
    console.error('   Message:', error.message);
    return null;
  }
}

// Run the check
checkAvailablePatients().then(patient => {
  if (patient) {
    console.log(`\n🎯 Ready to test with patient ID: ${patient.id} (${patient.firstName} ${patient.lastName})`);
  } else {
    console.log('\n💥 No patients available for testing');
  }
}).catch(error => {
  console.error('💥 Check failed:', error);
});