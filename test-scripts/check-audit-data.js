/**
 * Check what's in audit_logs and show the dropdown data
 */

require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./backend/config/database');

async function checkAuditData() {
  try {
    console.log('🔍 Checking audit log data...\n');

    // Show unique actions
    const actions = await sequelize.query(
      'SELECT DISTINCT action FROM audit_logs WHERE action IS NOT NULL ORDER BY action',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`📋 Unique Actions (${actions.length}): `);
    actions.forEach(row => console.log(`   - ${row.action}`));

    // Show unique target types
    const types = await sequelize.query(
      'SELECT DISTINCT targetType FROM audit_logs WHERE targetType IS NOT NULL ORDER BY targetType',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`\n📋 Unique Target Types (${types.length}):`);
    types.forEach(row => console.log(`   - ${row.targetType}`));

    // Show total count
    const count = await sequelize.query(
      'SELECT COUNT(*) as count FROM audit_logs',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log(`\n📊 Total audit logs: ${count[0].count}`);

    // Show recent logs
    const recent = await sequelize.query(
      'SELECT action, actionDescription, targetType, userName, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 5',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`\n📅 Recent Logs:`);
    recent.forEach(log => {
      console.log(`   ${log.timestamp} - ${log.userName} - ${log.action} - ${log.actionDescription.substring(0, 50)}...`);
    });

    console.log('\n✅ Data check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAuditData();
