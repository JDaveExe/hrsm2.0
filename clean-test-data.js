// Script to clean test appointment data for fresh start
console.log('🧹 Cleaning Test Appointment Data');
console.log('=================================\n');

async function deleteTestAppointments() {
  console.log('🔍 Finding test appointments to delete...');
  
  try {
    // First, get all current appointments
    const response = await fetch('http://localhost:5000/api/appointments', {
      headers: {
        'x-auth-token': 'temp-admin-token',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.status}`);
    }
    
    const appointments = await response.json();
    
    console.log(`Found ${appointments.length} appointments to clean:`);
    appointments.forEach((apt, index) => {
      console.log(`  ${index + 1}. ID: ${apt.id} | ${apt.appointmentDate} ${apt.appointmentTime} | ${apt.type} | Patient: ${apt.patient?.firstName} ${apt.patient?.lastName}`);
    });
    
    if (appointments.length === 0) {
      console.log('✅ No appointments to delete - database is already clean!');
      return;
    }
    
    // Delete each appointment
    console.log('\n🗑️ Deleting appointments...');
    for (const appointment of appointments) {
      try {
        const deleteResponse = await fetch(`http://localhost:5000/api/appointments/${appointment.id}?permanent=true`, {
          method: 'DELETE',
          headers: {
            'x-auth-token': 'temp-admin-token',
            'Content-Type': 'application/json'
          }
        });
        
        if (deleteResponse.ok) {
          console.log(`✅ Deleted appointment ID ${appointment.id}`);
        } else {
          const errorData = await deleteResponse.json();
          console.log(`❌ Failed to delete appointment ID ${appointment.id}: ${errorData.msg || 'Unknown error'}`);
        }
        
      } catch (error) {
        console.log(`❌ Network error deleting appointment ID ${appointment.id}: ${error.message}`);
      }
    }
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const verifyResponse = await fetch('http://localhost:5000/api/appointments', {
      headers: {
        'x-auth-token': 'temp-admin-token',
        'Content-Type': 'application/json'
      }
    });
    
    const remainingAppointments = await verifyResponse.json();
    
    if (remainingAppointments.length === 0) {
      console.log('✅ Database successfully cleaned! No appointments remain.');
      console.log('\n🎯 Fresh Start Ready:');
      console.log('   • Database is empty and ready for backend implementation');
      console.log('   • Admin dashboard should show "No appointments scheduled"');
      console.log('   • Calendar should have no appointment indicators');
      console.log('   • System is ready for proper appointment workflow testing');
    } else {
      console.log(`⚠️ ${remainingAppointments.length} appointments still remain in database`);
      remainingAppointments.forEach((apt, index) => {
        console.log(`  ${index + 1}. ID: ${apt.id} | ${apt.appointmentDate} ${apt.appointmentTime}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to clean test data:', error.message);
    console.log('🔧 This might indicate a backend connectivity issue');
  }
}

async function main() {
  try {
    await deleteTestAppointments();
    
    console.log('\n✅ Test data cleanup complete!');
    console.log('🚀 Ready to proceed with backend implementation');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Execute cleanup
main();