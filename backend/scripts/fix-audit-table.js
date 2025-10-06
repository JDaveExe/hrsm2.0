const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hrsm2'
};

const fixAuditTableSchema = async () => {
  let connection;
  
  try {
    console.log('🔗 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database!');
    
    // Check if audit_logs table exists
    console.log('📋 Checking if audit_logs table exists...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'audit_logs'
    `, [dbConfig.database]);
    
    if (tables.length > 0) {
      console.log('🗑️ Dropping existing audit_logs table with invalid data...');
      await connection.execute('DROP TABLE IF EXISTS audit_logs');
      console.log('✅ Old audit_logs table dropped');
    }
    
    // Create fresh audit_logs table
    console.log('🔨 Creating fresh audit_logs table...');
    await connection.execute(`
      CREATE TABLE audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL COMMENT 'ID of the user who performed the action',
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
        updatedAt DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_userId (userId),
        INDEX idx_userRole (userRole),
        INDEX idx_action (action),
        INDEX idx_targetType_targetId (targetType, targetId),
        INDEX idx_timestamp (timestamp),
        INDEX idx_timestamp_userRole (timestamp, userRole)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Fresh audit_logs table created successfully!');
    
    // Insert a test audit log entry
    console.log('📝 Inserting test audit log entry...');
    await connection.execute(`
      INSERT INTO audit_logs (
        userId, userRole, userName, action, actionDescription, 
        targetType, targetId, targetName, timestamp
      ) VALUES (
        1, 'admin', 'System Administrator', 'system_initialized', 
        'System Administrator initialized the audit trail system',
        'audit', 1, 'Audit System', NOW()
      )
    `);
    
    console.log('✅ Test audit log entry created!');
    console.log('🎉 Audit logs table is ready for use!');
    
  } catch (error) {
    console.error('❌ Error fixing audit table schema:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
};

// Run the fix
fixAuditTableSchema().catch(console.error);