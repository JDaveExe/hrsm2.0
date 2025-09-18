const { sequelize } = require('./backend/config/database');

async function debugPrescriptionData() {
  try {
    console.log('🔍 Debugging prescription data in database...\n');

    // Check all check_in_sessions
    const [allSessions] = await sequelize.query(`
      SELECT id, status, prescription, completedAt, assignedDoctor, createdAt
      FROM check_in_sessions 
      ORDER BY id DESC 
      LIMIT 20
    `);

    console.log('📊 Recent check-in sessions:');
    allSessions.forEach((session, i) => {
      console.log(`  ${i + 1}. ID: ${session.id}, Status: ${session.status}`);
      console.log(`     Prescription: ${session.prescription ? 'YES' : 'NO'}`);
      console.log(`     Completed: ${session.completedAt}`);
      console.log('     ---');
    });

    // Check completed sessions with prescriptions
    const [completedWithPrescriptions] = await sequelize.query(`
      SELECT id, status, prescription, completedAt, assignedDoctor
      FROM check_in_sessions 
      WHERE prescription IS NOT NULL 
        AND prescription != '' 
        AND prescription != 'null'
        AND status = 'completed'
      ORDER BY id DESC
    `);

    console.log(`\n💊 Found ${completedWithPrescriptions.length} completed sessions with prescriptions:`);
    
    completedWithPrescriptions.forEach((session, i) => {
      console.log(`  ${i + 1}. Session ID: ${session.id}`);
      console.log(`     Status: ${session.status}`);
      console.log(`     Completed: ${session.completedAt}`);
      console.log(`     Doctor: ${session.assignedDoctor}`);
      
      try {
        const prescriptions = JSON.parse(session.prescription);
        console.log(`     Prescriptions (${prescriptions.length}):`);
        prescriptions.forEach((presc, j) => {
          console.log(`       ${j + 1}. ${presc.medication || presc.medicine} - ${presc.quantity} units`);
        });
      } catch (e) {
        console.log(`     Prescription parse error: ${e.message}`);
      }
      console.log('     ---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

debugPrescriptionData();
