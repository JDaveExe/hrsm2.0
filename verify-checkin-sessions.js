const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyCheckInSessions() {
  let connection;
  
  try {
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'hrsm2'
    });

    console.log('🔍 VERIFYING CHECK-IN SESSIONS DATA\n');

    // 1. Check total records in check_in_sessions
    console.log('📊 CHECK-IN SESSIONS OVERVIEW:');
    const [totalCount] = await connection.execute('SELECT COUNT(*) as total FROM check_in_sessions');
    console.log(`  Total check-in sessions: ${totalCount[0].total}`);

    // 2. Check status distribution
    const [statusCount] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM check_in_sessions 
      GROUP BY status
      ORDER BY count DESC
    `);
    
    console.log('  Status distribution:');
    statusCount.forEach(status => {
      console.log(`    ${status.status}: ${status.count} sessions`);
    });

    // 3. Check completed sessions by date
    console.log('\n📅 COMPLETED SESSIONS BY DATE:');
    const [completedByDate] = await connection.execute(`
      SELECT 
        DATE(updatedAt) as completion_date,
        COUNT(*) as count
      FROM check_in_sessions 
      WHERE status = 'completed'
      GROUP BY DATE(updatedAt)
      ORDER BY completion_date DESC
      LIMIT 10
    `);

    if (completedByDate.length > 0) {
      console.log('  Recent completion dates:');
      completedByDate.forEach(date => {
        console.log(`    ${date.completion_date}: ${date.count} completed sessions`);
      });
    }

    // 4. Check when sessions were created vs completed
    console.log('\n⏰ CREATION vs COMPLETION PATTERNS:');
    const [creationPattern] = await connection.execute(`
      SELECT 
        DATE(createdAt) as creation_date,
        COUNT(*) as created,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM check_in_sessions 
      GROUP BY DATE(createdAt)
      ORDER BY creation_date DESC
      LIMIT 10
    `);

    if (creationPattern.length > 0) {
      console.log('  Recent activity:');
      creationPattern.forEach(pattern => {
        console.log(`    ${pattern.creation_date}: ${pattern.created} created, ${pattern.completed} completed`);
      });
    }

    // 5. Check for bulk data patterns (suggests sample data)
    console.log('\n⚠️  BULK DATA ANALYSIS:');
    const [bulkPattern] = await connection.execute(`
      SELECT 
        DATE(createdAt) as creation_date,
        HOUR(createdAt) as creation_hour,
        COUNT(*) as count
      FROM check_in_sessions
      GROUP BY DATE(createdAt), HOUR(createdAt)
      HAVING COUNT(*) > 20
      ORDER BY count DESC
      LIMIT 5
    `);

    if (bulkPattern.length > 0) {
      console.log('  Bulk insertion patterns (suggests sample data):');
      bulkPattern.forEach(bulk => {
        console.log(`    ${bulk.creation_date} at ${bulk.creation_hour}:00 - ${bulk.count} sessions created`);
      });
    } else {
      console.log('  No obvious bulk insertion patterns detected');
    }

    // 6. Sample some actual records
    console.log('\n📋 SAMPLE CHECK-IN SESSIONS:');
    const [sampleRecords] = await connection.execute(`
      SELECT 
        id,
        patientId,
        status,
        queueNumber,
        DATE(createdAt) as created_date,
        TIME(createdAt) as created_time,
        DATE(updatedAt) as updated_date,
        TIME(updatedAt) as updated_time
      FROM check_in_sessions 
      ORDER BY updatedAt DESC
      LIMIT 10
    `);

    if (sampleRecords.length > 0) {
      console.log('  Recent sessions:');
      sampleRecords.forEach(record => {
        console.log(`    ID: ${record.id}, Patient: ${record.patientId}, Status: ${record.status}`);
        console.log(`      Created: ${record.created_date} ${record.created_time}, Updated: ${record.updated_date} ${record.updated_time}`);
      });
    }

    // 7. Check the 535 number specifically
    console.log('\n🎯 VERIFYING THE 535 CHECKUPS:');
    const [yearlyCount] = await connection.execute(`
      SELECT 
        YEAR(updatedAt) as year,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedCheckups
      FROM check_in_sessions 
      WHERE updatedAt >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
        AND status = 'completed'
      GROUP BY YEAR(updatedAt)
      ORDER BY year DESC
    `);

    console.log('  Completed checkups by year:');
    yearlyCount.forEach(year => {
      console.log(`    ${year.year}: ${year.completedCheckups} completed sessions`);
      if (year.completedCheckups > 100) {
        console.log(`      ⚠️  This seems high for a test system!`);
      }
    });

    // 8. Check if this matches the API response
    const [monthlyBreakdown] = await connection.execute(`
      SELECT 
        YEAR(updatedAt) as year,
        MONTH(updatedAt) as month,
        MONTHNAME(updatedAt) as monthName,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedCheckups
      FROM check_in_sessions 
      WHERE YEAR(updatedAt) = 2025 AND status = 'completed'
      GROUP BY YEAR(updatedAt), MONTH(updatedAt), MONTHNAME(updatedAt)
      ORDER BY year, month
    `);

    console.log('\n  2025 monthly breakdown:');
    let total2025 = 0;
    monthlyBreakdown.forEach(month => {
      console.log(`    ${month.monthName}: ${month.completedCheckups}`);
      total2025 += month.completedCheckups;
    });
    console.log(`    TOTAL 2025: ${total2025} (should match API response of 535)`);

  } catch (error) {
    console.error('❌ Error verifying check-in sessions:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyCheckInSessions();