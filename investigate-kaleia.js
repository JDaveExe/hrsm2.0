const axios = require('axios');

async function investigateKaleia() {
  console.log('🔍 Investigating Kaleia Aris account and treatment records...\n');

  try {
    // First, get admin access
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');

    // Get all patients to find Kaleia
    const patientsResponse = await axios.get('http://localhost:5000/api/patients', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const kaleia = patientsResponse.data.find(p => 
      p.firstName?.toLowerCase().includes('kaleia') && 
      p.lastName?.toLowerCase().includes('aris')
    );

    if (kaleia) {
      console.log('\n👤 Found Kaleia in patients database:');
      console.log('   Patient ID:', kaleia.id);
      console.log('   User ID:', kaleia.userId);
      console.log('   Full Name:', kaleia.fullName);
      console.log('   Email:', kaleia.email);
      console.log('   Phone:', kaleia.contactNumber);
      console.log('   Patient Code:', kaleia.qrCode || 'N/A');

      // Get checkup history for Kaleia
      try {
        const historyResponse = await axios.get(`http://localhost:5000/api/checkups/history/${kaleia.id}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('\n📋 Kaleia\'s Treatment Records:');
        if (historyResponse.data.length === 0) {
          console.log('   ❌ No treatment records found');
        } else {
          historyResponse.data.forEach((record, index) => {
            console.log(`   ${index + 1}. Checkup ID: ${record.id}`);
            console.log(`      Status: ${record.status}`);
            console.log(`      Date: ${record.completedAt || record.createdAt}`);
            console.log(`      Doctor: ${record.assignedDoctor || 'N/A'}`);
            console.log(`      Service: ${record.serviceType || 'N/A'}`);
          });
        }
      } catch (error) {
        console.log('   ❌ Error fetching treatment records:', error.response?.data || error.message);
      }

      // Check if User exists for Kaleia
      try {
        const usersResponse = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        const kaleiaUser = usersResponse.data.users?.find(u => u.id === kaleia.userId) || 
                          usersResponse.data.find(u => u.id === kaleia.userId);

        if (kaleiaUser) {
          console.log('\n🔐 Found Kaleia\'s User account:');
          console.log('   User ID:', kaleiaUser.id);
          console.log('   Username:', kaleiaUser.username);
          console.log('   Email:', kaleiaUser.email);
          console.log('   Role:', kaleiaUser.role);
        } else {
          console.log('\n❌ No User account found for Kaleia (User ID:', kaleia.userId, ')');
          console.log('   This means Kaleia cannot login to see her records');
        }
      } catch (error) {
        console.log('   ❌ Error checking user account:', error.response?.data || error.message);
      }

    } else {
      console.log('❌ Kaleia Aris not found in patients database');
    }

    // Check recent checkup sessions
    try {
      const checkupsResponse = await axios.get('http://localhost:5000/api/checkups', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      console.log('\n📊 Recent checkup sessions:');
      const recentCheckups = checkupsResponse.data
        .filter(c => c.patientName?.toLowerCase().includes('kaleia'))
        .slice(0, 3);

      if (recentCheckups.length === 0) {
        console.log('   ❌ No recent checkups found for Kaleia');
      } else {
        recentCheckups.forEach((checkup, index) => {
          console.log(`   ${index + 1}. Session ID: ${checkup.id}`);
          console.log(`      Patient: ${checkup.patientName}`);
          console.log(`      Status: ${checkup.status}`);
          console.log(`      Created: ${checkup.createdAt}`);
          console.log(`      Completed: ${checkup.completedAt || 'Not completed'}`);
        });
      }
    } catch (error) {
      console.log('   ❌ Error fetching checkups:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ Investigation failed:', error.response?.data || error.message);
  }
}

investigateKaleia();
