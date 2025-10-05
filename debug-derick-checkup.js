const { CheckInSession, Patient, User } = require('./backend/models');
const { Op } = require('sequelize');

async function debugDerickCheckup() {
  try {
    console.log('🔍 Looking for Derick Bautista checkups...');
    
    // Find Derick Bautista patient record
    const derickPatient = await Patient.findOne({
      where: {
        [Op.or]: [
          { firstName: { [Op.like]: '%Derick%' } },
          { lastName: { [Op.like]: '%Bautista%' } }
        ]
      }
    });
    
    if (derickPatient) {
      console.log('👤 Found Derick:', derickPatient.firstName, derickPatient.lastName, 'ID:', derickPatient.id);
      
      // Find all checkups for Derick
      const derickCheckups = await CheckInSession.findAll({
        where: {
          patientId: derickPatient.id
        },
        order: [['createdAt', 'DESC']]
      });
      
      console.log(`\n📋 Derick's Checkups (${derickCheckups.length} found):`);
      console.log('=' .repeat(60));
      
      for (const checkup of derickCheckups) {
        console.log(`\n🏥 Checkup ID: ${checkup.id}`);
        console.log(`📊 Status: ${checkup.status}`);
        console.log(`👩‍⚕️ Assigned Doctor: ${checkup.assignedDoctor || 'NONE'}`);
        console.log(`📅 Created: ${checkup.createdAt}`);
        console.log(`📅 Check-in Time: ${checkup.checkInTime}`);
        console.log('-'.repeat(40));
      }
    } else {
      console.log('❌ Derick Bautista not found in patient database');
    }
    
    // Also check for any checkups with "started" status
    console.log('\n🚀 All Started Checkups:');
    console.log('=' .repeat(50));
    
    const startedCheckups = await CheckInSession.findAll({
      where: {
        status: 'started'
      },
      include: [
        {
          model: Patient,
          as: 'Patient',
          attributes: ['id', 'firstName', 'lastName']
        }
      ]
    });
    
    for (const checkup of startedCheckups) {
      const patient = checkup.Patient;
      const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
      
      console.log(`\n🏥 Checkup ID: ${checkup.id}`);
      console.log(`👤 Patient: ${patientName} (ID: ${checkup.patientId})`);
      console.log(`👩‍⚕️ Assigned Doctor: ${checkup.assignedDoctor || 'NONE (This is the problem!)'}`);
      console.log(`📅 Created: ${checkup.createdAt}`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging Derick checkups:', error);
  }
}

debugDerickCheckup().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});