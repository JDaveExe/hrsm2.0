const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testTodayScheduleFunctionality() {
  console.log('🔍 Testing Today\'s Schedule functionality...\n');
  
  try {
    console.log('📅 Step 1: Creating a test appointment for TODAY...');
    
    // Submit appointment request for today
    const requestResponse = await fetch(`${API_BASE_URL}/appointments/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      },
      body: JSON.stringify({
        patientId: 113,
        patientName: 'Kaleia Aris',
        appointmentType: 'General Consultation',
        requestedDate: new Date().toISOString().split('T')[0], // TODAY
        requestedTime: '15:30',
        symptoms: 'Regular checkup',
        notes: 'Testing today\'s schedule functionality',
        status: 'pending',
        requestDate: new Date().toISOString()
      })
    });
    
    if (!requestResponse.ok) {
      throw new Error(`Failed to submit request: ${requestResponse.statusText}`);
    }
    
    const requestResult = await requestResponse.json();
    console.log('✅ Request submitted with ID:', requestResult.requestId);
    
    console.log('\n🔍 Step 2: Approving the request...');
    
    // Approve the request
    const approvalResponse = await fetch(`${API_BASE_URL}/appointments/requests/${requestResult.requestId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      },
      body: JSON.stringify({
        adminId: 1
      })
    });
    
    if (!approvalResponse.ok) {
      throw new Error(`Failed to approve request: ${approvalResponse.statusText}`);
    }
    
    const approvalResult = await approvalResponse.json();
    console.log('✅ Request approved:', approvalResult.message);
    
    console.log('\n📊 Step 3: Checking appointments endpoint...');
    
    // Check appointments
    const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': 'temp-admin-token'
      }
    });
    
    if (!appointmentsResponse.ok) {
      throw new Error(`Failed to get appointments: ${appointmentsResponse.statusText}`);
    }
    
    const appointments = await appointmentsResponse.json();
    console.log(`✅ Total appointments found: ${appointments.length}`);
    
    // Filter today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todaysAppointments = appointments.filter(apt => {
      const aptDate = apt.appointmentDate ? apt.appointmentDate.split('T')[0] : null;
      return aptDate === today;
    });
    
    console.log(`📅 Today's appointments (${today}): ${todaysAppointments.length}`);
    
    if (todaysAppointments.length > 0) {
      todaysAppointments.forEach((apt, index) => {
        console.log(`\n--- Today's Appointment ${index + 1} ---`);
        console.log(`  Patient ID: ${apt.patientId}`);
        console.log(`  Patient Name: ${apt.patientName}`);
        console.log(`  Date: ${apt.appointmentDate}`);
        console.log(`  Time: ${apt.appointmentTime}`);
        console.log(`  Type: ${apt.type}`);
        console.log(`  Status: ${apt.status}`);
        console.log(`  Notes: ${apt.notes}`);
      });
      
      console.log('\n🎉 SUCCESS: Today\'s appointments are properly filtered and should appear in both admin and patient Today\'s Schedule!');
    } else {
      console.log('\n⚠️ WARNING: No appointments found for today. Check the date filtering logic.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTodayScheduleFunctionality();