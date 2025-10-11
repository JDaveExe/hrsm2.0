const db = require('./backend/config/database');
const { CheckInSession } = require('./backend/models');

async function checkSessionData() {
  try {
    console.log('🔍 CHECKING SESSION DATA');
    console.log('=========================');
    
    // Check last few sessions
    const sessions = await CheckInSession.findAll({
      limit: 5,
      order: [['id', 'DESC']],
      raw: true
    });
    
    console.log('📊 Last 5 sessions:');
    sessions.forEach(session => {
      console.log(`  Session ${session.id}:`);
      console.log(`    - Patient: ${session.patientId}`);
      console.log(`    - Status: ${session.status}`);
      console.log(`    - AssignedDoctor: ${session.assignedDoctor}`);
      console.log(`    - CreatedBy: ${session.createdBy}`);
      console.log('');
    });
    
    // Check the specific session we just created
    const targetSession = await CheckInSession.findByPk(869, { raw: true });
    console.log('🎯 Target Session 869:');
    if (targetSession) {
      console.log(`  - Patient: ${targetSession.patientId}`);
      console.log(`  - Status: ${targetSession.status}`);
      console.log(`  - AssignedDoctor: ${targetSession.assignedDoctor}`);
      console.log(`  - CreatedBy: ${targetSession.createdBy}`);
      console.log(`  - AppointmentId: ${targetSession.appointmentId}`);
    } else {
      console.log('  Session not found');
    }
    
  } catch (error) {
    console.error('❌ Error checking session data:', error);
  } finally {
    await db.close();
  }
}

checkSessionData();