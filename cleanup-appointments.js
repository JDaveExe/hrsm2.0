/**
 * Appointment Cleanup Script
 * Safely removes all existing appointments from the system for clean testing
 * This will clear both admin view and patient appointment histories
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

class AppointmentCleaner {
  constructor() {
    this.adminToken = null;
    this.deletedCount = 0;
  }

  async authenticate() {
    try {
      console.log('🔐 Authenticating as admin...');
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        login: 'admin',
        password: 'admin123'
      });
      this.adminToken = response.data.token;
      console.log('✅ Admin authentication successful');
      return true;
    } catch (error) {
      console.error('❌ Admin authentication failed:', error.response?.data || error.message);
      return false;
    }
  }

  async getAllAppointments() {
    try {
      const headers = { 'Authorization': `Bearer ${this.adminToken}` };
      const response = await axios.get(`${BASE_URL}/appointments`, { headers });
      return response.data || [];
    } catch (error) {
      console.error('❌ Failed to get appointments:', error.response?.data || error.message);
      return [];
    }
  }

  async deleteAppointment(appointmentId, patientName = 'Unknown') {
    try {
      const headers = { 'Authorization': `Bearer ${this.adminToken}` };
      await axios.delete(`${BASE_URL}/appointments/${appointmentId}`, { headers });
      this.deletedCount++;
      console.log(`✅ Deleted appointment ${appointmentId} (${patientName})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete appointment ${appointmentId}:`, error.response?.data?.msg || error.message);
      return false;
    }
  }

  async cleanAllAppointments() {
    console.log('🧹 Starting comprehensive appointment cleanup...');
    console.log('⚠️  This will remove ALL appointments from the system (admin + patient histories)');
    
    // Get all appointments
    const appointments = await this.getAllAppointments();
    
    if (appointments.length === 0) {
      console.log('✅ No appointments found - system is already clean');
      return true;
    }

    console.log(`📋 Found ${appointments.length} appointments to clean:`);
    
    // Display appointments that will be deleted
    appointments.forEach((apt, index) => {
      const patientName = apt.patient ? 
        `${apt.patient.firstName} ${apt.patient.lastName}` : 
        apt.patientName || `Patient ID: ${apt.patientId}`;
      const date = apt.appointmentDate || apt.date;
      const time = apt.appointmentTime || apt.time;
      const status = apt.status;
      const type = apt.type;
      
      console.log(`   ${index + 1}. ${patientName} - ${date} ${time} (${type}) [${status}]`);
    });

    console.log('\\n🗑️  Proceeding with deletion...');

    // Delete all appointments
    let successCount = 0;
    for (const appointment of appointments) {
      const patientName = appointment.patient ? 
        `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
        appointment.patientName || `Patient ID: ${appointment.patientId}`;
      
      const success = await this.deleteAppointment(appointment.id, patientName);
      if (success) successCount++;
      
      // Small delay to prevent overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\\n📊 CLEANUP SUMMARY:');
    console.log('='.repeat(40));
    console.log(`Total appointments found: ${appointments.length}`);
    console.log(`Successfully deleted: ${successCount}`);
    console.log(`Failed to delete: ${appointments.length - successCount}`);
    console.log('='.repeat(40));

    if (successCount === appointments.length) {
      console.log('🎉 All appointments successfully cleaned!');
      console.log('✅ System is now ready for testing');
    } else {
      console.log('⚠️  Some appointments could not be deleted');
      console.log('   Please check server logs for details');
    }

    return successCount === appointments.length;
  }

  async verifyCleanup() {
    console.log('\\n🔍 Verifying cleanup...');
    const remainingAppointments = await this.getAllAppointments();
    
    if (remainingAppointments.length === 0) {
      console.log('✅ Verification passed - No appointments remaining');
      return true;
    } else {
      console.log(`❌ Verification failed - ${remainingAppointments.length} appointments still exist:`);
      remainingAppointments.forEach((apt, index) => {
        const patientName = apt.patient ? 
          `${apt.patient.firstName} ${apt.patient.lastName}` : 
          `Patient ID: ${apt.patientId}`;
        console.log(`   ${index + 1}. ${patientName} - ${apt.appointmentDate} ${apt.appointmentTime} [${apt.status}]`);
      });
      return false;
    }
  }

  async run() {
    console.log('🗑️  APPOINTMENT SYSTEM CLEANUP');
    console.log('=' .repeat(50));
    console.log('This script will remove ALL appointments from the system');
    console.log('including both admin view and patient histories');
    console.log('=' .repeat(50));
    console.log('');

    if (!await this.authenticate()) {
      console.log('❌ Cannot proceed without authentication');
      return false;
    }

    const success = await this.cleanAllAppointments();
    
    if (success) {
      await this.verifyCleanup();
    }

    console.log('\\n🏁 Cleanup process completed');
    return success;
  }
}

// Run cleanup if this file is executed directly
if (require.main === module) {
  const cleaner = new AppointmentCleaner();
  cleaner.run().then(success => {
    if (success) {
      console.log('\\n✅ System is clean and ready for testing!');
      console.log('You can now run: node run-appointment-tests.js');
    } else {
      console.log('\\n❌ Cleanup completed with issues');
    }
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  });
}

module.exports = AppointmentCleaner;