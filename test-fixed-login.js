const axios = require('axios');

async function testFixedLogin() {
  console.log('🔐 Testing fixed patient login...\n');

  try {
    // Test login with patient credentials
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'patient',
      password: 'patient123'
    });
    
    console.log('✅ Login successful:');
    console.log('   User ID:', loginResponse.data.user.id);
    console.log('   Patient ID:', loginResponse.data.user.patientId);
    console.log('   Name:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);
    console.log('   Email:', loginResponse.data.user.email);
    
    const token = loginResponse.data.token;
    const patientId = loginResponse.data.user.patientId;
    
    // Test fetching treatment records
    console.log('\n📋 Testing treatment records...');
    try {
      const recordsResponse = await axios.get(`http://localhost:5000/api/checkups/history/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Treatment records found:', recordsResponse.data.length);
      recordsResponse.data.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}, Status: ${record.status}, Date: ${record.completedAt || record.createdAt}`);
      });
      
    } catch (error) {
      console.log('❌ Treatment records error:', error.response?.data || error.message);
    }
    
    // Test patient info
    console.log('\n👤 Testing patient info...');
    try {
      const patientResponse = await axios.get(`http://localhost:5000/api/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Patient info retrieved:');
      console.log('   Full Name:', patientResponse.data.fullName);
      console.log('   Age:', patientResponse.data.age);
      console.log('   Contact:', patientResponse.data.contactNumber);
      
    } catch (error) {
      console.log('❌ Patient info error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data || error.message);
  }
}

testFixedLogin();
