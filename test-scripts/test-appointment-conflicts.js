/**
 * Appointment Conflict Testing Script
 * Tests the scenario where multiple patients try to book same date/time
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configurations
const TEST_CONFIG = {
  adminAuth: {
    login: 'admin',
    password: 'admin123'
  },
  patientAuth: {
    // We'll create test patients
    patient1: { firstName: 'TestPatient', lastName: 'One', email: 'patient1@test.com' },
    patient2: { firstName: 'TestPatient', lastName: 'Two', email: 'patient2@test.com' }
  },
  testAppointment: {
    appointmentDate: '2025-12-15', // Future date unlikely to have conflicts
    appointmentTime: '09:00',
    type: 'Consultation',
    duration: 30
  }
};

class AppointmentTester {
  constructor() {
    this.adminToken = null;
    this.patient1Id = null;
    this.patient2Id = null;
    this.createdAppointments = [];
    this.createdTestPatients = [];
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating as admin...');
      const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CONFIG.adminAuth);
      this.adminToken = response.data.token;
      console.log('✅ Admin authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Admin authentication failed:', error.response?.data || error.message);
      return false;
    }
  }

  async getExistingPatients() {
    try {
      console.log('👥 Finding existing patients (Kaleia Aris & Derick Bautista)...');
      const headers = { 'Authorization': `Bearer ${this.adminToken}` };

      // Get all patients
      const response = await axios.get(`${BASE_URL}/patients`, { headers });
      const patients = response.data;

      // Check for patients without recent cancellations (to avoid cooldown issues)
      console.log(`📋 Available patients in system: ${patients.length}`);
      
      // Get all recent cancellations to avoid cooldown patients
      const appointmentsResponse = await axios.get(`${BASE_URL}/appointments`, { headers });
      const recentCancellations = appointmentsResponse.data.filter(apt => {
        if (apt.status !== 'Cancelled') return false;
        const cancelTime = new Date(apt.updatedAt);
        const now = new Date();
        const hoursSinceCancellation = (now - cancelTime) / (1000 * 60 * 60);
        return hoursSinceCancellation < 24; // Within 24 hours
      });
      
      const patientsInCooldown = recentCancellations.map(apt => apt.patientId);
      console.log(`⏰ Patients in cooldown: ${patientsInCooldown.length}`);
      
      // Find patients NOT in cooldown
      const availablePatients = patients.filter(p => !patientsInCooldown.includes(p.id));
      console.log(`✅ Available patients (not in cooldown): ${availablePatients.length}`);
      
      // Always create fresh test patients to avoid any existing appointment conflicts
      console.log('🔧 Creating fresh temporary test patients for clean testing...');
      return await this.createTemporaryTestPatients();

      if (!this.patient1Id || !this.patient2Id) {
        console.error('❌ Could not find at least 2 patients in the system');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to get existing patients:', error.response?.data || error.message);
      return false;
    }
  }

  async createTemporaryTestPatients() {
    try {
      console.log('👥 Creating temporary test patients for testing...');
      const headers = { 'Authorization': `Bearer ${this.adminToken}` };

      const timestamp = Date.now();
      const lastDigits = timestamp.toString().slice(-8); // Get last 8 digits of timestamp

      // Create Patient 1
      const patient1Data = {
        firstName: 'TestPatient',
        lastName: 'One',
        email: `testpatient1_${timestamp}@test.com`,
        contactNumber: `091${lastDigits}`, // 091 + 8 digits = 11 digits total
        dateOfBirth: '1990-01-01',
        gender: 'Male',
        address: 'Test Address 1'
      };

      const patient1Response = await axios.post(`${BASE_URL}/patients`, patient1Data, { headers });
      this.patient1Id = patient1Response.data.id;
      this.createdTestPatients = [this.patient1Id]; // Track for cleanup
      console.log(`✅ Created test patient 1 with ID: ${this.patient1Id}`);

      // Create Patient 2  
      const alteredDigits = (parseInt(lastDigits) + 1).toString().padStart(8, '0'); // Increment by 1
      const patient2Data = {
        firstName: 'TestPatient',
        lastName: 'Two',
        email: `testpatient2_${timestamp}@test.com`,
        contactNumber: `092${alteredDigits}`, // 092 + 8 digits = 11 digits total
        dateOfBirth: '1992-01-01',
        gender: 'Female',
        address: 'Test Address 2'
      };

      const patient2Response = await axios.post(`${BASE_URL}/patients`, patient2Data, { headers });
      this.patient2Id = patient2Response.data.id;
      this.createdTestPatients.push(this.patient2Id);
      console.log(`✅ Created test patient 2 with ID: ${this.patient2Id}`);

      return true;
    } catch (error) {
      console.error('❌ Failed to create temporary test patients:', error.response?.data || error.message);
      return false;
    }
  }

  async clearExistingAppointments(patientId) {
    try {
      const headers = { 'Authorization': `Bearer ${this.adminToken}` };
      
      // Get all appointments for this patient
      const response = await axios.get(`${BASE_URL}/appointments`, { headers });
      const appointments = response.data.filter(apt => 
        apt.patientId === patientId && 
        apt.status === 'Scheduled' && 
        apt.isActive
      );
      
      // Cancel existing active appointments
      for (const appointment of appointments) {
        try {
          await axios.put(`${BASE_URL}/appointments/${appointment.id}/cancel`, {}, { headers });
          console.log(`🗑️ Cancelled existing appointment ${appointment.id} for patient ${patientId}`);
        } catch (error) {
          console.log(`⚠️ Could not cancel appointment ${appointment.id}: ${error.response?.data?.msg || error.message}`);
        }
      }
    } catch (error) {
      console.log(`⚠️ Error clearing appointments for patient ${patientId}: ${error.response?.data?.msg || error.message}`);
    }
  }

  async testScenario1_ExactSameTimeConflict() {
    console.log('\\n🧪 TEST SCENARIO 1: Exact Same Date/Time Conflict');
    console.log('Expected: Second booking should be rejected');

    try {
      const headers = { 'Authorization': `Bearer ${this.adminToken}` };
      
      // Clear any existing appointments for both patients
      console.log('🧹 Clearing existing appointments for test patients...');
      await this.clearExistingAppointments(this.patient1Id);
      await this.clearExistingAppointments(this.patient2Id);
      
      const appointmentData = {
        patientId: this.patient1Id,
        ...TEST_CONFIG.testAppointment
      };

      // Patient 1 books appointment
      console.log('📅 Patient 1 (Kaleia) booking appointment...');
      const booking1 = await axios.post(`${BASE_URL}/appointments`, appointmentData, { headers });
      this.createdAppointments.push(booking1.data.id);
      console.log('✅ Patient 1 booking successful');

      // Patient 2 tries to book EXACT same date/time but different service type
      console.log('📅 Patient 2 trying to book same date/time with different service...');
      const conflictData = {
        patientId: this.patient2Id,
        ...TEST_CONFIG.testAppointment,
        type: 'Check-up' // Different service type
      };

      try {
        const booking2 = await axios.post(`${BASE_URL}/appointments`, conflictData, { headers });
        console.log('❌ FAILED: Patient 2 booking should have been rejected but was accepted!');
        this.createdAppointments.push(booking2.data.id);
        return false;
      } catch (conflictError) {
        if (conflictError.response?.status === 400) {
          console.log('✅ SUCCESS: Patient 2 booking correctly rejected');
          console.log('📝 Error message:', conflictError.response.data.error || conflictError.response.data.msg);
          return true;
        } else {
          console.log('❌ UNEXPECTED ERROR:', conflictError.response?.data || conflictError.message);
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Test scenario 1 failed:', error.response?.data || error.message);
      return false;
    }
  }

  async testScenario2_DailyLimitTest() {
    console.log('\\n🧪 TEST SCENARIO 2: Daily Appointment Limit (12 per day)');
    console.log('Expected: After 12 appointments, 13th should be rejected');

    try {
      const headers = { 'Authorization': `Bearer ${this.adminToken}` };
      const testDate = '2025-12-16'; // Different date for this test
      let successfulBookings = 0;

      // Try to book 15 appointments (5 more than limit)
      for (let i = 1; i <= 15; i++) {
        const appointmentData = {
          patientId: i % 2 === 0 ? this.patient1Id : this.patient2Id, // Alternate patients
          appointmentDate: testDate,
          appointmentTime: String(8 + Math.floor(i / 2)).padStart(2, '0') + ':' + (i % 2 === 0 ? '30' : '00'),
          type: i % 3 === 0 ? 'Check-up' : i % 3 === 1 ? 'Consultation' : 'Follow-up',
          duration: 30
        };

        try {
          const response = await axios.post(`${BASE_URL}/appointments`, appointmentData, { headers });
          successfulBookings++;
          this.createdAppointments.push(response.data.id);
          console.log(`✅ Appointment ${i} booked successfully`);
        } catch (error) {
          if (successfulBookings >= 12) {
            console.log(`✅ SUCCESS: Daily limit reached at ${successfulBookings} appointments`);
            console.log('📝 Rejection message:', error.response?.data?.error || error.response?.data?.msg);
            return true;
          } else {
            console.log(`❌ FAILED: Booking ${i} rejected too early (only ${successfulBookings} booked)`);
            return false;
          }
        }
      }

      if (successfulBookings > 12) {
        console.log(`❌ FAILED: Booked ${successfulBookings} appointments, should have been limited to 12`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Test scenario 2 failed:', error.response?.data || error.message);
      return false;
    }
  }

  async testScenario3_BufferTimeValidation() {
    console.log('\\n🧪 TEST SCENARIO 3: 30-Minute Buffer Validation');
    console.log('Expected: Appointments within 30 minutes should be rejected');

    try {
      const headers = { 'Authorization': `Bearer ${this.adminToken}` };
      const testDate = '2025-12-17';

      // Book appointment at 14:00
      const baseAppointment = {
        patientId: this.patient1Id,
        appointmentDate: testDate,
        appointmentTime: '14:00',
        type: 'Consultation',
        duration: 30
      };

      const booking1 = await axios.post(`${BASE_URL}/appointments`, baseAppointment, { headers });
      this.createdAppointments.push(booking1.data.id);
      console.log('✅ Base appointment at 14:00 booked');

      // Try to book at 14:15 (within 30-minute buffer)
      try {
        const conflictAppointment = {
          patientId: this.patient2Id,
          appointmentDate: testDate,
          appointmentTime: '14:15',
          type: 'Check-up',
          duration: 30
        };

        const booking2 = await axios.post(`${BASE_URL}/appointments`, conflictAppointment, { headers });
        console.log('❌ FAILED: 14:15 booking should have been rejected (within 30-min buffer)');
        this.createdAppointments.push(booking2.data.id);
        return false;
      } catch (error) {
        console.log('✅ SUCCESS: 14:15 booking correctly rejected');
        console.log('📝 Error message:', error.response?.data?.error || error.response?.data?.msg);
      }

      // Try to book at 14:30 (exactly 30 minutes - should be allowed)
      try {
        const allowedAppointment = {
          patientId: this.patient2Id,
          appointmentDate: testDate,
          appointmentTime: '14:30',
          type: 'Check-up',
          duration: 30
        };

        const booking3 = await axios.post(`${BASE_URL}/appointments`, allowedAppointment, { headers });
        this.createdAppointments.push(booking3.data.id);
        console.log('✅ SUCCESS: 14:30 booking correctly allowed (30+ minutes apart)');
        return true;
      } catch (error) {
        console.log('❌ FAILED: 14:30 booking should have been allowed');
        console.log('📝 Error message:', error.response?.data?.error || error.response?.data?.msg);
        return false;
      }

    } catch (error) {
      console.error('❌ Test scenario 3 failed:', error.response?.data || error.message);
      return false;
    }
  }

  async cleanup() {
    console.log('\\n🧹 Cleaning up test data...');
    try {
      const headers = { 'Authorization': `Bearer ${this.adminToken}` };

      // Delete created appointments
      for (const appointmentId of this.createdAppointments) {
        try {
          await axios.delete(`${BASE_URL}/appointments/${appointmentId}`, { headers });
          console.log(`✅ Deleted appointment ${appointmentId}`);
        } catch (error) {
          console.log(`⚠️  Could not delete appointment ${appointmentId}:`, error.response?.data?.msg || error.message);
        }
      }

      // Delete any temporary test patients we created
      if (this.createdTestPatients && this.createdTestPatients.length > 0) {
        console.log('🗑️ Cleaning up temporary test patients...');
        for (const patientId of this.createdTestPatients) {
          try {
            await axios.delete(`${BASE_URL}/patients/${patientId}`, { headers });
            console.log(`✅ Deleted temporary patient ${patientId}`);
          } catch (error) {
            console.log(`⚠️  Could not delete temporary patient ${patientId}`);
          }
        }
      } else {
        console.log('ℹ️  Using existing patients - no patient cleanup needed');
      }

      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Appointment Conflict Tests\\n');

    if (!await this.authenticate()) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }

    if (!await this.getExistingPatients()) {
      console.log('❌ Cannot proceed without test patients');
      return;
    }

    const results = {
      scenario1: await this.testScenario1_ExactSameTimeConflict(),
      scenario2: await this.testScenario2_DailyLimitTest(),
      scenario3: await this.testScenario3_BufferTimeValidation()
    };

    console.log('\\n📊 TEST RESULTS SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Exact Time Conflict Test: ${results.scenario1 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Daily Limit Test: ${results.scenario2 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Buffer Time Test: ${results.scenario3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('='.repeat(50));

    const passedTests = Object.values(results).filter(Boolean).length;
    console.log(`Overall: ${passedTests}/3 tests passed\\n`);

    await this.cleanup();

    if (passedTests === 3) {
      console.log('🎉 All tests passed! Appointment system is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the implementation.');
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new AppointmentTester();
  tester.runAllTests().catch(console.error);
}

module.exports = AppointmentTester;