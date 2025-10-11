require('dotenv').config();
const { sequelize } = require('./backend/config/database');
const AuditLog = require('./backend/models/AuditLog');

async function checkAuditLogs() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // Get all unique actions
    const actions = await sequelize.query(
      `SELECT DISTINCT action, COUNT(*) as count 
       FROM audit_logs 
       GROUP BY action 
       ORDER BY count DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('================================================================================');
    console.log('  📊 AUDIT TRAIL DATABASE ANALYSIS');
    console.log('================================================================================\n');

    console.log('📋 Audit Events by Type:\n');
    actions.forEach((action, index) => {
      console.log(`  ${index + 1}. ${action.action.padEnd(30)} - ${action.count} events`);
    });

    // Get recent audit logs
    const recentLogs = await AuditLog.findAll({
      limit: 15,
      order: [['createdAt', 'DESC']]
    });

    console.log('\n\n📝 Recent Audit Events:\n');
    recentLogs.forEach((log, index) => {
      const date = new Date(log.createdAt);
      console.log(`  ${index + 1}. [${log.action}]`);
      console.log(`     ${log.actionDescription}`);
      console.log(`     User: ${log.userName || 'Unknown'}, Time: ${date.toLocaleString()}`);
      console.log('');
    });

    // Check for required audit event types
    console.log('\n================================================================================');
    console.log('  ✅ AUDIT TRAIL IMPLEMENTATION CHECKLIST');
    console.log('================================================================================\n');

    const requiredEvents = [
      { name: 'Patient Check-in', action: 'checked_in_patient' },
      { name: 'Patient Removal', action: 'removed_patient' },
      { name: 'Vital Signs Check', action: 'checked_vital_signs' },
      { name: 'Patient Transfer', action: 'transferred_patient' },
      { name: 'Vaccination', action: 'vaccinated_patient' },
      { name: 'User Creation', action: 'created_user' },
      { name: 'Checkup Start', action: 'started_checkup' },
      { name: 'Checkup Finish', action: 'finished_checkup' },
      { name: 'Medication Addition', action: 'added_new_medication' },
      { name: 'Vaccine Addition', action: 'added_new_vaccine' },
      { name: 'Stock Addition', action: 'added_stocks' },
      { name: 'Report Creation', action: 'created_report' }
    ];

    for (const event of requiredEvents) {
      const count = actions.find(a => a.action === event.action)?.count || 0;
      const status = count > 0 ? '✅' : '❌';
      const impl = count > 0 ? `WORKING (${count} events)` : 'NOT LOGGED YET';
      console.log(`${status} ${event.name.padEnd(25)} - ${impl}`);
    }

    const totalCount = await AuditLog.count();
    console.log('\n================================================================================');
    console.log(`  📈 Total audit events in database: ${totalCount}`);
    console.log('================================================================================\n');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkAuditLogs();
