const { sequelize } = require('../config/database');

const clearCurrentData = async () => {
  try {
    console.log('🧹 Starting comprehensive data cleanup...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Delete all checkup sessions with 'transferred', 'started', 'in-progress', 'completed' status
    const [deleteResult] = await sequelize.query(`
      DELETE FROM check_in_sessions 
      WHERE status IN ('transferred', 'started', 'in-progress', 'completed')
    `);
    
    console.log(`✅ Deleted ${deleteResult.affectedRows || 0} checkup sessions`);
    
    // Reset any 'doctor-notified' sessions back to 'checked-in' status
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
    
    // Show remaining sessions
    const [remainingSessions] = await sequelize.query(`
      SELECT id, status, COUNT(*) as count 
      FROM check_in_sessions 
      GROUP BY status 
      ORDER BY status
    `);
    
    console.log('📊 Remaining sessions by status:');
    remainingSessions.forEach(session => {
      console.log(`   - ${session.status}: ${session.count} sessions`);
    });
    
    console.log('✅ Database cleanup completed!');
    console.log('ℹ️  Frontend cache will also need to be cleared');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the cleanup
clearCurrentData();
