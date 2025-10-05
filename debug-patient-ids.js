/**
 * Debug Patient ID Mismatch - Find the correct patient ID
 * This script will help us identify the correct patient ID for Kaleia Aris
 */

console.log("🔍 PATIENT ID MISMATCH INVESTIGATION");
console.log("==================================================");

const axios = require('axios');
const API_BASE = 'http://localhost:5000/api';

async function debugPatientIDs() {
  try {
    console.log("1. 📋 FETCHING ALL PATIENTS");
    console.log("--------------------------------------------------");
    
    // Get all patients to find Kaleia Aris
    const patientsResponse = await axios.get(`${API_BASE}/patients`, {
      headers: {
        'Authorization': 'Bearer temp-admin-token'
      }
    });
    
    console.log(`Found ${patientsResponse.data.length} total patients`);
    
    // Look for Kaleia Aris specifically
    const kaleiaPatients = patientsResponse.data.filter(patient => 
      (patient.firstName && patient.firstName.toLowerCase().includes('kaleia')) ||
      (patient.lastName && patient.lastName.toLowerCase().includes('aris')) ||
      (patient.email && patient.email.toLowerCase().includes('kal'))
    );
    
    console.log("\n2. 🎯 KALEIA ARIS SEARCH RESULTS");
    console.log("--------------------------------------------------");
    
    if (kaleiaPatients.length > 0) {
      kaleiaPatients.forEach((patient, index) => {
        console.log(`Match ${index + 1}:`);
        console.log(`  - ID: ${patient.id}`);
        console.log(`  - Name: ${patient.firstName} ${patient.lastName}`);
        console.log(`  - Email: ${patient.email}`);
        console.log(`  - Contact: ${patient.contactNumber}`);
        console.log(`  - User ID: ${patient.userId || 'Not linked'}`);
        console.log("  ---");
      });
    } else {
      console.log("❌ No patients found matching 'Kaleia Aris'");
      
      // Show first 10 patients for reference
      console.log("\n📋 FIRST 10 PATIENTS FOR REFERENCE:");
      patientsResponse.data.slice(0, 10).forEach(patient => {
        console.log(`  - ID: ${patient.id} | Name: ${patient.firstName} ${patient.lastName} | Email: ${patient.email}`);
      });
    }
    
    console.log("\n3. 🔍 CHECKING USERS TABLE");
    console.log("--------------------------------------------------");
    
    // Get all users to see if there's a Kaleia user account
    try {
      const usersResponse = await axios.get(`${API_BASE}/users`, {
        headers: {
          'Authorization': 'Bearer temp-admin-token'
        }
      });
      
      const kaleiaUsers = usersResponse.data.filter(user => 
        (user.firstName && user.firstName.toLowerCase().includes('kaleia')) ||
        (user.lastName && user.lastName.toLowerCase().includes('aris')) ||
        (user.email && user.email.toLowerCase().includes('kal')) ||
        (user.username && user.username.toLowerCase().includes('kal'))
      );
      
      if (kaleiaUsers.length > 0) {
        console.log("👤 KALEIA USER ACCOUNTS:");
        kaleiaUsers.forEach((user, index) => {
          console.log(`User ${index + 1}:`);
          console.log(`  - User ID: ${user.id}`);
          console.log(`  - Username: ${user.username}`);
          console.log(`  - Name: ${user.firstName} ${user.lastName}`);
          console.log(`  - Email: ${user.email}`);
          console.log(`  - Role: ${user.role}`);
          console.log(`  - Patient ID: ${user.patientId || 'Not linked'}`);
          console.log("  ---");
        });
      } else {
        console.log("❌ No user accounts found for Kaleia");
      }
      
    } catch (userError) {
      console.log("❌ Could not fetch users:", userError.message);
    }
    
    console.log("\n4. 🔗 PATIENT-USER RELATIONSHIP ANALYSIS");
    console.log("--------------------------------------------------");
    
    if (kaleiaPatients.length > 0 && kaleiaPatients[0]) {
      const patient = kaleiaPatients[0];
      console.log(`Target Patient: ID ${patient.id} (${patient.firstName} ${patient.lastName})`);
      
      // Check what appointments exist for this patient
      const appointmentsResponse = await axios.get(`${API_BASE}/appointments`, {
        headers: {
          'Authorization': 'Bearer temp-admin-token'
        }
      });
      
      const patientAppointments = appointmentsResponse.data.filter(apt => apt.patientId === patient.id);
      console.log(`Appointments for Patient ID ${patient.id}: ${patientAppointments.length}`);
      
      if (patientAppointments.length > 0) {
        patientAppointments.forEach(apt => {
          console.log(`  - Appointment ID: ${apt.id} | Date: ${apt.appointmentDate} | Time: ${apt.appointmentTime}`);
        });
      }
    }
    
    console.log("\n5. 🎯 CORRECT NOTIFICATION SCRIPT");
    console.log("--------------------------------------------------");
    
    if (kaleiaPatients.length > 0) {
      const correctPatientId = kaleiaPatients[0].id;
      
      console.log(`✅ CORRECT PATIENT ID: ${correctPatientId}`);
      console.log("\n🔧 CORRECTED BROWSER SCRIPT:");
      console.log("Copy and paste this in the browser console:");
      console.log("```javascript");
      
      const correctedNotification = {
        id: `notif_${Date.now()}`,
        patientId: correctPatientId,
        appointmentId: 22,
        appointmentDate: "2025-09-19",
        appointmentTime: "14:30:00",
        serviceType: "Consultation",
        doctorName: "Available Doctor",
        notes: "Your appointment has been scheduled. A doctor will be assigned based on availability.",
        status: "pending",
        createdAt: new Date().toISOString(),
        type: "appointment_scheduled",
        requiresDoctorAssignment: true,
        clinicLocation: "Main Clinic",
        estimatedDuration: 30
      };
      
      const scriptCode = `localStorage.setItem('patientNotifications', '${JSON.stringify([correctedNotification])}');
console.log('✅ Corrected notification added with Patient ID: ${correctPatientId}');
console.log('📱 Close and reopen notifications modal to see the change');`;
      
      console.log(scriptCode);
      console.log("```");
      
    } else {
      console.log("❌ Could not determine correct patient ID - no Kaleia patient found");
    }
    
  } catch (error) {
    console.error("❌ Debug error:", error.message);
    if (error.response) {
      console.error("Response:", error.response.data);
    }
  }
}

// Run the debug
debugPatientIDs();