require('dotenv').config({ path: './backend/.env' });
const { Appointment, Patient, User } = require('./backend/models');
const { Op } = require('sequelize');

async function clearOldAppointments() {
  try {
    console.log('🔍 Searching for appointments to clear...');
    
    // Find all appointments
    const allAppointments = await Appointment.findAll({
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [['appointmentDate', 'DESC']]
    });

    console.log(`\n📋 Found ${allAppointments.length} total appointment(s) in database:`);
    
    if (allAppointments.length === 0) {
      console.log('✅ No appointments found in the database.');
      return;
    }

    // Display all appointments
    allAppointments.forEach((apt, index) => {
      const patientName = apt.patient ? 
        `${apt.patient.firstName} ${apt.patient.lastName}` : 
        'Unknown Patient';
      console.log(`${index + 1}. ID: ${apt.id} - ${patientName} - Date: ${apt.appointmentDate} Time: ${apt.appointmentTime} - Status: ${apt.status}`);
    });

    // Find appointments that should be cleared (old dates or test data)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const appointmentsToClear = allAppointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
      
      // Check if appointment is in the past or has test patient names
      const isOld = aptDate < today;
      const patientName = apt.patient ? 
        `${apt.patient.firstName} ${apt.patient.lastName}`.toLowerCase() : '';
      const isTestData = patientName.includes('test') || 
                         patientName.includes('mike cruz') || 
                         patientName.includes('miguel cruz');
      
      return isOld || isTestData;
    });

    if (appointmentsToClear.length === 0) {
      console.log('\n✅ No old or test appointments found to clear.');
      return;
    }

    console.log(`\n🗑️ Found ${appointmentsToClear.length} appointment(s) to clear:`);
    appointmentsToClear.forEach((apt, index) => {
      const patientName = apt.patient ? 
        `${apt.patient.firstName} ${apt.patient.lastName}` : 
        'Unknown Patient';
      console.log(`${index + 1}. ID: ${apt.id} - ${patientName} - Date: ${apt.appointmentDate}`);
    });

    // Prompt for confirmation
    console.log('\n⚠️  About to delete these appointments...');
    
    // Delete appointments
    const appointmentIds = appointmentsToClear.map(apt => apt.id);
    const deleteResult = await Appointment.destroy({
      where: {
        id: { [Op.in]: appointmentIds }
      }
    });

    console.log(`\n✅ Successfully deleted ${deleteResult} appointment(s) from the database.`);
    console.log('🎉 Appointment cleanup complete!');
    
    // Show remaining appointments
    const remainingAppointments = await Appointment.findAll({
      include: [
        {
          model: Patient,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });

    console.log(`\n📊 Remaining appointments: ${remainingAppointments.length}`);
    if (remainingAppointments.length > 0) {
      console.log('Remaining appointments:');
      remainingAppointments.forEach((apt, index) => {
        const patientName = apt.patient ? 
          `${apt.patient.firstName} ${apt.patient.lastName}` : 
          'Unknown Patient';
        console.log(`${index + 1}. ${patientName} - ${apt.appointmentDate} ${apt.appointmentTime} - ${apt.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error clearing appointments:', error);
  } finally {
    process.exit(0);
  }
}

clearOldAppointments();
