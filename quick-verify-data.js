const mysql = require('mysql2/promise');
require('dotenv').config();

async function quickVerify() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'hrsm2'
    });

    console.log('🔍 QUICK VERIFICATION OF 535 CHECKUPS\n');

    // 1. Total completed sessions
    const [total] = await connection.execute(`
      SELECT COUNT(*) as total FROM check_in_sessions WHERE status = 'completed'
    `);
    console.log(`📊 Total completed sessions: ${total[0].total}`);

    // 2. Sample recent completed sessions
    console.log('\n📋 Recent completed sessions:');
    const [recent] = await connection.execute(`
      SELECT 
        id, 
        patientId, 
        status,
        DATE(createdAt) as created,
        DATE(completedAt) as completed,
        serviceType
      FROM check_in_sessions 
      WHERE status = 'completed'
      ORDER BY completedAt DESC 
      LIMIT 10
    `);
    
    recent.forEach(session => {
      console.log(`  ID: ${session.id}, Patient: ${session.patientId}, Service: ${session.serviceType}`);
      console.log(`    Created: ${session.created}, Completed: ${session.completed}`);
    });

    // 3. Check creation pattern for bulk data
    console.log('\n⚠️  Checking for sample/bulk data patterns:');
    const [bulkCheck] = await connection.execute(`
      SELECT 
        DATE(createdAt) as date,
        COUNT(*) as count,
        MIN(TIME(createdAt)) as first_time,
        MAX(TIME(createdAt)) as last_time
      FROM check_in_sessions
      WHERE status = 'completed'
      GROUP BY DATE(createdAt)
      HAVING COUNT(*) > 15
      ORDER BY count DESC
      LIMIT 10
    `);

    if (bulkCheck.length > 0) {
      console.log('  Days with high activity (possibly sample data):');
      bulkCheck.forEach(day => {
        console.log(`    ${day.date}: ${day.count} sessions (${day.first_time} - ${day.last_time})`);
      });
    }

    // 4. Check if patients are real
    console.log('\n👥 Checking associated patients:');
    const [patientCheck] = await connection.execute(`
      SELECT 
        p.id,
        p.firstName,
        p.lastName,
        COUNT(c.id) as session_count
      FROM patients p
      JOIN check_in_sessions c ON p.id = c.patientId
      WHERE c.status = 'completed'
      GROUP BY p.id, p.firstName, p.lastName
      ORDER BY session_count DESC
      LIMIT 10
    `);

    if (patientCheck.length > 0) {
      console.log('  Patients with most completed sessions:');
      patientCheck.forEach(patient => {
        console.log(`    ${patient.firstName} ${patient.lastName} (ID: ${patient.id}): ${patient.session_count} sessions`);
      });
    }

    // 5. Final verdict
    console.log('\n🎯 VERDICT:');
    if (total[0].total === 535) {
      console.log('  ✅ The 535 number matches the database count');
    }
    
    if (bulkCheck.length > 5) {
      console.log('  ⚠️  HIGH VOLUME: This appears to be sample/test data');
      console.log('  💡 Recommendation: Clean up test data or use real patient sessions');
    } else {
      console.log('  ✅ Data pattern looks normal for real usage');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

quickVerify();