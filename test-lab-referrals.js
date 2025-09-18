const axios = require('axios');

async function testLabReferralsSystem() {
  console.log('🧪 Testing Lab Referrals System...\n');

  const baseURL = 'http://localhost:5000';
  
  try {
    // Test 1: Admin login
    console.log('📋 Step 1: Admin login...');
    const adminLogin = await axios.post(`${baseURL}/api/auth/login`, {
      login: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Admin login successful');
    const adminToken = adminLogin.data.token;
    
    // Test 2: Get lab referrals for Josuke (Patient ID 40)
    console.log('\n📋 Step 2: Getting lab referrals for Josuke (Patient ID 40)...');
    try {
      const josukeReferrals = await axios.get(`${baseURL}/api/lab-referrals/patient/40`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Josuke referrals found:', josukeReferrals.data.length);
      josukeReferrals.data.forEach((referral, index) => {
        console.log(`   ${index + 1}. ID: ${referral.id}, Status: ${referral.status}, Facility: ${referral.facility}`);
      });
      
    } catch (error) {
      console.log('❌ Error getting Josuke referrals:', error.response?.data || error.message);
    }
    
    // Test 3: Get lab referrals for Kaleia (Patient ID 113)
    console.log('\n📋 Step 3: Getting lab referrals for Kaleia (Patient ID 113)...');
    try {
      const kaleiaReferrals = await axios.get(`${baseURL}/api/lab-referrals/patient/113`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ Kaleia referrals found:', kaleiaReferrals.data.length);
      kaleiaReferrals.data.forEach((referral, index) => {
        console.log(`   ${index + 1}. ID: ${referral.id}, Status: ${referral.status}, Facility: ${referral.facility}`);
      });
      
    } catch (error) {
      console.log('❌ Error getting Kaleia referrals:', error.response?.data || error.message);
    }
    
    // Test 4: Submit a new referral
    console.log('\n📋 Step 4: Submitting new lab referral...');
    try {
      const newReferral = {
        referralType: 'laboratory',
        facility: 'Test Hospital',
        department: 'Laboratory',
        specialist: 'Dr. Test',
        reason: 'Test referral for system validation',
        clinicalHistory: 'Testing the lab referral system functionality',
        currentMedications: 'None',
        urgency: 'routine',
        preferredDate: '2025-09-10',
        additionalNotes: 'This is a test referral'
      };
      
      const submitResponse = await axios.post(`${baseURL}/api/lab-referrals/submit/40`, newReferral, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('✅ New referral submitted successfully:');
      console.log('   Referral ID:', submitResponse.data.referral.referralId);
      console.log('   Status:', submitResponse.data.referral.status);
      
    } catch (error) {
      console.log('❌ Error submitting referral:', error.response?.data || error.message);
    }
    
    // Test 5: Patient login and check lab referrals
    console.log('\n📋 Step 5: Testing patient view...');
    try {
      const patientLogin = await axios.post(`${baseURL}/api/auth/login`, {
        login: 'patient',
        password: 'patient123'
      });
      
      console.log('✅ Patient login successful (Josuke)');
      const patientToken = patientLogin.data.token;
      const patientId = patientLogin.data.user.patientId;
      
      const patientReferrals = await axios.get(`${baseURL}/api/lab-referrals/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      
      console.log('✅ Patient can view their referrals:', patientReferrals.data.length);
      
    } catch (error) {
      console.log('❌ Error with patient view:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.response?.data || error.message);
  }
}

testLabReferralsSystem();
