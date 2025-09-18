const { User, CheckInSession } = require('./models');
const { sequelize } = require('./config/database');

async function createTestDoctorReportsData() {
  try {
    console.log('🔄 Creating test doctor reports data...');
    
    // First, let's see what doctors and patients we have
    const [doctors, patients] = await Promise.all([
      User.findAll({ where: { role: 'doctor' } }),
      sequelize.query('SELECT id FROM Patients LIMIT 50', { type: sequelize.QueryTypes.SELECT })
    ]);
    
    console.log(`Found ${doctors.length} doctors:`, doctors.map(d => d.name));
    console.log(`Found ${patients.length} patients in database`);
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found. Creating sample doctors first...');
      
      // Create sample doctors
      const sampleDoctors = await Promise.all([
        User.create({
          name: 'Dr. Smith',
          email: 'dr.smith@hospital.com',
          role: 'doctor',
          password: 'password123'
        }),
        User.create({
          name: 'Dr. Johnson',
          email: 'dr.johnson@hospital.com',
          role: 'doctor',
          password: 'password123'
        }),
        User.create({
          name: 'Dr. Williams',
          email: 'dr.williams@hospital.com',
          role: 'doctor',
          password: 'password123'
        }),
        User.create({
          name: 'Dr. Brown',
          email: 'dr.brown@hospital.com',
          role: 'doctor',
          password: 'password123'
        })
      ]);
      
      console.log('✅ Created sample doctors:', sampleDoctors.map(d => d.name));
      doctors.push(...sampleDoctors);
    }
    
    if (patients.length === 0) {
      console.log('❌ No patients found. Please run patient generation scripts first.');
      return;
    }
    
    // Create completed checkup sessions for the last 30 days
    const sessions = [];
    const now = new Date();
    
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const sessionDate = new Date(now);
      sessionDate.setDate(sessionDate.getDate() - dayOffset);
      
      // Random number of sessions per day (3-15)
      const sessionsPerDay = Math.floor(Math.random() * 13) + 3;
      
      for (let i = 0; i < sessionsPerDay; i++) {
        // Randomly assign to a doctor and patient
        const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
        const randomPatient = patients[Math.floor(Math.random() * patients.length)];
        
        // Create session with random time
        const sessionTime = new Date(sessionDate);
        sessionTime.setHours(Math.floor(Math.random() * 8) + 9); // 9 AM to 5 PM
        sessionTime.setMinutes(Math.floor(Math.random() * 60));
        
        sessions.push({
          patientId: randomPatient.id,
          doctorId: randomDoctor.id,
          assignedDoctor: randomDoctor.name,
          status: 'completed',
          checkInTime: sessionTime,
          completedAt: new Date(sessionTime.getTime() + (Math.random() * 60 * 60 * 1000)), // Up to 1 hour later
          createdAt: sessionTime,
          updatedAt: sessionTime
        });
      }
    }
    
    console.log(`📊 Creating ${sessions.length} checkup sessions...`);
    
    // Insert all sessions
    await CheckInSession.bulkCreate(sessions);
    
    console.log('✅ Test data created successfully!');
    
    // Show summary using raw query
    const [summary] = await sequelize.query(`
      SELECT 
        assignedDoctor,
        COUNT(*) as completedCount
      FROM check_in_sessions
      WHERE status = 'completed' 
        AND completedAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY assignedDoctor
      ORDER BY completedCount DESC
    `);
    
    console.log('📈 Summary of completed checkups (last 30 days):');
    summary.forEach(item => {
      console.log(`  ${item.assignedDoctor}: ${item.completedCount} checkups`);
    });
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    process.exit(0);
  }
}

createTestDoctorReportsData();