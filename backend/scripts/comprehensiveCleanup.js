const { sequelize } = require('../config/database');
const { CheckInSession } = require('../models');

const comprehensiveCleanup = async () => {
  try {
    console.log('🧹 Starting comprehensive checkup data cleanup...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Get all sessions to see what we're working with
    const allSessions = await CheckInSession.findAll({
      attributes: ['id', 'status', 'patientId', 'checkInTime'],
      order: [['checkInTime', 'DESC']]
    });
    
    console.log(`📊 Found ${allSessions.length} total sessions in database:`);
    allSessions.forEach(session => {
      console.log(`   - Session ${session.id}: Status '${session.status}' (Patient ${session.patientId})`);
    });
    
    // Delete all checkup sessions that are not in initial states
    const deletedSessions = await CheckInSession.destroy({
      where: {
        status: ['started', 'in-progress', 'transferred', 'completed', 'finished']
      }
    });
    
    console.log(`🗑️  Deleted ${deletedSessions} advanced checkup sessions`);
    
    // Reset any sessions back to doctor-notified if they need to be back in queue
    const resetCount = await CheckInSession.update(
      { 
        status: 'doctor-notified',
        doctorNotified: true,
        startedAt: null,
        completedAt: null,
        notes: null,
        prescription: null,
        doctorNotes: null,
        assignedDoctor: null
      },
      {
        where: {
          status: ['transferred', 'started', 'in-progress']
        }
      }
    );
    
    console.log(`🔄 Reset ${resetCount[0]} sessions back to doctor-notified`);
    
    // Show final state
    const finalSessions = await CheckInSession.findAll({
      attributes: ['id', 'status', 'patientId'],
      where: {
        doctorNotified: true
      }
    });
    
    console.log(`📋 Final state: ${finalSessions.length} sessions in doctor queue:`);
    finalSessions.forEach(session => {
      console.log(`   - Session ${session.id}: Status '${session.status}' (Patient ${session.patientId})`);
    });
    
    console.log('✅ Comprehensive cleanup completed successfully!');
    console.log('🎯 Ready for fresh testing!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the cleanup
comprehensiveCleanup();
