const { CheckInSession, Patient, User } = require('./backend/models');
const { Op } = require('sequelize');

async function updateDerickCheckup() {
  try {
    console.log('🔧 Updating Derick checkup to started status for testing...');
    
    // Find Derick's checkup
    const derickCheckup = await CheckInSession.findOne({
      where: {
        id: 895
      }
    });
    
    if (derickCheckup) {
      console.log('📝 Before update:', {
        id: derickCheckup.id,
        status: derickCheckup.status,
        assignedDoctor: derickCheckup.assignedDoctor
      });
      
      // Update to started status to match what we see in the UI
      await derickCheckup.update({
        status: 'started'
      });
      
      console.log('✅ After update:', {
        id: derickCheckup.id,
        status: derickCheckup.status,
        assignedDoctor: derickCheckup.assignedDoctor
      });
      
      console.log('\n🧪 Now testing the API response...');
      
      // Simulate what the Default Doctor (ID: 10021) would see
      const defaultDoctorCheckups = await CheckInSession.findAll({
        where: {
          status: {
            [Op.in]: ['started', 'in-progress', 'completed']
          },
          assignedDoctor: 10021 // Default Doctor ID
        },
        include: [
          {
            model: Patient,
            as: 'Patient',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });
      
      console.log(`\n👨‍⚕️ Default Doctor (10021) should see: ${defaultDoctorCheckups.length} checkups`);
      for (const checkup of defaultDoctorCheckups) {
        const patient = checkup.Patient;
        const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
        console.log(`  - ${patientName} (Checkup ${checkup.id})`);
      }
      
      // Simulate what Johnny Davis (ID: 10017) would see
      const johnnyCheckups = await CheckInSession.findAll({
        where: {
          status: {
            [Op.in]: ['started', 'in-progress', 'completed']
          },
          assignedDoctor: 10017 // Johnny Davis ID
        },
        include: [
          {
            model: Patient,
            as: 'Patient',
            attributes: ['id', 'firstName', 'lastName']
          }
        ]
      });
      
      console.log(`\n👨‍⚕️ Johnny Davis (10017) should see: ${johnnyCheckups.length} checkups`);
      for (const checkup of johnnyCheckups) {
        const patient = checkup.Patient;
        const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
        console.log(`  - ${patientName} (Checkup ${checkup.id})`);
      }
      
    } else {
      console.log('❌ Derick checkup not found');
    }
    
  } catch (error) {
    console.error('❌ Error updating checkup:', error);
  }
}

updateDerickCheckup().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});