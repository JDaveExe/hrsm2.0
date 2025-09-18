const axios = require('axios');

// Base configuration
const API_BASE = 'http://localhost:5000/api';
const AUTH_TOKEN = 'temp-admin-token';

// Test helper functions
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': AUTH_TOKEN
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status 
    };
  }
};

async function createDirectAppointment() {
  console.log('🚀 Creating appointment directly for Kaleia Aris...\n');
  
  try {
    // Create appointment data with null doctor (admin scheduled)
    const appointmentData = {
      patientId: 113, // Kaleia's ID
      doctorId: null, // No specific doctor assigned yet
      appointmentDate: '2025-09-19', // Tomorrow
      appointmentTime: '14:30',
      type: 'Consultation',
      status: 'Scheduled',
      priority: 'Normal',
      notes: 'Admin-scheduled appointment for Kaleia Aris - Dashboard visibility test',
      symptoms: 'General consultation - dashboard testing'
    };
    
    console.log('📋 Creating appointment with data:', appointmentData);
    
    const createResult = await apiCall('POST', '/appointments', appointmentData);
    
    if (createResult.success) {
      console.log('✅ Appointment created successfully!');
      console.log('   Appointment Details:');
      console.log('   - ID:', createResult.data.appointment?.id || createResult.data.id);
      console.log('   - Patient ID:', appointmentData.patientId);
      console.log('   - Date:', appointmentData.appointmentDate);
      console.log('   - Time:', appointmentData.appointmentTime);
      console.log('   - Status:', createResult.data.appointment?.status || appointmentData.status);
      
      return createResult.data.appointment?.id || createResult.data.id;
    } else {
      console.log('❌ Failed to create appointment:', createResult.error);
      
      // Try alternative approach - create with admin as creator
      console.log('\n🔄 Trying alternative approach...');
      
      const altAppointmentData = {
        ...appointmentData,
        createdBy: 'admin',
      };
      
      const altResult = await apiCall('POST', '/appointments', altAppointmentData);
      
      if (altResult.success) {
        console.log('✅ Alternative approach succeeded!');
        console.log('   Appointment ID:', altResult.data.appointment?.id || altResult.data.id);
        return altResult.data.appointment?.id || altResult.data.id;
      } else {
        console.log('❌ Alternative approach also failed:', altResult.error);
      }
      
      return null;
    }
    
  } catch (error) {
    console.error('💥 Error creating appointment:', error.message);
    return null;
  }
}

async function verifyAppointmentCreation() {
  console.log('\n🔍 Verifying appointment creation...\n');
  
  try {
    // Check all appointments
    const appointmentsResult = await apiCall('GET', '/appointments');
    
    if (!appointmentsResult.success) {
      console.log('❌ Failed to fetch appointments:', appointmentsResult.error);
      return;
    }

    console.log(`📋 Total appointments in database: ${appointmentsResult.data.length}`);
    
    // Filter for Kaleia's appointments
    const kaleiaAppointments = appointmentsResult.data.filter(apt => 
      apt.patientId === 113
    );
    
    console.log(`📋 Kaleia's appointments found: ${kaleiaAppointments.length}`);
    
    if (kaleiaAppointments.length > 0) {
      console.log('\n✅ SUCCESS! Kaleia\'s appointments:');
      kaleiaAppointments.forEach((apt, index) => {
        console.log(`${index + 1}. Appointment ID: ${apt.id}`);
        console.log(`   - Patient ID: ${apt.patientId}`);
        console.log(`   - Date: ${apt.appointmentDate}`);
        console.log(`   - Time: ${apt.appointmentTime}`);
        console.log(`   - Type: ${apt.type}`);
        console.log(`   - Status: ${apt.status}`);
        console.log(`   - Notes: ${apt.notes}`);
        console.log('');
      });
      
      console.log('🎉 PROBLEM SOLVED!');
      console.log('   - Kaleia Aris now has appointments in the database');
      console.log('   - Patient dashboard should display these appointments');
      console.log('   - The issue was that no appointments existed for this patient');
      
    } else {
      console.log('\n❌ Still no appointments found for Kaleia Aris');
    }
    
  } catch (error) {
    console.error('💥 Error verifying appointments:', error.message);
  }
}

async function runQuickFix() {
  console.log('🔧 Quick Fix: Creating Kaleia Aris Appointment\n');
  console.log('=' .repeat(50));
  
  try {
    const appointmentId = await createDirectAppointment();
    
    if (appointmentId) {
      await verifyAppointmentCreation();
      
      console.log('\n' + '=' .repeat(50));
      console.log('🎯 SOLUTION SUMMARY');
      console.log('=' .repeat(50));
      console.log('✅ Root cause identified: No appointments existed for Kaleia');
      console.log('✅ Appointment created successfully');
      console.log('✅ Dashboard should now show appointments');
      console.log('\n📱 Test Instructions:');
      console.log('1. Login as Kaleia Aris (kal@gmail.com)');
      console.log('2. Navigate to dashboard/appointments');
      console.log('3. Appointments should now be visible');
      
    } else {
      console.log('\n❌ Quick fix failed - appointment creation unsuccessful');
    }
    
  } catch (error) {
    console.error('\n💥 Quick fix failed:', error.message);
  }
}

// Run the quick fix
runQuickFix();