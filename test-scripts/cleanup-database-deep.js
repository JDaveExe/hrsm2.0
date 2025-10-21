/**
 * Deep Database Cleanup Script
 * Removes all test users and orphaned records
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

console.log('======================================================================');
console.log('  🧹 DEEP DATABASE CLEANUP');
console.log('======================================================================\n');

async function deepCleanup() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✓ Connected to database\n');
    
    let totalDeleted = {
      patients: 0,
      users: 0,
      checkups: 0,
      appointments: 0,
      vaccinations: 0
    };
    
    // ===== STEP 1: Find and delete test users =====
    console.log('▶ STEP 1: Finding test users...\n');
    
    const [testUsers] = await connection.execute(`
      SELECT u.id as userId, u.username, u.email, u.contactNumber,
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
    
    if (testUsers.length > 0) {
      console.log(`Found ${testUsers.length} test user(s):\n`);
      console.table(testUsers.map(u => ({
        userId: u.userId,
        patientId: u.patientId || 'N/A',
        username: u.username,
        name: u.firstName ? `${u.firstName} ${u.lastName}` : 'N/A'
      })));
      
      console.log('\n⚠️  Deleting test users and their related records...\n');
      
      for (const user of testUsers) {
        const patientId = user.patientId;
        
        if (patientId) {
          // Delete related checkups
          const [checkups] = await connection.execute('DELETE FROM checkups WHERE patientId = ?', [patientId]);
          if (checkups.affectedRows > 0) {
            totalDeleted.checkups += checkups.affectedRows;
            console.log(`  ✓ Deleted ${checkups.affectedRows} checkup(s) for patient ${patientId}`);
          }
          
          // Delete related appointments
          const [appointments] = await connection.execute('DELETE FROM appointments WHERE patientId = ?', [patientId]);
          if (appointments.affectedRows > 0) {
            totalDeleted.appointments += appointments.affectedRows;
            console.log(`  ✓ Deleted ${appointments.affectedRows} appointment(s) for patient ${patientId}`);
          }
          
          // Delete related vaccinations
          const [vaccinations] = await connection.execute('DELETE FROM vaccinations WHERE patientId = ?', [patientId]);
          if (vaccinations.affectedRows > 0) {
            totalDeleted.vaccinations += vaccinations.affectedRows;
            console.log(`  ✓ Deleted ${vaccinations.affectedRows} vaccination(s) for patient ${patientId}`);
          }
          
          // Delete patient record
          await connection.execute('DELETE FROM patients WHERE id = ?', [patientId]);
          totalDeleted.patients++;
          console.log(`  ✓ Deleted patient record (ID: ${patientId})`);
        }
        
        // Delete user record
        await connection.execute('DELETE FROM users WHERE id = ?', [user.userId]);
        totalDeleted.users++;
        console.log(`  ✓ Deleted user record (ID: ${user.userId})\n`);
      }
    } else {
      console.log('✓ No test users found\n');
    }
    
    // ===== STEP 2: Find orphaned patients (no user) =====
    console.log('▶ STEP 2: Finding orphaned patients (patients without users)...\n');
    
    const [orphanedPatients] = await connection.execute(`
      SELECT p.id, p.firstName, p.lastName, p.userId
      FROM patients p
      LEFT JOIN users u ON u.id = p.userId
      WHERE u.id IS NULL
    `);
    
    if (orphanedPatients.length > 0) {
      console.log(`Found ${orphanedPatients.length} orphaned patient(s):\n`);
      console.table(orphanedPatients.map(p => ({
        patientId: p.id,
        userId: p.userId,
        name: `${p.firstName} ${p.lastName}`
      })));
      
      console.log('\n⚠️  Deleting orphaned patients...\n');
      
      for (const patient of orphanedPatients) {
        // Delete related records first
        await connection.execute('DELETE FROM checkups WHERE patientId = ?', [patient.id]);
        await connection.execute('DELETE FROM appointments WHERE patientId = ?', [patient.id]);
        await connection.execute('DELETE FROM vaccinations WHERE patientId = ?', [patient.id]);
        
        // Delete patient
        await connection.execute('DELETE FROM patients WHERE id = ?', [patient.id]);
        totalDeleted.patients++;
        console.log(`  ✓ Deleted orphaned patient (ID: ${patient.id}, Name: ${patient.firstName} ${patient.lastName})`);
      }
    } else {
      console.log('✓ No orphaned patients found\n');
    }
    
    // ===== STEP 3: Find orphaned users (patient role but no patient record) =====
    console.log('▶ STEP 3: Finding orphaned users (patient role without patient record)...\n');
    
    const [orphanedUsers] = await connection.execute(`
      SELECT u.id, u.username, u.email, u.role
      FROM users u
      LEFT JOIN patients p ON p.userId = u.id
      WHERE u.role = 'patient' AND p.id IS NULL
    `);
    
    if (orphanedUsers.length > 0) {
      console.log(`Found ${orphanedUsers.length} orphaned user(s):\n`);
      console.table(orphanedUsers.map(u => ({
        userId: u.id,
        username: u.username,
        email: u.email || 'N/A'
      })));
      
      console.log('\n⚠️  Deleting orphaned users...\n');
      
      for (const user of orphanedUsers) {
        await connection.execute('DELETE FROM users WHERE id = ?', [user.id]);
        totalDeleted.users++;
        console.log(`  ✓ Deleted orphaned user (ID: ${user.id}, Username: ${user.username})`);
      }
    } else {
      console.log('✓ No orphaned users found\n');
    }
    
    // Final summary
    console.log('======================================================================');
    console.log('  📊 CLEANUP SUMMARY');
    console.log('======================================================================\n');
    console.log(`  Patients deleted: ${totalDeleted.patients}`);
    console.log(`  Users deleted: ${totalDeleted.users}`);
    console.log(`  Checkups deleted: ${totalDeleted.checkups}`);
    console.log(`  Appointments deleted: ${totalDeleted.appointments}`);
    console.log(`  Vaccinations deleted: ${totalDeleted.vaccinations}`);
    console.log(`  Total records deleted: ${Object.values(totalDeleted).reduce((a, b) => a + b, 0)}`);
    console.log('\n======================================================================\n');
    
    if (Object.values(totalDeleted).reduce((a, b) => a + b, 0) > 0) {
      console.log('  ✅ Cleanup completed successfully!\n');
    } else {
      console.log('  ✅ Database is clean - no records to delete!\n');
    }
    
  } catch (error) {
    console.error('\n❌ CLEANUP FAILED!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('ℹ Database connection closed\n');
    }
  }
}

deepCleanup();
