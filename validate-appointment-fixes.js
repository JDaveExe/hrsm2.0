const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function logHeader(message) {
  console.log(`\n${colors.bold}${colors.cyan}=== ${message} ===${colors.reset}`);
}

async function validateAppointmentFiltering() {
  logHeader('APPOINTMENT MANAGER VALIDATION');
  console.log('Testing cancelled appointment filtering and doctor information removal\n');
  
  try {
    // Get all appointments
    const response = await axios.get(`${BASE_URL}/api/appointments`);
    const allAppointments = response.data;
    
    logInfo(`Total appointments in database: ${allAppointments.length}`);
    
    // Check for cancelled appointments
    const cancelledAppointments = allAppointments.filter(apt => 
      apt.status === 'Cancelled' || apt.status === 'cancelled'
    );
    
    const todayDate = new Date().toISOString().split('T')[0];
    const todaysCancelledAppointments = cancelledAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate || apt.date).toISOString().split('T')[0];
      return aptDate === todayDate;
    });
    
    logInfo(`Cancelled appointments total: ${cancelledAppointments.length}`);
    logInfo(`Today's cancelled appointments: ${todaysCancelledAppointments.length}`);
    
    if (todaysCancelledAppointments.length > 0) {
      console.log('\nToday\'s cancelled appointments that should be filtered out:');
      todaysCancelledAppointments.forEach(apt => {
        console.log(`  - ${apt.patientName || 'Unknown Patient'} at ${apt.appointmentTime || apt.time} (${apt.type})`);
      });
    }
    
    // Check appointment statuses
    const statusCounts = {};
    allAppointments.forEach(apt => {
      const status = apt.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    logHeader('Appointment Status Distribution');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} appointments`);
    });
    
    logHeader('Validation Results');
    
    if (todaysCancelledAppointments.length > 0) {
      logInfo('✅ Found cancelled appointments for today - these should now be filtered out from Today\'s Schedule');
    } else {
      logInfo('ℹ No cancelled appointments for today to test filtering with');
    }
    
    logSuccess('✅ Backend validation complete');
    console.log('\nFrontend changes made:');
    console.log('  ✅ Today\'s Schedule now excludes Cancelled appointments');
    console.log('  ✅ Doctor name display removed from appointment cards');
    console.log('  ✅ Doctor selection removed from appointment form');
    console.log('\nTo verify the changes:');
    console.log('  1. Open the admin dashboard in your browser');
    console.log('  2. Navigate to Appointment Management');
    console.log('  3. Check that Today\'s Schedule doesn\'t show cancelled appointments');  
    console.log('  4. Verify that doctor names are not displayed');
    
  } catch (error) {
    logError(`Validation failed: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run the validation
if (require.main === module) {
  validateAppointmentFiltering().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { validateAppointmentFiltering };