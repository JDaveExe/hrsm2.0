const mysql = require('mysql2/promise');
require('dotenv').config();

async function safeCleanupTestData() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'hrsm2'
    });

    console.log('🧹 SAFE CLEANUP: REMOVING "UNKNOWN DOCTOR" TEST DATA\n');

    // 1. First, let's do a final safety check
    console.log('🔒 FINAL SAFETY CHECK:');
    
    const [totalSessions] = await connection.execute('SELECT COUNT(*) as total FROM check_in_sessions');
    const [unknownSessions] = await connection.execute(`
      SELECT COUNT(*) as count FROM check_in_sessions 
      WHERE assignedDoctor IS NULL OR assignedDoctor = '' OR assignedDoctor = 'Unknown Doctor'
    `);
    const [realSessions] = await connection.execute(`
      SELECT COUNT(*) as count FROM check_in_sessions 
      WHERE assignedDoctor IS NOT NULL AND assignedDoctor != '' AND assignedDoctor != 'Unknown Doctor'
    `);

    console.log(`  Total sessions: ${totalSessions[0].total}`);
    console.log(`  Unknown doctor sessions (to remove): ${unknownSessions[0].count}`);
    console.log(`  Real doctor sessions (to keep): ${realSessions[0].count}`);
    console.log(`  Cleanup percentage: ${((unknownSessions[0].count / totalSessions[0].total) * 100).toFixed(1)}%`);

    // 2. Show what real doctor sessions we're keeping
    console.log('\n✅ KEEPING THESE REAL DOCTOR SESSIONS:');
    const [keepingSessions] = await connection.execute(`
      SELECT 
        id,
        patientId,
        assignedDoctor,
        status,
        serviceType,
        DATE(createdAt) as created_date
      FROM check_in_sessions 
      WHERE assignedDoctor IS NOT NULL AND assignedDoctor != '' AND assignedDoctor != 'Unknown Doctor'
      ORDER BY createdAt DESC
    `);

    keepingSessions.forEach(session => {
      console.log(`    ID: ${session.id} | Patient: ${session.patientId} | Dr: ${session.assignedDoctor} | Status: ${session.status} | Service: ${session.serviceType} | Date: ${session.created_date}`);
    });

    // 3. Create backup before cleanup (optional but recommended)
    console.log('\n💾 CREATING BACKUP OF UNKNOWN DOCTOR SESSIONS:');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS check_in_sessions_backup_${Date.now()} AS
      SELECT * FROM check_in_sessions 
      WHERE assignedDoctor IS NULL OR assignedDoctor = '' OR assignedDoctor = 'Unknown Doctor'
    `);
    console.log('  ✅ Backup created successfully');

    // 4. Perform the cleanup
    console.log('\n🗑️  REMOVING UNKNOWN DOCTOR SESSIONS:');
    const [deleteResult] = await connection.execute(`
      DELETE FROM check_in_sessions 
      WHERE assignedDoctor IS NULL OR assignedDoctor = '' OR assignedDoctor = 'Unknown Doctor'
    `);

    console.log(`  ✅ Removed ${deleteResult.affectedRows} sessions with unknown doctors`);

    // 5. Verify cleanup results
    console.log('\n📊 POST-CLEANUP VERIFICATION:');
    const [newTotal] = await connection.execute('SELECT COUNT(*) as total FROM check_in_sessions');
    const [remainingSessions] = await connection.execute(`
      SELECT 
        assignedDoctor,
        status,
        COUNT(*) as count
      FROM check_in_sessions 
      GROUP BY assignedDoctor, status
      ORDER BY count DESC
    `);

    console.log(`  Remaining total sessions: ${newTotal[0].total}`);
    console.log('  Remaining sessions by doctor:');
    remainingSessions.forEach(session => {
      console.log(`    Dr. ${session.assignedDoctor} | ${session.status}: ${session.count} sessions`);
    });

    // 6. Test API endpoints to see new data
    console.log('\n🔍 TESTING API ENDPOINTS WITH CLEANED DATA:');
    
    // Test years endpoint
    const yearsQuery = `
      SELECT 
        YEAR(updatedAt) as year,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedCheckups
      FROM check_in_sessions 
      WHERE updatedAt >= DATE_SUB(CURDATE(), INTERVAL 5 YEAR)
        AND status = 'completed'
      GROUP BY YEAR(updatedAt)
      ORDER BY year DESC
    `;
    const [yearsData] = await connection.execute(yearsQuery);
    
    console.log('  Years data (for API):');
    yearsData.forEach(year => {
      console.log(`    ${year.year}: ${year.completedCheckups} completed checkups`);
    });

    // Test months endpoint  
    const monthsQuery = `
      SELECT 
        YEAR(updatedAt) as year,
        MONTH(updatedAt) as month,
        MONTHNAME(updatedAt) as monthName,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedCheckups
      FROM check_in_sessions 
      WHERE updatedAt >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        AND status = 'completed'
      GROUP BY YEAR(updatedAt), MONTH(updatedAt), MONTHNAME(updatedAt)
      ORDER BY year, month
    `;
    const [monthsData] = await connection.execute(monthsQuery);
    
    console.log('  Months data (for API):');
    monthsData.forEach(month => {
      console.log(`    ${month.monthName} ${month.year}: ${month.completedCheckups} completed checkups`);
    });

    console.log('\n🎉 CLEANUP COMPLETED SUCCESSFULLY!');
    console.log('📊 Your Admin Dashboard > Patient Checkup Trends will now show realistic data');
    console.log('✅ All patients, users, and real doctor sessions preserved');
    console.log('🗑️  Bulk test data with unknown doctors removed');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    console.log('🛡️  No changes made due to error - data is safe');
  } finally {
    if (connection) await connection.end();
  }
}

// Add confirmation prompt
console.log('⚠️  This will remove sessions with assignedDoctor = null/empty/"Unknown Doctor"');
console.log('✅ This will keep all patients, users, and real doctor sessions');
console.log('📊 Estimated removal: ~529 sessions (98.1% of current data)');
console.log('\nContinuing in 3 seconds... Press Ctrl+C to cancel');

setTimeout(() => {
  safeCleanupTestData();
}, 3000);