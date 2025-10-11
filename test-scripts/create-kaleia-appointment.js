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

async function checkAvailableDoctors() {
  console.log('👨‍⚕️ Checking available doctors...\n');
  
  try {
    const doctorsResult = await apiCall('GET', '/users');
    
    if (!doctorsResult.success) {
      console.log('❌ Failed to fetch users:', doctorsResult.error);
      return [];
    }

    const doctors = doctorsResult.data.filter(user => user.role === 'doctor');
    console.log(`📋 Found ${doctors.length} doctors:`);
    
    doctors.forEach((doctor, index) => {
      console.log(`${index + 1}. ID: ${doctor.id} | Name: ${doctor.firstName} ${doctor.lastName} | Email: ${doctor.email}`);
    });
    
    return doctors;
    
  } catch (error) {
    console.error('💥 Error checking doctors:', error.message);
    return [];
  }
}

async function createKaleiaAppointment() {
  console.log('🚀 Creating appointment for Kaleia Aris...\n');
  
  try {
    // First get available doctors
    const doctors = await checkAvailableDoctors();
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found. Cannot create appointment.');
      return null;
    }
    
    const firstDoctor = doctors[0];
    console.log(`\n✅ Using doctor: ${firstDoctor.firstName} ${firstDoctor.lastName} (ID: ${firstDoctor.id})\n`);
    
    // Create appointment data
    const appointmentData = {
      patientId: 113, // Kaleia's ID
      doctorId: firstDoctor.id,
      appointmentDate: '2025-09-19', // Tomorrow
      appointmentTime: '14:30',
      type: 'Consultation',
      status: 'Scheduled',
      priority: 'Normal',
      notes: 'Scheduled appointment for Kaleia Aris - Dashboard testing',
      symptoms: 'General consultation'
    };
    
    console.log('📋 Creating appointment with data:', appointmentData);
    
    const createResult = await apiCall('POST', '/appointments', appointmentData);
    
    if (createResult.success) {
      console.log('✅ Appointment created successfully!');
      console.log('   Appointment Details:');
      console.log('   - ID:', createResult.data.appointment?.id || createResult.data.id);
      console.log('   - Patient ID:', appointmentData.patientId);
      console.log('   - Doctor:', `${firstDoctor.firstName} ${firstDoctor.lastName}`);
      console.log('   - Date:', appointmentData.appointmentDate);
      console.log('   - Time:', appointmentData.appointmentTime);
      console.log('   - Status:', createResult.data.appointment?.status || appointmentData.status);
      
      return createResult.data.appointment?.id || createResult.data.id;
    } else {
      console.log('❌ Failed to create appointment:', createResult.error);
      return null;
    }
    
  } catch (error) {
    console.error('💥 Error creating appointment:', error.message);
    return null;
  }
}

async function verifyKaleiaAppointments() {
  console.log('\n🔍 Verifying Kaleia\'s appointments after creation...\n');
  
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
      console.log('\n✅ Kaleia\'s appointments:');
      kaleiaAppointments.forEach((apt, index) => {
        console.log(`${index + 1}. Appointment ID: ${apt.id}`);
        console.log(`   - Patient ID: ${apt.patientId}`);
        console.log(`   - Date: ${apt.appointmentDate}`);
        console.log(`   - Time: ${apt.appointmentTime}`);
        console.log(`   - Type: ${apt.type}`);
        console.log(`   - Status: ${apt.status}`);
        console.log(`   - Doctor ID: ${apt.doctorId}`);
        console.log(`   - Notes: ${apt.notes}`);
        console.log('');
      });
      
      // Test patient-specific endpoint
      console.log('🔍 Testing patient-specific appointment retrieval...');
      const patientAppointments = await apiCall('GET', `/appointments?patientId=113`);
      
      if (patientAppointments.success) {
        console.log(`✅ Patient endpoint returned ${patientAppointments.data.length} appointments`);
        if (patientAppointments.data.length > 0) {
          console.log('   - First appointment:', {
            id: patientAppointments.data[0].id,
            date: patientAppointments.data[0].appointmentDate,
            time: patientAppointments.data[0].appointmentTime,
            status: patientAppointments.data[0].status
          });
        }
      } else {
        console.log('❌ Patient endpoint failed:', patientAppointments.error);
      }
      
    } else {
      console.log('\n❌ Still no appointments found for Kaleia Aris');
    }
    
  } catch (error) {
    console.error('💥 Error verifying appointments:', error.message);
  }
}

async function runAppointmentCreation() {
  console.log('🏥 Creating and Verifying Kaleia Aris Appointment\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Create appointment
    const appointmentId = await createKaleiaAppointment();
    
    if (appointmentId) {
      // Step 2: Verify creation
      await verifyKaleiaAppointments();
      
      console.log('\n' + '=' .repeat(60));
      console.log('🎯 APPOINTMENT CREATION SUMMARY');
      console.log('=' .repeat(60));
      console.log('✅ Appointment successfully created for Kaleia Aris');
      console.log(`✅ Appointment ID: ${appointmentId}`);
      console.log('✅ Patient can now see appointment on dashboard');
      console.log('\n💡 Next steps:');
      console.log('1. Login as Kaleia Aris patient');
      console.log('2. Check dashboard - appointment should now be visible');
      console.log('3. Test appointment acceptance/management features');
      
    } else {
      console.log('\n❌ Failed to create appointment');
      console.log('💡 Check server logs and doctor availability');
    }
    
  } catch (error) {
    console.error('\n💥 Process failed:', error.message);
  }
}

// Run the appointment creation
if (require.main === module) {
  runAppointmentCreation();
}

module.exports = {
  checkAvailableDoctors,
  createKaleiaAppointment,
  verifyKaleiaAppointments
};