const mysql = require('mysql2/promise');
require('dotenv').config();

async function analyzeDataForCleanup() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'hrsm2'
    });

    console.log('🔍 ANALYZING DATA FOR SAFE CLEANUP\n');

    // 1. Check what's in different tables
    console.log('📊 DATABASE OVERVIEW:');
    
    const tables = ['patients', 'users', 'families', 'check_in_sessions', 'appointments', 'medicalrecords', 'vaccinations'];
    
    for (const table of tables) {
      try {
        const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${table}`);
        console.log(`  ${table}: ${count[0].total} records`);
      } catch (error) {
        console.log(`  ${table}: Error reading table`);
      }
    }

    // 2. Analyze check_in_sessions patterns to identify test vs real data
    console.log('\n🔍 ANALYZING CHECK-IN SESSIONS PATTERNS:');
    
    // Check for suspicious bulk patterns
    const [bulkPatterns] = await connection.execute(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as session_count,
        COUNT(DISTINCT patientId) as unique_patients,
        MIN(TIME(createdAt)) as first_time,
        MAX(TIME(createdAt)) as last_time,
        TIMESTAMPDIFF(MINUTE, MIN(createdAt), MAX(createdAt)) as time_span_minutes
      FROM check_in_sessions
      GROUP BY DATE(createdAt)
      ORDER BY session_count DESC
    `);

    console.log('  Session patterns by date:');
    bulkPatterns.forEach(pattern => {
      const isLikelyTestData = pattern.session_count > 15 || pattern.time_span_minutes < 60;
      const flag = isLikelyTestData ? '🚨 LIKELY TEST DATA' : '✅ Looks normal';
      console.log(`    ${pattern.date}: ${pattern.session_count} sessions, ${pattern.unique_patients} patients, ${pattern.time_span_minutes}min span ${flag}`);
    });

    // 3. Check recent activity (likely real)
    console.log('\n📅 RECENT ACTIVITY (Last 7 days - likely REAL):');
    const [recentActivity] = await connection.execute(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count,
        status,
        GROUP_CONCAT(DISTINCT patientId ORDER BY patientId) as patient_ids
      FROM check_in_sessions
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(createdAt), status
      ORDER BY date DESC
    `);

    recentActivity.forEach(activity => {
      console.log(`    ${activity.date}: ${activity.count} ${activity.status} sessions (Patients: ${activity.patient_ids})`);
    });

    // 4. Check users and admin accounts (MUST KEEP)
    console.log('\n👥 USER ACCOUNTS (MUST KEEP):');
    const [users] = await connection.execute(`
      SELECT 
        id, 
        username, 
        email, 
        role, 
        firstName, 
        lastName,
        isActive
      FROM users
      ORDER BY role, id
    `);

    console.log('  Critical user accounts:');
    users.forEach(user => {
      console.log(`    ID: ${user.id}, Username: ${user.username}, Role: ${user.role}, Name: ${user.firstName} ${user.lastName}, Active: ${user.isActive}`);
    });

    // 5. Check real patients vs test patients
    console.log('\n👤 PATIENT ANALYSIS:');
    const [patientAnalysis] = await connection.execute(`
      SELECT 
        p.id,
        p.firstName,
        p.lastName,
        p.dateOfBirth,
        DATE(p.createdAt) as created_date,
        COUNT(c.id) as session_count
      FROM patients p
      LEFT JOIN check_in_sessions c ON p.id = c.patientId
      GROUP BY p.id, p.firstName, p.lastName, p.dateOfBirth, p.createdAt
      ORDER BY session_count DESC
    `);

    console.log('  Patients with high session counts (likely test data):');
    const highSessionPatients = patientAnalysis.filter(p => p.session_count > 20);
    highSessionPatients.forEach(patient => {
      console.log(`    🚨 ${patient.firstName} ${patient.lastName} (ID: ${patient.id}): ${patient.session_count} sessions - LIKELY TEST`);
    });

    console.log('\n  Patients with normal session counts (likely real):');
    const normalSessionPatients = patientAnalysis.filter(p => p.session_count <= 5 && p.session_count > 0);
    normalSessionPatients.forEach(patient => {
      console.log(`    ✅ ${patient.firstName} ${patient.lastName} (ID: ${patient.id}): ${patient.session_count} sessions - LIKELY REAL`);
    });

    // 6. Provide cleanup recommendations
    console.log('\n🧹 CLEANUP RECOMMENDATIONS:');
    
    const testDataDates = bulkPatterns.filter(p => p.session_count > 15).map(p => p.date);
    console.log('  Dates with likely test data:');
    testDataDates.forEach(date => {
      console.log(`    - ${date}`);
    });

    console.log('\n  SAFE CLEANUP STRATEGY:');
    console.log('    1. ✅ Keep all user accounts (admins, doctors, staff)');
    console.log('    2. ✅ Keep patients with ≤5 sessions (likely real patients)'); 
    console.log('    3. ✅ Keep sessions from last 3 days (recent real activity)');
    console.log('    4. 🚨 Remove sessions from dates with >15 sessions/day (bulk test data)');
    console.log('    5. 🚨 Remove patients with >20 sessions (clearly test patients)');

    // 7. Count what would be removed vs kept
    console.log('\n📊 CLEANUP IMPACT ESTIMATE:');
    
    const [testSessionsCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM check_in_sessions 
      WHERE DATE(createdAt) IN (${testDataDates.map(() => '?').join(',')})
    `, testDataDates);

    const [recentSessionsCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM check_in_sessions 
      WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
    `);

    console.log(`  Sessions to remove: ~${testSessionsCount[0].count} (test data)`);
    console.log(`  Sessions to keep: ~${recentSessionsCount[0].count} (recent real activity)`);
    console.log(`  Users to keep: ${users.length} (all user accounts)`);
    console.log(`  Patients with normal activity: ${normalSessionPatients.length}`);

  } catch (error) {
    console.error('❌ Error analyzing data:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

analyzeDataForCleanup();