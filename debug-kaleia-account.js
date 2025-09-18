const axios = require('axios');

async function investigateKaleiaAccount() {
  console.log('🔍 Investigating Kaleia Aris account...\n');

  const baseURL = 'http://localhost:5000';
  
  try {
    // Step 1: Get Kaleia's patient info from admin side
    console.log('📋 Step 1: Getting admin access...');
    const adminLogin = await axios.post(`${baseURL}/api/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');

    // Step 2: Find Kaleia in patients database
    console.log('\n📋 Step 2: Finding Kaleia in patients database...');
    const patientsResponse = await axios.get(`${baseURL}/api/patients`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const kaleiaPatient = patientsResponse.data.find(p => 
      p.firstName?.toLowerCase().includes('kaleia') && 
      p.lastName?.toLowerCase().includes('aris')
    );
    
    if (kaleiaPatient) {
      console.log('✅ Found Kaleia in patients database:');
      console.log('   Patient ID:', kaleiaPatient.id);
      console.log('   User ID:', kaleiaPatient.userId);
      console.log('   Email:', kaleiaPatient.email);
      console.log('   Date of Birth:', kaleiaPatient.dateOfBirth);
      console.log('   Full Name:', kaleiaPatient.fullName);
    } else {
      console.log('❌ Kaleia not found in patients database');
      return;
    }

    // Step 3: Try to login as Kaleia using her credentials
    console.log('\n📋 Step 3: Testing Kaleia\'s login credentials...');
    try {
      const kaleiaLogin = await axios.post(`${baseURL}/api/auth/login`, {
        login: kaleiaPatient.email,
        password: '22-01-2004'
      });
      
      console.log('✅ Kaleia login successful:');
      console.log('   User ID:', kaleiaLogin.data.user.id);
      console.log('   Patient ID:', kaleiaLogin.data.user.patientId);
      console.log('   Name:', kaleiaLogin.data.user.firstName, kaleiaLogin.data.user.lastName);
      
      const kaleiaToken = kaleiaLogin.data.token;
      const kaleiaPatientId = kaleiaLogin.data.user.patientId;
      
      // Step 4: Check for treatment records using Kaleia's credentials
      console.log('\n📋 Step 4: Checking treatment records...');
      try {
        const recordsResponse = await axios.get(`${baseURL}/api/checkups/history/${kaleiaPatientId}`, {
          headers: { Authorization: `Bearer ${kaleiaToken}` }
        });
        
        console.log('✅ Treatment records API response:');
        console.log('   Records found:', recordsResponse.data.length);
        recordsResponse.data.forEach((record, index) => {
          console.log(`   ${index + 1}. ID: ${record.id}, Status: ${record.status}, Date: ${record.completedAt || record.checkInTime}`);
        });
        
      } catch (error) {
        console.log('❌ Treatment records error:', error.response?.data || error.message);
      }
      
      // Step 5: Double-check with the specific session ID 12
      console.log('\n📋 Step 5: Checking specific session ID 12...');
      try {
        const sessionResponse = await axios.get(`${baseURL}/api/checkups/12`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log('✅ Session 12 details:', sessionResponse.data);
      } catch (error) {
        console.log('❌ Session 12 error:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('❌ Kaleia login failed:', error.response?.data || error.message);
      
      // Step 3b: Try alternative login methods
      console.log('\n📋 Step 3b: Trying alternative login credentials...');
      const altCredentials = [
        { login: 'kaleia', password: '22-01-2004' },
        { login: 'kaleia.aris', password: '22-01-2004' },
        { login: kaleiaPatient.contactNumber, password: '22-01-2004' }
      ];
      
      for (const creds of altCredentials) {
        try {
          const response = await axios.post(`${baseURL}/api/auth/login`, creds);
          console.log(`✅ Alternative login successful with ${creds.login}:`, response.data.user);
          break;
        } catch (error) {
          console.log(`❌ Failed with ${creds.login}`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Investigation failed:', error.response?.data || error.message);
  }
}

investigateKaleiaAccount();
