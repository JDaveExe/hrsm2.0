const axios = require('axios');

async function checkPatientLoginSystem() {
  console.log('🔍 Checking patient login system and ID formats...\n');
  
  try {
    // Test the patient login endpoint that we know works
    console.log('🧪 Testing patient login system...');
    
    const testPatientIds = ['113', '134', '0113', '0134', 'PT-0113', 'PT-0134'];
    
    for (const patientId of testPatientIds) {
      try {
        console.log(`\n🔐 Testing login with ID: ${patientId}`);
        
        const loginResponse = await axios.post('http://localhost:5000/api/auth/patient-login', {
          patientId: patientId
        });
        
        if (loginResponse.data) {
          console.log(`✅ Login successful for ${patientId}:`, {
            id: loginResponse.data.patient?.id,
            patientId: loginResponse.data.patient?.patientId,
            name: `${loginResponse.data.patient?.firstName} ${loginResponse.data.patient?.lastName}`,
            token: loginResponse.data.token ? 'Present' : 'Missing'
          });
          
          // Store this info for notification testing
          const patientInfo = loginResponse.data.patient;
          console.log(`📋 Patient info for notifications:`, {
            useThisId: patientInfo.id,
            patientId: patientInfo.patientId,
            databaseId: patientInfo.id
          });
        }
        
      } catch (error) {
        console.log(`❌ Login failed for ${patientId}:`, error.response?.status, error.response?.data?.message);
      }
    }
    
    // Check the database structure
    console.log('\n🗄️ Checking database structure with admin token...');
    
    try {
      // First get admin token
      const adminLogin = await axios.post('http://localhost:5000/api/auth/admin-login', {
        username: 'admin',
        password: 'admin123' // Default admin password
      });
      
      if (adminLogin.data.token) {
        console.log('✅ Admin login successful');
        
        // Get patient list
        const patientsResponse = await axios.get('http://localhost:5000/api/patients', {
          headers: { Authorization: `Bearer ${adminLogin.data.token}` }
        });
        
        console.log('\n📊 Patient database structure:');
        patientsResponse.data.slice(0, 5).forEach(patient => {
          console.log(`  ID: ${patient.id}, PatientID: ${patient.patientId}, Name: ${patient.firstName} ${patient.lastName}`);
        });
        
        // Look specifically for our test patients
        const kaleia = patientsResponse.data.find(p => p.firstName === 'Kaleia' && p.lastName === 'Aris');
        const derick = patientsResponse.data.find(p => p.firstName === 'Derick');
        
        if (kaleia) {
          console.log(`\n👤 Kaleia Aris found:`, {
            databaseId: kaleia.id,
            patientId: kaleia.patientId,
            useForNotifications: kaleia.id
          });
        }
        
        if (derick) {
          console.log(`👤 Derick found:`, {
            databaseId: derick.id,
            patientId: derick.patientId,
            useForNotifications: derick.id
          });
        }
      }
      
    } catch (adminError) {
      console.log('❌ Admin login failed:', adminError.response?.data?.message);
    }
    
    console.log('\n💡 SOLUTION RECOMMENDATIONS:');
    console.log('1. Use the database ID (not patientId) for notifications');
    console.log('2. When admin creates notification, convert PT-0113 to database ID');
    console.log('3. When patient logs in, store the database ID for notification matching');
    console.log('4. Update notification filtering to use consistent ID format');
    
  } catch (error) {
    console.error('❌ Error during patient login testing:', error.message);
  }
}

checkPatientLoginSystem();