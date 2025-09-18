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

async function findKaleiaArisPatient() {
  console.log('🔍 Looking for Kaleia Aris Patient PT-0113...\n');
  
  try {
    // Get all patients
    const patientsResult = await apiCall('GET', '/patients');
    
    if (!patientsResult.success) {
      console.log('❌ Failed to fetch patients:', patientsResult.error);
      return null;
    }

    console.log(`📋 Found ${patientsResult.data.length} patients in database`);
    
    // Look for Kaleia Aris - try multiple ways
    const kaleiaPatient = patientsResult.data.find(patient => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      const patientId = patient.patientId || patient.id;
      
      return (
        fullName.includes('kaleia') || 
        fullName.includes('aris') ||
        (patientId && patientId.toString().includes('113')) ||
        (patient.email && patient.email.toLowerCase().includes('kaleia'))
      );
    });

    if (kaleiaPatient) {
      console.log('✅ Found Kaleia Aris patient:');
      console.log({
        id: kaleiaPatient.id,
        patientId: kaleiaPatient.patientId,
        fullName: `${kaleiaPatient.firstName} ${kaleiaPatient.lastName}`,
        firstName: kaleiaPatient.firstName,
        lastName: kaleiaPatient.lastName,
        email: kaleiaPatient.email,
        contactNumber: kaleiaPatient.contactNumber,
        createdAt: kaleiaPatient.createdAt
      });
      return kaleiaPatient;
    } else {
      console.log('❌ Kaleia Aris patient not found');
      console.log('\n📋 Available patients (first 10):');
      patientsResult.data.slice(0, 10).forEach((patient, index) => {
        console.log(`${index + 1}. ID: ${patient.id} | PatientId: ${patient.patientId} | Name: ${patient.firstName} ${patient.lastName} | Email: ${patient.email}`);
      });
      
      return null;
    }
    
  } catch (error) {
    console.error('💥 Error searching for patient:', error.message);
    return null;
  }
}

async function checkKaleiaAppointments(patient) {
  console.log(`\n🔍 Checking appointments for Kaleia Aris (ID: ${patient.id}, PatientId: ${patient.patientId})\n`);
  
  try {
    // Get all appointments
    const appointmentsResult = await apiCall('GET', '/appointments');
    
    if (!appointmentsResult.success) {
      console.log('❌ Failed to fetch appointments:', appointmentsResult.error);
      return;
    }

    console.log(`📋 Total appointments in database: ${appointmentsResult.data.length}`);
    
    // Filter for Kaleia's appointments using both ID and patientId
    const kaleiaAppointments = appointmentsResult.data.filter(apt => 
      apt.patientId === patient.id || 
      apt.patientId === patient.patientId ||
      (apt.patient && apt.patient.id === patient.id)
    );
    
    console.log(`📋 Kaleia's appointments found: ${kaleiaAppointments.length}`);
    
    if (kaleiaAppointments.length > 0) {
      console.log('\n✅ Kaleia\'s appointments:');
      kaleiaAppointments.forEach((apt, index) => {
        console.log(`${index + 1}. Appointment ID: ${apt.id}`);
        console.log(`   - Patient ID: ${apt.patientId}`);
        console.log(`   - Date: ${apt.appointmentDate || apt.date}`);
        console.log(`   - Time: ${apt.appointmentTime || apt.time}`);
        console.log(`   - Type: ${apt.type || apt.serviceType}`);
        console.log(`   - Status: ${apt.status}`);
        console.log(`   - Created: ${apt.createdAt}`);
        console.log(`   - Patient Name: ${apt.patient_name || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No appointments found for Kaleia Aris');
      
      // Check what patient IDs exist in appointments
      const uniquePatientIds = [...new Set(appointmentsResult.data.map(apt => apt.patientId))];
      console.log('\n📋 Patient IDs that have appointments:', uniquePatientIds.slice(0, 10));
      
      // Show some sample appointments for comparison
      console.log('\n📋 Sample appointments in database:');
      appointmentsResult.data.slice(0, 3).forEach((apt, index) => {
        console.log(`${index + 1}. ID: ${apt.id} | Patient ID: ${apt.patientId} | Date: ${apt.appointmentDate} | Status: ${apt.status}`);
      });
    }
    
    // Test with specific API endpoint for patient appointments
    console.log(`\n🔍 Testing patient-specific appointment endpoint...`);
    const patientAppointmentsResult = await apiCall('GET', `/appointments?patientId=${patient.id}`);
    
    if (patientAppointmentsResult.success) {
      console.log(`✅ Patient-specific endpoint returned ${patientAppointmentsResult.data.length} appointments`);
      if (patientAppointmentsResult.data.length > 0) {
        patientAppointmentsResult.data.forEach((apt, index) => {
          console.log(`   ${index + 1}. ${apt.appointmentDate} at ${apt.appointmentTime} - ${apt.status}`);
        });
      }
    } else {
      console.log('❌ Patient-specific endpoint failed:', patientAppointmentsResult.error);
    }
    
    // Test alternative patient ID
    if (patient.patientId && patient.patientId !== patient.id) {
      console.log(`\n🔍 Testing with alternative patient ID (${patient.patientId})...`);
      const altPatientAppointmentsResult = await apiCall('GET', `/appointments?patientId=${patient.patientId}`);
      
      if (altPatientAppointmentsResult.success) {
        console.log(`✅ Alternative ID endpoint returned ${altPatientAppointmentsResult.data.length} appointments`);
        if (altPatientAppointmentsResult.data.length > 0) {
          altPatientAppointmentsResult.data.forEach((apt, index) => {
            console.log(`   ${index + 1}. ${apt.appointmentDate} at ${apt.appointmentTime} - ${apt.status}`);
          });
        }
      } else {
        console.log('❌ Alternative ID endpoint failed:', altPatientAppointmentsResult.error);
      }
    }
    
  } catch (error) {
    console.error('💥 Error checking appointments:', error.message);
  }
}

async function createTestAppointmentForKaleia(patient) {
  console.log(`\n🚀 Creating test appointment for Kaleia Aris...\n`);
  
  try {
    const appointmentData = {
      patientId: patient.id, // Using the main ID
      doctorId: 1, // Default doctor
      appointmentDate: '2025-09-19', // Tomorrow
      appointmentTime: '14:30',
      type: 'Consultation',
      status: 'Scheduled',
      notes: 'Test appointment for debugging Kaleia dashboard issue',
      symptoms: 'Testing dashboard visibility'
    };
    
    console.log('📋 Creating appointment with data:', appointmentData);
    
    const createResult = await apiCall('POST', '/appointments', appointmentData);
    
    if (createResult.success) {
      console.log('✅ Test appointment created successfully!');
      console.log('   Appointment ID:', createResult.data.appointment?.id || createResult.data.id);
      console.log('   Status:', createResult.data.appointment?.status || createResult.data.status);
      
      // Verify it was created
      console.log('\n🔍 Verifying appointment was created...');
      await checkKaleiaAppointments(patient);
      
      return createResult.data.appointment?.id || createResult.data.id;
    } else {
      console.log('❌ Failed to create test appointment:', createResult.error);
      
      // Try with alternative patient ID
      if (patient.patientId && patient.patientId !== patient.id) {
        console.log(`\n🔄 Retrying with alternative patient ID (${patient.patientId})...`);
        appointmentData.patientId = patient.patientId;
        
        const retryResult = await apiCall('POST', '/appointments', appointmentData);
        if (retryResult.success) {
          console.log('✅ Test appointment created with alternative ID!');
          return retryResult.data.appointment?.id || retryResult.data.id;
        } else {
          console.log('❌ Retry also failed:', retryResult.error);
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Error creating test appointment:', error.message);
  }
  
  return null;
}

async function testDashboardDataFlow(patient) {
  console.log(`\n🔍 Testing Dashboard Data Flow for Kaleia Aris...\n`);
  
  try {
    // Test various endpoints that the patient dashboard might use
    const testEndpoints = [
      `/appointments?patientId=${patient.id}`,
      `/appointments/history/${patient.id}`,
      `/appointments/calendar?patientId=${patient.id}`,
      `/patient/${patient.id}/appointments`,
      `/checkups/history/${patient.id}`
    ];
    
    for (const endpoint of testEndpoints) {
      console.log(`🔍 Testing endpoint: ${endpoint}`);
      const result = await apiCall('GET', endpoint);
      
      if (result.success) {
        const dataLength = Array.isArray(result.data) ? result.data.length : 
                          result.data.appointments ? result.data.appointments.length :
                          result.data.checkups ? result.data.checkups.length : 'N/A';
        console.log(`   ✅ Success - Returned ${dataLength} items`);
        
        if (Array.isArray(result.data) && result.data.length > 0) {
          console.log(`   📋 Sample item:`, {
            id: result.data[0].id,
            patientId: result.data[0].patientId,
            date: result.data[0].appointmentDate || result.data[0].date,
            status: result.data[0].status
          });
        }
      } else {
        console.log(`   ❌ Failed - ${result.status}: ${result.error?.msg || result.error}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Error testing dashboard data flow:', error.message);
  }
}

async function runKaleiaInvestigation() {
  console.log('🕵️ Starting Kaleia Aris Appointment Investigation\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Find Kaleia Aris patient
    const kaleiaPatient = await findKaleiaArisPatient();
    
    if (!kaleiaPatient) {
      console.log('\n❌ Cannot proceed without finding Kaleia Aris patient');
      console.log('💡 Suggestion: Check if patient exists or create one first');
      return;
    }

    // Step 2: Check existing appointments
    await checkKaleiaAppointments(kaleiaPatient);
    
    // Step 3: Test dashboard data flow
    await testDashboardDataFlow(kaleiaPatient);
    
    // Step 4: Create test appointment if none exist
    const appointments = await apiCall('GET', `/appointments?patientId=${kaleiaPatient.id}`);
    if (appointments.success && appointments.data.length === 0) {
      console.log('\n🚀 No appointments found, creating test appointment...');
      await createTestAppointmentForKaleia(kaleiaPatient);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 INVESTIGATION SUMMARY');
    console.log('=' .repeat(60));
    console.log('✅ Patient found and verified');
    console.log('✅ API endpoints tested');
    console.log('✅ Data flow analyzed');
    console.log('\n💡 Next steps:');
    console.log('1. Check patient dashboard component for ID mapping issues');
    console.log('2. Verify appointment filtering logic in frontend');
    console.log('3. Check if patient.id vs patient.patientId is causing issues');
    console.log('4. Test with browser developer tools on patient dashboard');
    
  } catch (error) {
    console.error('\n💥 Investigation failed:', error.message);
  }
}

// Run the investigation
if (require.main === module) {
  runKaleiaInvestigation();
}

module.exports = {
  findKaleiaArisPatient,
  checkKaleiaAppointments,
  createTestAppointmentForKaleia,
  testDashboardDataFlow
};