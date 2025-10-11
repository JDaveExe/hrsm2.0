const { sequelize } = require('./backend/config/database');

const testResetCheckupData = async () => {
  try {
    console.log('🧪 Starting Reset Checkup Data Test...\n');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');
    
    // Step 1: Show current checkup sessions BEFORE reset
    console.log('📊 BEFORE RESET - Current checkup sessions:');
    const [beforeSessions] = await sequelize.query(`
      SELECT id, patientId, status, createdAt, doctorNotified, assignedDoctor
      FROM check_in_sessions 
      ORDER BY createdAt DESC
      LIMIT 10
    `);
    
    if (beforeSessions.length === 0) {
      console.log('   - No checkup sessions found');
    } else {
      beforeSessions.forEach(session => {
        console.log(`   - ID: ${session.id}, Patient: ${session.patientId}, Status: ${session.status}, Doctor: ${session.assignedDoctor || 'None'}`);
      });
    }
    
    // Step 2: Show sessions count by status BEFORE reset
    console.log('\n📈 BEFORE RESET - Sessions by status:');
    const [beforeStatusCount] = await sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM check_in_sessions 
      GROUP BY status 
      ORDER BY status
    `);
    
    if (beforeStatusCount.length === 0) {
      console.log('   - No sessions found');
    } else {
      beforeStatusCount.forEach(stat => {
        console.log(`   - ${stat.status}: ${stat.count} sessions`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🔄 PERFORMING RESET OPERATION...');
    console.log('='.repeat(50));
    
    // Step 3: Perform the reset operation (same as the script)
    
    // Delete sessions with 'transferred', 'started', 'in-progress', 'completed' status
    const [deleteResult] = await sequelize.query(`
      DELETE FROM check_in_sessions 
      WHERE status IN ('transferred', 'started', 'in-progress', 'completed')
    `);
    
    console.log(`✅ Deleted ${deleteResult.affectedRows || 0} checkup sessions with completed statuses`);
    
    // Reset 'doctor-notified' sessions back to 'checked-in' status
    const [resetResult] = await sequelize.query(`
      UPDATE check_in_sessions 
      SET status = 'checked-in', 
          doctorNotified = FALSE, 
          notifiedAt = NULL,
          assignedDoctor = NULL,
          startedAt = NULL,
          notes = NULL,
          doctorNotes = NULL,
          diagnosis = NULL,
          prescription = NULL
      WHERE status = 'doctor-notified'
    `);
    
    console.log(`✅ Reset ${resetResult.affectedRows || 0} doctor-notified sessions back to checked-in`);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 AFTER RESET - Results:');
    console.log('='.repeat(50));
    
    // Step 4: Show results AFTER reset
    const [afterSessions] = await sequelize.query(`
      SELECT id, patientId, status, createdAt, doctorNotified, assignedDoctor
      FROM check_in_sessions 
      ORDER BY createdAt DESC
      LIMIT 10
    `);
    
    if (afterSessions.length === 0) {
      console.log('   - No checkup sessions remaining');
    } else {
      console.log('Remaining sessions:');
      afterSessions.forEach(session => {
        console.log(`   - ID: ${session.id}, Patient: ${session.patientId}, Status: ${session.status}, Doctor: ${session.assignedDoctor || 'None'}`);
      });
    }
    
    // Step 5: Show sessions count by status AFTER reset
    console.log('\n📈 AFTER RESET - Sessions by status:');
    const [afterStatusCount] = await sequelize.query(`
      SELECT status, COUNT(*) as count 
      FROM check_in_sessions 
      GROUP BY status 
      ORDER BY status
    `);
    
    if (afterStatusCount.length === 0) {
      console.log('   - No sessions found');
    } else {
      afterStatusCount.forEach(stat => {
        console.log(`   - ${stat.status}: ${stat.count} sessions`);
      });
    }
    
    console.log('\n✅ Reset Checkup Data Test Completed Successfully!');
    console.log('ℹ️  Summary:');
    console.log(`   - Deleted: ${deleteResult.affectedRows || 0} completed sessions`);
    console.log(`   - Reset: ${resetResult.affectedRows || 0} doctor-notified sessions to checked-in`);
    console.log('   - Only checked-in and waiting sessions should remain');
    
  } catch (error) {
    console.error('❌ Error during reset checkup data test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the test
testResetCheckupData();