const { sequelize } = require('./backend/config/database');

async function clearAuditLogs() {
  try {
    console.log('🗑️  Clearing audit logs to start fresh...');
    
    // Clear all audit log data
    await sequelize.query('DELETE FROM audit_logs');
    
    // Reset auto-increment counter
    await sequelize.query('ALTER TABLE audit_logs AUTO_INCREMENT = 1');
    
    // Verify the table is empty
    const [results] = await sequelize.query('SELECT COUNT(*) as audit_log_count FROM audit_logs');
    const count = results[0].audit_log_count;
    
    console.log(`✅ Audit logs cleared successfully. Current count: ${count}`);
    console.log('🎉 Audit trail is now ready for fresh data!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing audit logs:', error);
    process.exit(1);
  }
}

clearAuditLogs();