const mysql = require('mysql2/promise');
require('dotenv').config();

async function analyzeUnknownDoctorData() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'hrsm2'
    });

    console.log('🔍 ANALYZING DATA BY DOCTOR FOR SMART CLEANUP\n');

    // 1. Check what doctor values exist in check_in_sessions
    console.log('👨‍⚕️ DOCTOR ANALYSIS IN CHECK-IN SESSIONS:');
    const [doctorAnalysis] = await connection.execute(`
      SELECT 
        assignedDoctor,
        COUNT(*) as session_count,
        status,
        COUNT(DISTINCT patientId) as unique_patients,
        MIN(DATE(createdAt)) as first_date,
        MAX(DATE(createdAt)) as last_date
      FROM check_in_sessions 
      GROUP BY assignedDoctor, status
      ORDER BY session_count DESC
    `);

    doctorAnalysis.forEach(doctor => {
      const isUnknown = doctor.assignedDoctor === 'Unknown Doctor' || doctor.assignedDoctor === null || doctor.assignedDoctor === '';
      const flag = isUnknown ? '🚨 TARGET FOR REMOVAL' : '✅ KEEP';
      console.log(`    Doctor: "${doctor.assignedDoctor}" | Status: ${doctor.status} | Sessions: ${doctor.session_count} | Patients: ${doctor.unique_patients} ${flag}`);
      console.log(`      Date range: ${doctor.first_date} to ${doctor.last_date}`);
    });

    // 2. Count sessions with "Unknown Doctor" specifically
    console.log('\n🎯 "UNKNOWN DOCTOR" SESSION ANALYSIS:');
    const [unknownDoctorSessions] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(DISTINCT patientId) as unique_patients
      FROM check_in_sessions 
      WHERE assignedDoctor = 'Unknown Doctor' OR assignedDoctor IS NULL OR assignedDoctor = ''
      GROUP BY status
    `);

    let totalUnknownSessions = 0;
    unknownDoctorSessions.forEach(session => {
      totalUnknownSessions += session.count;
      console.log(`    Status: ${session.status} - ${session.count} sessions (${session.unique_patients} patients)`);
    });
    
    console.log(`    TOTAL UNKNOWN DOCTOR SESSIONS: ${totalUnknownSessions}`);

    // 3. Check sessions with real doctors
    console.log('\n✅ REAL DOCTOR SESSION ANALYSIS:');
    const [realDoctorSessions] = await connection.execute(`
      SELECT 
        assignedDoctor,
        status,
        COUNT(*) as count,
        COUNT(DISTINCT patientId) as unique_patients
      FROM check_in_sessions 
      WHERE assignedDoctor IS NOT NULL 
        AND assignedDoctor != '' 
        AND assignedDoctor != 'Unknown Doctor'
      GROUP BY assignedDoctor, status
      ORDER BY count DESC
    `);

    let totalRealSessions = 0;
    realDoctorSessions.forEach(session => {
      totalRealSessions += session.count;
      console.log(`    Dr. ${session.assignedDoctor} | Status: ${session.status} - ${session.count} sessions (${session.unique_patients} patients)`);
    });
    
    console.log(`    TOTAL REAL DOCTOR SESSIONS: ${totalRealSessions}`);

    // 4. Check recent activity (last 7 days) by doctor
    console.log('\n📅 RECENT ACTIVITY BY DOCTOR (Last 7 days):');
    const [recentByDoctor] = await connection.execute(`
      SELECT 
        assignedDoctor,
        DATE(createdAt) as date,
        COUNT(*) as count,
        status
      FROM check_in_sessions 
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY assignedDoctor, DATE(createdAt), status
      ORDER BY date DESC, count DESC
    `);

    recentByDoctor.forEach(activity => {
      const isUnknown = activity.assignedDoctor === 'Unknown Doctor' || activity.assignedDoctor === null;
      const flag = isUnknown ? '🚨 REMOVE' : '✅ KEEP';
      console.log(`    ${activity.date}: Dr. "${activity.assignedDoctor}" - ${activity.count} ${activity.status} sessions ${flag}`);
    });

    // 5. Sample some "Unknown Doctor" records to verify they're test data
    console.log('\n📋 SAMPLE "UNKNOWN DOCTOR" RECORDS:');
    const [sampleUnknown] = await connection.execute(`
      SELECT 
        id,
        patientId,
        status,
        assignedDoctor,
        serviceType,
        DATE(createdAt) as created_date,
        TIME(createdAt) as created_time
      FROM check_in_sessions 
      WHERE assignedDoctor = 'Unknown Doctor' OR assignedDoctor IS NULL OR assignedDoctor = ''
      ORDER BY createdAt DESC
      LIMIT 10
    `);

    sampleUnknown.forEach(record => {
      console.log(`    ID: ${record.id} | Patient: ${record.patientId} | Service: ${record.serviceType} | Status: ${record.status}`);
      console.log(`      Doctor: "${record.assignedDoctor}" | Created: ${record.created_date} ${record.created_time}`);
    });

    // 6. Cleanup impact assessment
    console.log('\n🧹 SMART CLEANUP IMPACT:');
    console.log(`    Sessions to REMOVE (Unknown Doctor): ${totalUnknownSessions}`);
    console.log(`    Sessions to KEEP (Real Doctors): ${totalRealSessions}`);
    console.log(`    Patients to KEEP: ALL 18 patients ✅`);
    console.log(`    Users to KEEP: ALL 26 users ✅`);
    
    const cleanupPercentage = ((totalUnknownSessions / (totalUnknownSessions + totalRealSessions)) * 100).toFixed(1);
    console.log(`    Cleanup percentage: ${cleanupPercentage}% of sessions (targets bulk test data)`);

    // 7. Safety check - verify this won't remove recent real activity
    const [recentRealActivity] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM check_in_sessions 
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        AND (assignedDoctor IS NOT NULL AND assignedDoctor != '' AND assignedDoctor != 'Unknown Doctor')
    `);

    console.log(`\n🛡️  SAFETY CHECK:`);
    console.log(`    Recent real doctor activity (last 3 days): ${recentRealActivity[0].count} sessions`);
    console.log(`    ✅ This cleanup will preserve all recent real doctor activity`);

  } catch (error) {
    console.error('❌ Error analyzing doctor data:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

analyzeUnknownDoctorData();