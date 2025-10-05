/**
 * Manual Doctor Session Cleanup
 * This script manually cleans up stale doctor sessions
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'hrsm2'
};

async function cleanupStaleSessions() {
  let connection;
  
  try {
    console.log('🧹 Manual Doctor Session Cleanup');
    console.log('=================================');
    
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database!');
    
    // Check current doctor sessions
    console.log('\n📋 Current Doctor Sessions:');
    console.log('===========================');
    const [currentSessions] = await connection.execute(`
      SELECT 
        ds.id,
        ds.doctorId,
        ds.status,
        ds.loginTime,
        ds.lastActivity,
        ds.logoutTime,
        u.firstName,
        u.lastName,
        u.position,
        TIMESTAMPDIFF(MINUTE, ds.lastActivity, NOW()) as minutesInactive
      FROM DoctorSessions ds
      JOIN Users u ON ds.doctorId = u.id
      WHERE ds.status IN ('online', 'busy')
      ORDER BY ds.lastActivity DESC
    `);
    
    if (currentSessions.length === 0) {
      console.log('No active doctor sessions found.');
    } else {
      currentSessions.forEach((session, index) => {
        console.log(`${index + 1}. Dr. ${session.firstName} ${session.lastName}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Login Time: ${session.loginTime}`);
        console.log(`   Last Activity: ${session.lastActivity}`);
        console.log(`   Minutes Inactive: ${session.minutesInactive}`);
        console.log(`   Should be offline: ${session.minutesInactive > 5 ? 'YES' : 'NO'}`);
        console.log('');
      });
    }
    
    // Clean up stale sessions (older than 5 minutes)
    console.log('🔧 Cleaning up stale sessions (inactive > 5 minutes)...');
    const [cleanupResult] = await connection.execute(`
      UPDATE DoctorSessions 
      SET 
        status = 'offline',
        logoutTime = NOW()
      WHERE 
        status IN ('online', 'busy') 
        AND lastActivity < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    `);
    
    console.log(`✅ Cleaned up ${cleanupResult.affectedRows} stale sessions`);
    
    // Check sessions after cleanup
    console.log('\n📋 Doctor Sessions After Cleanup:');
    console.log('==================================');
    const [afterCleanup] = await connection.execute(`
      SELECT 
        ds.id,
        ds.doctorId,
        ds.status,
        ds.loginTime,
        ds.lastActivity,
        ds.logoutTime,
        u.firstName,
        u.lastName,
        u.position,
        TIMESTAMPDIFF(MINUTE, ds.lastActivity, NOW()) as minutesInactive
      FROM DoctorSessions ds
      JOIN Users u ON ds.doctorId = u.id
      WHERE ds.status IN ('online', 'busy')
      ORDER BY ds.lastActivity DESC
    `);
    
    if (afterCleanup.length === 0) {
      console.log('No active doctor sessions remaining.');
    } else {
      afterCleanup.forEach((session, index) => {
        console.log(`${index + 1}. Dr. ${session.firstName} ${session.lastName}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Last Activity: ${session.lastActivity}`);
        console.log(`   Minutes Inactive: ${session.minutesInactive}`);
        console.log('');
      });
    }
    
    console.log('\n✅ Cleanup completed!');
    console.log('💡 Now try refreshing the doctor selection modal in the admin dashboard');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run the cleanup
cleanupStaleSessions().catch(console.error);