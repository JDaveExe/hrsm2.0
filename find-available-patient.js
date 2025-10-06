const axios = require('axios');

async function findAvailablePatientForTesting() {
  console.log('🧪 Finding Available Patient for Testing...\n');
  
  const baseURL = 'http://localhost:5000/api';
  const authHeaders = {
    'Authorization': 'Bearer temp-admin-token',
    'Content-Type': 'application/json'
  };

  try {
    console.log('1️⃣  Getting all patients...');
    const patientsResponse = await axios.get(`${baseURL}/patients`, {
      headers: authHeaders
    });

    console.log(`📊 Total patients: ${patientsResponse.data.length}`);

    console.log('\n2️⃣  Getting today\'s checked-in patients...');
    const todayResponse = await axios.get(`${baseURL}/checkups/today`, {
      headers: authHeaders
    });

    const checkedInPatientIds = todayResponse.data.map(session => session.patientId);
    console.log(`📋 Checked-in patients today: ${checkedInPatientIds.length}`);
    console.log(`   IDs: ${checkedInPatientIds.join(', ')}`);

    console.log('\n3️⃣  Finding available patients...');
    const availablePatients = patientsResponse.data.filter(patient => 
      !checkedInPatientIds.includes(patient.id) && patient.isActive
    );

    console.log(`✅ Available patients: ${availablePatients.length}`);
    
    if (availablePatients.length > 0) {
      console.log('\n📋 First 5 available patients:');
      availablePatients.slice(0, 5).forEach((patient, index) => {
        console.log(`   ${index + 1}. ID: ${patient.id}, Name: ${patient.firstName} ${patient.lastName}`);
      });
      
      return availablePatients[0];
    } else {
      console.log('\n⚠️  No available patients found for testing.');
      return null;
    }

  } catch (error) {
    console.error('❌ Error finding available patients:', error.response?.data || error.message);
    return null;
  }
}

// Run the search
findAvailablePatientForTesting().then(patient => {
  if (patient) {
    console.log(`\n🎯 Ready to test with: ID ${patient.id} - ${patient.firstName} ${patient.lastName}`);
    console.log('📝 Use this patient for the next check-in test.');
  } else {
    console.log('\n💥 No available patients for testing.');
  }
}).catch(error => {
  console.error('💥 Search failed:', error);
});