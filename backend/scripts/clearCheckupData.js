const { sequelize } = require('../config/database');
const { CheckInSession } = require('../models');

const clearCheckupData = async () => {
  try {
    console.log('🧹 Starting checkup data cleanup...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Delete all checkup sessions that are in doctor's care
    const deletedSessions = await CheckInSession.destroy({
      where: {
        status: ['started', 'in-progress', 'transferred', 'completed', 'finished']
      }
    });
    
    console.log(`🗑️  Deleted ${deletedSessions} checkup sessions`);
    
    // Reset any patients back to doctor-notified status if they were in queue
    const resetQueue = await CheckInSession.update(
      { 
        status: 'doctor-notified',
        doctorNotified: true,
        startedAt: null,
        completedAt: null,
        notes: null,
        prescription: null,
        assignedDoctor: null
      },
      {
        where: {
          status: 'transferred'
        }
      }
    );
    
    console.log(`🔄 Reset ${resetQueue[0]} queue items back to doctor-notified`);
    
    console.log('✅ Checkup data cleanup completed successfully!');
    console.log('📋 All ongoing and finished checkups have been cleared');
    console.log('👥 Patient queue has been restored to original state');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the cleanup
clearCheckupData();
