/**
 * COMPLETE PATIENT DATA CLEANUP SCRIPT
 * Removes ALL patients and their related records from the database
 * Use this before major address structure changes
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

console.log('======================================================================');
console.log('  🧹 COMPLETE PATIENT DATA CLEANUP');
console.log('  ⚠️  WARNING: This will delete ALL patient records!');
console.log('======================================================================\n');

async function clearAllPatientData() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✓ Connected to database\n');
    
    let deletionStats = {
      checkInSessions: 0,
      vaccinations: 0,
      appointments: 0,
      vitalSigns: 0,
      patientAuditLogs: 0,
      patients: 0,
      patientUsers: 0
    };
    
    // Start transaction
    await connection.beginTransaction();
    console.log('▶ Starting database transaction...\n');
    
    // STEP 1: Get all patient IDs and user IDs first
    console.log('▶ STEP 1: Identifying all patients...\n');
    const [patients] = await connection.execute(`
      SELECT p.id as patientId, p.userId, p.firstName, p.lastName, u.email
      FROM patients p
      LEFT JOIN users u ON p.userId = u.id
    `);
    
    console.log(`Found ${patients.length} patients to delete:\n`);
    patients.slice(0, 10).forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.firstName} ${p.lastName} (Patient ID: ${p.patientId}, User ID: ${p.userId}, Email: ${p.email || 'N/A'})`);
    });
    if (patients.length > 10) {
      console.log(`  ... and ${patients.length - 10} more patients\n`);
    } else {
      console.log('');
    }
    
    if (patients.length === 0) {
      console.log('✅ No patients found in database. Already clean!\n');
      await connection.commit();
      return deletionStats;
    }
    
    const patientIds = patients.map(p => p.patientId);
    const userIds = patients.map(p => p.userId).filter(id => id !== null);
    
    // STEP 2: Delete check-in sessions
    console.log('▶ STEP 2: Deleting check-in sessions...\n');
    if (patientIds.length > 0) {
      const [checkInResult] = await connection.execute(
        `DELETE FROM check_in_sessions WHERE patientId IN (${patientIds.map(() => '?').join(',')})`,
        patientIds
      );
      deletionStats.checkInSessions = checkInResult.affectedRows;
      console.log(`  ✓ Deleted ${deletionStats.checkInSessions} check-in session records\n`);
    }
    
    // STEP 3: Delete vaccination records
    console.log('▶ STEP 3: Deleting vaccination records...\n');
    if (patientIds.length > 0) {
      const [vaccinationResult] = await connection.execute(
        `DELETE FROM vaccinations WHERE patientId IN (${patientIds.map(() => '?').join(',')})`,
        patientIds
      );
      deletionStats.vaccinations = vaccinationResult.affectedRows;
      console.log(`  ✓ Deleted ${deletionStats.vaccinations} vaccination records\n`);
    }
    
    // STEP 4: Delete appointments
    console.log('▶ STEP 4: Deleting appointments...\n');
    if (patientIds.length > 0) {
      const [appointmentResult] = await connection.execute(
        `DELETE FROM appointments WHERE patientId IN (${patientIds.map(() => '?').join(',')})`,
        patientIds
      );
      deletionStats.appointments = appointmentResult.affectedRows;
      console.log(`  ✓ Deleted ${deletionStats.appointments} appointment records\n`);
    }
    
    // STEP 5: Delete vital signs
    console.log('▶ STEP 5: Deleting vital signs...\n');
    if (patientIds.length > 0) {
      const [vitalSignsResult] = await connection.execute(
        `DELETE FROM vital_signs WHERE patientId IN (${patientIds.map(() => '?').join(',')})`,
        patientIds
      );
      deletionStats.vitalSigns = vitalSignsResult.affectedRows;
      console.log(`  ✓ Deleted ${deletionStats.vitalSigns} vital sign records\n`);
    }
    
    // STEP 6: Delete patient-related audit logs (skip if column doesn't exist)
    console.log('▶ STEP 6: Checking and deleting patient-related audit logs...\n');
    try {
      if (patientIds.length > 0) {
        const [auditResult] = await connection.execute(
          `DELETE FROM audit_logs WHERE patientId IN (${patientIds.map(() => '?').join(',')})`,
          patientIds
        );
        deletionStats.patientAuditLogs = auditResult.affectedRows;
        console.log(`  ✓ Deleted ${deletionStats.patientAuditLogs} audit log entries\n`);
      }
    } catch (error) {
      console.log(`  ⚠ Skipping audit logs (column 'patientId' may not exist): ${error.message}\n`);
    }
    
    // STEP 7: Delete patient records
    console.log('▶ STEP 7: Deleting patient records...\n');
    if (patientIds.length > 0) {
      const [patientResult] = await connection.execute(
        `DELETE FROM patients WHERE id IN (${patientIds.map(() => '?').join(',')})`,
        patientIds
      );
      deletionStats.patients = patientResult.affectedRows;
      console.log(`  ✓ Deleted ${deletionStats.patients} patient records\n`);
    }
    
    // STEP 8: Delete patient user accounts
    console.log('▶ STEP 8: Deleting patient user accounts...\n');
    if (userIds.length > 0) {
      const [userResult] = await connection.execute(
        `DELETE FROM users WHERE id IN (${userIds.map(() => '?').join(',')}) AND role = 'patient'`,
        userIds
      );
      deletionStats.patientUsers = userResult.affectedRows;
      console.log(`  ✓ Deleted ${deletionStats.patientUsers} patient user accounts\n`);
    }
    
    // Commit transaction
    await connection.commit();
    console.log('✓ Transaction committed successfully\n');
    
    // Verify cleanup
    console.log('▶ Verifying cleanup...\n');
    const [remainingPatients] = await connection.execute('SELECT COUNT(*) as count FROM patients');
    const [remainingUsers] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE role = "patient"');
    const [remainingAppointments] = await connection.execute('SELECT COUNT(*) as count FROM appointments');
    
    console.log('Verification Results:');
    console.log(`  • Remaining patients: ${remainingPatients[0].count}`);
    console.log(`  • Remaining patient users: ${remainingUsers[0].count}`);
    console.log(`  • Remaining appointments: ${remainingAppointments[0].count}\n`);
    
    if (remainingPatients[0].count === 0 && remainingUsers[0].count === 0) {
      console.log('✅ DATABASE SUCCESSFULLY CLEANED!\n');
    } else {
      console.log('⚠️  Some records may still remain. Please check manually.\n');
    }
    
    return deletionStats;
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
      console.log('✗ Transaction rolled back due to error\n');
    }
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed\n');
    }
  }
}

async function main() {
  try {
    console.log('⚠️  WARNING: This script will permanently delete ALL patient data!\n');
    console.log('This includes:');
    console.log('  • All patient records');
    console.log('  • All vaccinations');
    console.log('  • All appointments');
    console.log('  • All vital signs');
    console.log('  • All patient-related audit logs');
    console.log('  • All patient user accounts\n');
    console.log('Press Ctrl+C now to cancel, or wait 5 seconds to continue...\n');
    
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const stats = await clearAllPatientData();
    
    console.log('======================================================================');
    console.log('  📊 DELETION SUMMARY');
    console.log('======================================================================\n');
    console.log(`  Check-in sessions deleted:  ${stats.checkInSessions}`);
    console.log(`  Vaccinations deleted:       ${stats.vaccinations}`);
    console.log(`  Appointments deleted:       ${stats.appointments}`);
    console.log(`  Vital signs deleted:        ${stats.vitalSigns}`);
    console.log(`  Audit logs deleted:         ${stats.patientAuditLogs}`);
    console.log(`  Patient records deleted:    ${stats.patients}`);
    console.log(`  Patient users deleted:      ${stats.patientUsers}\n`);
    console.log('======================================================================');
    console.log('  ✅ CLEANUP COMPLETE - Ready for address structure migration!');
    console.log('======================================================================\n');
    
  } catch (error) {
    console.error('\n❌ CLEANUP FAILED:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Execute cleanup
main();
