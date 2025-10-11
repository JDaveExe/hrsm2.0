// Script to create test checkup sessions with completed data for doctor reports
const axios = require('axios');
const { Sequelize, DataTypes } = require('sequelize');

// Database connection (adjust connection string as needed)
const sequelize = new Sequelize('hrsm_db', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: console.log
});

// Define CheckInSession model
const CheckInSession = sequelize.define('CheckInSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  patientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('waiting', 'in-progress', 'completed', 'cancelled'),
    defaultValue: 'waiting'
  },
  assignedDoctor: {
    type: DataTypes.STRING,
    allowNull: true
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  serviceType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'checkinsessions'
});

async function createTestCompletedCheckups() {
  console.log('🏥 Creating Test Completed Checkup Sessions for Doctor Reports...\n');
  
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sample doctors
    const doctors = [
      'Dr. Smith',
      'Dr. Johnson', 
      'Dr. Williams',
      'Dr. Brown',
      'Dr. Davis',
      'Dr. Wilson'
    ];

    // Sample patients
    const patients = [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' },
      { id: 3, name: 'Mike Johnson' },
      { id: 4, name: 'Sarah Wilson' },
      { id: 5, name: 'David Brown' },
      { id: 6, name: 'Lisa Davis' },
      { id: 7, name: 'Tom Anderson' },
      { id: 8, name: 'Amy Taylor' },
      { id: 9, name: 'Chris Miller' },
      { id: 10, name: 'Emma Jones' },
      { id: 47, name: 'Josuke Joestar' }
    ];

    const serviceTypes = ['general', 'follow-up', 'urgent', 'consultation'];

    // Create test data for the last 30 days
    const testSessions = [];
    const now = new Date();
    
    // Generate data for the past 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const date = new Date(now);
      date.setDate(date.getDate() - dayOffset);
      
      // Skip weekends for more realistic data
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Generate 3-8 checkups per day
      const checkupsPerDay = Math.floor(Math.random() * 6) + 3;
      
      for (let i = 0; i < checkupsPerDay; i++) {
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const doctor = doctors[Math.floor(Math.random() * doctors.length)];
        const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
        
        // Random time during business hours (8 AM - 6 PM)
        const completedTime = new Date(date);
        completedTime.setHours(8 + Math.floor(Math.random() * 10));
        completedTime.setMinutes(Math.floor(Math.random() * 60));
        
        const createdTime = new Date(completedTime);
        createdTime.setMinutes(createdTime.getMinutes() - Math.floor(Math.random() * 120)); // Created 0-2 hours before completion
        
        testSessions.push({
          patientId: patient.id,
          patientName: patient.name,
          status: 'completed',
          assignedDoctor: doctor,
          completedAt: completedTime,
          serviceType: serviceType,
          createdAt: createdTime,
          updatedAt: completedTime
        });
      }
    }

    console.log(`📝 Generated ${testSessions.length} test checkup sessions`);
    console.log(`📊 Date range: ${testSessions[testSessions.length-1].completedAt.toDateString()} to ${testSessions[0].completedAt.toDateString()}`);
    
    // Group by doctor for preview
    const doctorStats = {};
    testSessions.forEach(session => {
      doctorStats[session.assignedDoctor] = (doctorStats[session.assignedDoctor] || 0) + 1;
    });
    
    console.log('\n📈 Doctor Workload Preview:');
    Object.entries(doctorStats).forEach(([doctor, count]) => {
      console.log(`  ${doctor}: ${count} completed checkups`);
    });

    // Insert the test data
    console.log('\n💾 Inserting test data into database...');
    await CheckInSession.bulkCreate(testSessions, {
      ignoreDuplicates: true
    });

    console.log('✅ Test data inserted successfully!');
    
    // Verify the insertion
    const totalCount = await CheckInSession.count({
      where: { status: 'completed' }
    });
    
    console.log(`\n📊 Total completed checkups in database: ${totalCount}`);
    
    // Show recent data
    const recentSessions = await CheckInSession.findAll({
      where: { status: 'completed' },
      order: [['completedAt', 'DESC']],
      limit: 5
    });
    
    console.log('\n🔍 Recent completed sessions:');
    recentSessions.forEach(session => {
      console.log(`  ${session.completedAt.toLocaleDateString()} - ${session.patientName} with ${session.assignedDoctor}`);
    });

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the script
createTestCompletedCheckups();