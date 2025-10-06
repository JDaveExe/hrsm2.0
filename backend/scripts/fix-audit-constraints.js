require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixAuditTableConstraints() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hrsm_db'
    });

    console.log('🔗 Connected to database');

    // Check if audit_logs table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'audit_logs'
    `, [process.env.DB_NAME || 'hrsm_db']);

    if (tables.length === 0) {
      console.log('✅ audit_logs table does not exist, no cleanup needed');
      return;
    }

    console.log('📋 Cleaning up audit_logs table...');

    // Drop all foreign key constraints first
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'audit_logs' AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [process.env.DB_NAME || 'hrsm_db']);

    for (const constraint of constraints) {
      try {
        await connection.execute(`ALTER TABLE audit_logs DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
        console.log(`✅ Dropped foreign key constraint: ${constraint.CONSTRAINT_NAME}`);
      } catch (err) {
        console.log(`⚠️ Could not drop constraint ${constraint.CONSTRAINT_NAME}:`, err.message);
      }
    }

    // Delete all existing records to start fresh
    const [deleteResult] = await connection.execute('DELETE FROM audit_logs');
    console.log(`✅ Deleted ${deleteResult.affectedRows} existing audit log records`);

    // Drop and recreate the table to ensure clean state
    await connection.execute('DROP TABLE IF EXISTS audit_logs');
    console.log('✅ Dropped audit_logs table');

    // Create the table with proper structure
    await connection.execute(`
      CREATE TABLE audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        userRole ENUM('admin', 'doctor', 'management', 'staff', 'patient') NOT NULL COMMENT 'Role of the user who performed the action',
        userName VARCHAR(255) NOT NULL COMMENT 'Full name of the user who performed the action',
        action VARCHAR(255) NOT NULL COMMENT 'The action performed (e.g., "removed_patient", "checked_in_patient")',
        actionDescription TEXT NOT NULL COMMENT 'Human-readable description of the action',
        targetType ENUM('patient', 'user', 'medication', 'vaccine', 'appointment', 'checkup', 'report') NULL COMMENT 'Type of entity that was affected by the action',
        targetId INT NULL COMMENT 'ID of the entity that was affected',
        targetName VARCHAR(255) NULL COMMENT 'Name/identifier of the affected entity',
        metadata JSON NULL COMMENT 'Additional data related to the action (medications, vaccines, etc.)',
        ipAddress VARCHAR(45) NULL COMMENT 'IP address of the user when action was performed',
        userAgent TEXT NULL COMMENT 'Browser/client information',
        sessionId VARCHAR(255) NULL COMMENT 'Session ID when action was performed',
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the action was performed',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_userId (userId),
        INDEX idx_userRole (userRole),
        INDEX idx_action (action),
        INDEX idx_targetType_targetId (targetType, targetId),
        INDEX idx_timestamp (timestamp),
        INDEX idx_timestamp_userRole (timestamp, userRole)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created new audit_logs table with proper structure');

    console.log('✅ Audit logs table is now ready for use');

  } catch (error) {
    console.error('❌ Error fixing audit table:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
fixAuditTableConstraints()
  .then(() => {
    console.log('✅ Audit table constraints fixed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to fix audit table constraints:', error);
    process.exit(1);
  });