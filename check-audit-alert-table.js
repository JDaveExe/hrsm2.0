/**
 * Check if audit_alert_notifications table exists
 */

const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hrsm2'
};

async function checkAlertTable() {
  console.log('🔍 Checking for audit_alert_notifications table...\n');
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);

    // Check if audit_alert_notifications table exists
    try {
      const [columns] = await connection.execute('DESCRIBE audit_alert_notifications');
      console.log('✅ audit_alert_notifications table EXISTS!');
      console.log('📊 Table structure:');
      console.log('=' .repeat(80));
      columns.forEach(col => {
        console.log(`${col.Field.padEnd(20)} | ${col.Type.padEnd(30)} | ${col.Null.padEnd(5)} | ${col.Key}`);
      });
      console.log('=' .repeat(80));
      console.log('\n✅ Ready to use the banner system!');
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('❌ audit_alert_notifications table does NOT exist yet');
        console.log('\n📝 Creating table manually...\n');
        
        // Create the table
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS audit_alert_notifications (
            id INT PRIMARY KEY AUTO_INCREMENT,
            auditLogId INT NOT NULL,
            severity ENUM('critical', 'high', 'medium') DEFAULT 'high',
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            actionType VARCHAR(100) NOT NULL,
            performedBy VARCHAR(255) NOT NULL,
            performedByRole VARCHAR(50) NOT NULL,
            targetInfo JSON,
            isRead BOOLEAN DEFAULT FALSE,
            isDismissed BOOLEAN DEFAULT FALSE,
            dismissedBy INT,
            dismissedAt DATETIME,
            expiresAt DATETIME,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL,
            FOREIGN KEY (auditLogId) REFERENCES audit_logs(id) ON DELETE CASCADE,
            INDEX idx_severity (severity),
            INDEX idx_read_dismissed (isRead, isDismissed),
            INDEX idx_expires (expiresAt),
            INDEX idx_created (createdAt)
          )
        `);
        
        console.log('✅ Table created successfully!');
        
        // Verify creation
        const [newColumns] = await connection.execute('DESCRIBE audit_alert_notifications');
        console.log('\n📊 New table structure:');
        console.log('=' .repeat(80));
        newColumns.forEach(col => {
          console.log(`${col.Field.padEnd(20)} | ${col.Type.padEnd(30)} | ${col.Null.padEnd(5)} | ${col.Key}`);
        });
        console.log('=' .repeat(80));
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkAlertTable();
