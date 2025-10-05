const { CheckInSession, Patient, User } = require('./backend/models');
const { Op } = require('sequelize');

async function debugCheckupAssignments() {
  try {
    console.log('🔍 Debugging checkup assignments...');
    
    // Get all active checkup sessions
    const checkups = await CheckInSession.findAll({
      where: {
        status: {
          [Op.in]: ['started', 'in-progress', 'completed']
        }
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      attributes: ['id', 'patientId', 'status', 'assignedDoctor', 'createdAt']
    });
    
    console.log('\n📋 Current Checkup Assignments:');
    console.log('=' .repeat(80));
    
    if (checkups.length === 0) {
      console.log('No active checkups found.');
      return;
    }
    
    for (const checkup of checkups) {
      const patient = checkup.Patient;
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
      
      console.log(`\n🏥 Checkup ID: ${checkup.id}`);
      console.log(`👤 Patient: ${patientName} (ID: ${checkup.patientId})`);
      console.log(`📊 Status: ${checkup.status}`);
      console.log(`👩‍⚕️ Assigned Doctor: ${checkup.assignedDoctor || 'NONE (This is the problem!)'}`);
      console.log(`📅 Created: ${checkup.createdAt}`);
      console.log('-'.repeat(50));
    }
    
    // Get all doctors for reference
    console.log('\n👩‍⚕️ Available Doctors:');
    console.log('=' .repeat(40));
    
    const doctors = await User.findAll({
      where: {
        role: 'Doctor'
      },
      attributes: ['id', 'firstName', 'lastName', 'email']
    });
    
    for (const doctor of doctors) {
      console.log(`ID: ${doctor.id} - ${doctor.firstName} ${doctor.lastName} (${doctor.email})`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging checkup assignments:', error);
  }
}

debugCheckupAssignments().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});
