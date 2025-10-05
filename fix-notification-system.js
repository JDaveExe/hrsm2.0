const axios = require('axios');

async function fixNotificationSystem() {
  console.log('🔧 Fixing notification system with proper patient IDs...\n');
  
  try {
    // 1. Get admin token first
    console.log('🔐 Getting admin token...');
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    if (!adminLogin.data.token) {
      throw new Error('Admin login failed');
    }
    
    const authToken = adminLogin.data.token;
    console.log('✅ Admin token obtained');
    
    // 2. Get all patients to understand ID structure
    console.log('\n📋 Getting patient database...');
    const patientsResponse = await axios.get('http://localhost:5000/api/patients', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const patients = patientsResponse.data;
    console.log(`📊 Found ${patients.length} patients in database`);
    
    // 3. Find our target patients
    const kaleia = patients.find(p => p.firstName === 'Kaleia' && p.lastName === 'Aris');
    const derick = patients.find(p => p.firstName === 'Derick');
    
    if (!kaleia) {
      console.log('❌ Kaleia Aris not found in database');
      return;
    }
    
    if (!derick) {
      console.log('❌ Derick not found in database');
      return;
    }
    
    console.log('\n👥 Target patients found:');
    console.log(`  Kaleia: DB ID=${kaleia.id}, PatientID=${kaleia.patientId}`);
    console.log(`  Derick: DB ID=${derick.id}, PatientID=${derick.patientId}`);
    
    // 4. Create notifications using the CORRECT database IDs
    const correctNotifications = [
      {
        id: Date.now() + 1,
        patientId: kaleia.id, // Use database ID, not patient ID
        patientName: `${kaleia.firstName} ${kaleia.lastName}`,
        appointmentDate: '2025-09-20',
        appointmentTime: '10:00 AM',
        serviceType: 'General Consultation',
        notes: 'Test notification for Kaleia - using correct DB ID',
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'appointment_request'
      },
      {
        id: Date.now() + 2,
        patientId: derick.id, // Use database ID, not patient ID
        patientName: `${derick.firstName} ${derick.lastName}`,
        appointmentDate: '2025-09-20',
        appointmentTime: '2:00 PM',
        serviceType: 'Follow-up Consultation',
        notes: 'Test notification for Derick - using correct DB ID',
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'appointment_request'
      }
    ];
    
    console.log('\n📨 Creating test notifications with correct database IDs:');
    correctNotifications.forEach(notif => {
      console.log(`  ${notif.patientName}: patientId=${notif.patientId}`);
    });
    
    // 5. Test patient login to see what user object gets created
    console.log('\n🧪 Testing patient login flow...');
    
    // Try to find patients with email addresses
    const patientsWithEmails = patients.filter(p => p.email && p.email.includes('@'));
    console.log(`\n📧 Patients with email addresses: ${patientsWithEmails.length}`);
    
    if (patientsWithEmails.length > 0) {
      const testPatient = patientsWithEmails[0];
      console.log(`🧪 Testing login for: ${testPatient.firstName} ${testPatient.lastName}`);
      console.log(`   Email: ${testPatient.email}`);
      console.log(`   DB ID: ${testPatient.id}`);
      console.log(`   Patient ID: ${testPatient.patientId}`);
      
      // Test what user object is returned on login
      try {
        const loginTest = await axios.post('http://localhost:5000/api/auth/login', {
          login: testPatient.email,
          password: 'test123' // This might not work, but let's see the structure
        });
        
        console.log('✅ Login successful, user object:', loginTest.data.user);
        
      } catch (loginError) {
        console.log('⚠️ Login failed (expected), but we can see the patient structure');
      }
    }
    
    // 6. Create a browser-injectable script to fix notifications
    const browserScript = `
// Run this in browser console on patient dashboard
console.log('🔧 Injecting corrected notifications...');

const correctedNotifications = ${JSON.stringify(correctNotifications, null, 2)};

localStorage.setItem('patientNotifications', JSON.stringify(correctedNotifications));
console.log('✅ Notifications updated with correct database IDs');
console.log('📋 Notifications stored:', correctedNotifications.length);

// Reload the page to see notifications
setTimeout(() => {
  console.log('🔄 Refreshing page in 2 seconds...');
  window.location.reload();
}, 2000);
`;
    
    console.log('\n📝 BROWSER SCRIPT GENERATED:');
    console.log('Copy and paste this in browser console on patient dashboard:');
    console.log('=' .repeat(60));
    console.log(browserScript);
    console.log('=' .repeat(60));
    
    // 7. Provide the fix for the notification system
    console.log('\n🛠️ PERMANENT FIX NEEDED:');
    console.log('The issue is that notifications use database IDs, but the system might be inconsistent.');
    console.log('');
    console.log('Patient login creates user object with:');
    console.log('- user.id (database ID) - THIS is what should be used for notifications');
    console.log('- user.patientId (PT-0113 format) - This is display only');
    console.log('');
    console.log('Admin creates notifications with patient database ID, not patient ID string.');
    console.log('');
    console.log('SOLUTION: Update notification filtering to use user.id consistently.');
    
  } catch (error) {
    console.error('❌ Error fixing notification system:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

fixNotificationSystem();