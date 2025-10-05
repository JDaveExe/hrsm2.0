const axios = require('axios');

async function debugNotificationSystem() {
  console.log('🔍 Debugging notification system comprehensively...\n');
  
  try {
    // Check what's in localStorage for notifications
    console.log('📋 Step 1: Checking localStorage structure...');
    
    // Test both patient IDs from the screenshot
    const patientIds = [113, 134]; // Kaleia and Derick
    const patientNames = ['Kaleia Aris', 'Derick Bautista'];
    
    for (let i = 0; i < patientIds.length; i++) {
      const patientId = patientIds[i];
      const patientName = patientNames[i];
      
      console.log(`\n🧪 Testing Patient: ${patientName} (ID: ${patientId})`);
      
      // 1. Check if patient exists in database
      try {
        const response = await axios.get(`http://localhost:5000/api/patients/${patientId}`);
        console.log(`✅ Patient ${patientId} found in database:`, {
          id: response.data.id,
          patientId: response.data.patientId,
          name: `${response.data.firstName} ${response.data.lastName}`
        });
      } catch (error) {
        console.log(`❌ Patient ${patientId} not found in database:`, error.response?.status);
        
        // Try alternative IDs
        const alternativeIds = [`PT-0${patientId}`, `0${patientId}`, patientId.toString()];
        for (const altId of alternativeIds) {
          try {
            const altResponse = await axios.get(`http://localhost:5000/api/patients/search?patientId=${altId}`);
            console.log(`🔄 Found with alternative ID ${altId}:`, altResponse.data);
          } catch (altError) {
            // Silent fail for alternatives
          }
        }
      }
      
      // 2. Create a test notification for this patient
      console.log(`\n📨 Creating test notification for patient ${patientId}...`);
      
      const testNotification = {
        id: Date.now() + Math.random(),
        patientId: patientId,
        patientName: patientName,
        appointmentDate: '2025-09-20',
        appointmentTime: '10:00 AM',
        serviceType: 'General Consultation',
        notes: `Test notification for ${patientName}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        type: 'appointment_request'
      };
      
      // Store in localStorage format (simulate what admin would create)
      const existingNotifications = [];
      existingNotifications.push(testNotification);
      
      console.log('📝 Test notification created:', {
        id: testNotification.id,
        patientId: testNotification.patientId,
        patientName: testNotification.patientName,
        date: testNotification.appointmentDate,
        time: testNotification.appointmentTime
      });
      
      // 3. Test different patient ID variations that might be used in the frontend
      console.log(`\n🔬 Testing ID variations for patient ${patientId}:`);
      
      const idVariations = [
        patientId,           // 113
        `0${patientId}`,     // 0113
        `PT-0${patientId}`,  // PT-0113
        patientId.toString() // "113"
      ];
      
      idVariations.forEach(variation => {
        const matches = existingNotifications.filter(notif => 
          notif.patientId == variation || 
          notif.patientId === variation ||
          notif.patientId === parseInt(variation)
        );
        console.log(`  ID ${variation}: ${matches.length} notifications found`);
      });
      
      // 4. Simulate the loadNotifications logic from PatientAppointments.js
      console.log(`\n🧮 Simulating frontend notification loading for patient ${patientId}:`);
      
      // Simulate user objects that might be passed
      const userVariations = [
        { id: patientId, patientId: patientId },
        { id: patientId, patientId: `0${patientId}` },
        { id: `0${patientId}`, patientId: patientId },
        { id: `PT-0${patientId}`, patientId: patientId },
        { patientId: patientId },
        { id: patientId }
      ];
      
      userVariations.forEach((user, index) => {
        const currentUserId = user.patientId || user.id;
        const filteredNotifications = existingNotifications.filter(notification => {
          // This is the exact logic from PatientAppointments.js
          return notification.patientId == currentUserId || 
                 notification.patientId === currentUserId ||
                 notification.patientId === parseInt(currentUserId);
        });
        
        console.log(`  User variation ${index + 1} (patientId: ${user.patientId}, id: ${user.id}):`, 
                   `currentUserId=${currentUserId}, notifications=${filteredNotifications.length}`);
      });
    }
    
    // 5. Check what's actually stored in browser localStorage
    console.log('\n💾 Checking what might be in browser localStorage...');
    console.log('To check browser localStorage, run this in browser console:');
    console.log('JSON.parse(localStorage.getItem("patientNotifications") || "[]")');
    
    // 6. Test the notification creation from admin side
    console.log('\n👨‍⚕️ Testing notification creation (admin perspective)...');
    
    const adminNotificationTest = {
      patientId: 113, // This is what admin sends
      patientName: 'Kaleia Aris',
      appointmentDate: '2025-09-20',
      appointmentTime: '2:00 PM',
      serviceType: 'Follow-up Consultation',
      notes: 'Admin-created test notification'
    };
    
    console.log('Admin would create:', adminNotificationTest);
    console.log('Patient 113 should receive this if IDs match correctly');
    
    // 7. Provide debugging recommendations
    console.log('\n🛠️ DEBUGGING RECOMMENDATIONS:');
    console.log('1. Check browser localStorage: localStorage.getItem("patientNotifications")');
    console.log('2. Check what user object is passed to PatientAppointments component');
    console.log('3. Verify patient ID format consistency between admin and patient systems');
    console.log('4. Test notification creation with exact patient ID formats from database');
    
    console.log('\n✨ POTENTIAL FIXES:');
    console.log('1. Normalize patient IDs to numbers in both admin and patient systems');
    console.log('2. Add more flexible ID matching in notification filtering');
    console.log('3. Add logging to track what IDs are being compared');
    
  } catch (error) {
    console.error('❌ Error during notification debugging:', error.message);
  }
}

debugNotificationSystem();