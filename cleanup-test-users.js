/**
 * Cleanup Test Users Script
 * Removes test users from the database
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

console.log('======================================================================');
console.log('  🧹 CLEANUP TEST USERS');
console.log('======================================================================\n');

async function cleanupTestUsers() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✓ Connected to database\n');
    
    // Find test users (emails containing 'test', 'example.com', phone numbers starting with specific patterns)
    console.log('▶ Searching for test users...\n');
    
    const [testUsers] = await connection.execute(`
      SELECT u.id as userId, u.username, u.email, u.contactNumber, u.role,
             p.id as patientId, p.firstName, p.lastName
      FROM users u
      LEFT JOIN patients p ON p.userId = u.id
      WHERE (
        u.email LIKE '%test%@example.com' OR
        u.email LIKE '%passtest%' OR
        u.email LIKE '%admintest%' OR
        u.username LIKE '%test%@example.com' OR
        u.username LIKE '%passtest%' OR
        u.username LIKE '%admintest%'
      )
      AND u.role = 'patient'
      ORDER BY u.id
    `);
    
    if (testUsers.length === 0) {
      console.log('✓ No test users found. Database is clean!\n');
      return;
    }
    
    console.log(`Found ${testUsers.length} test user(s):\n`);
    console.table(testUsers.map(u => ({
      userId: u.userId,
      patientId: u.patientId || 'N/A',
      username: u.username,
      email: u.email || 'N/A',
      phone: u.contactNumber || 'N/A',
      name: u.firstName ? `${u.firstName} ${u.lastName}` : 'N/A'
    })));
    
    console.log('\n⚠️  WARNING: This will permanently delete the users listed above!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('▶ Deleting test users...\n');
    
    let deletedPatients = 0;
    let deletedUsers = 0;
    
    for (const user of testUsers) {
      try {
        // Delete from patients table first (if exists)
        if (user.patientId) {
          await connection.execute('DELETE FROM patients WHERE id = ?', [user.patientId]);
          deletedPatients++;
          console.log(`  ✓ Deleted patient record (ID: ${user.patientId}, Name: ${user.firstName} ${user.lastName})`);
        }
        
        // Delete from users table
        await connection.execute('DELETE FROM users WHERE id = ?', [user.userId]);
        deletedUsers++;
        console.log(`  ✓ Deleted user record (ID: ${user.userId}, Username: ${user.username})`);
        
      } catch (error) {
        console.error(`  ✗ Error deleting user ${user.userId}:`, error.message);
      }
    }
    
    console.log('\n======================================================================');
    console.log('  📊 CLEANUP SUMMARY');
    console.log('======================================================================\n');
    console.log(`  Patient records deleted: ${deletedPatients}`);
    console.log(`  User records deleted: ${deletedUsers}`);
    console.log('\n======================================================================\n');
    console.log('  ✅ Cleanup completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ CLEANUP FAILED!');
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('ℹ Database connection closed\n');
    }
  }
}

cleanupTestUsers();
