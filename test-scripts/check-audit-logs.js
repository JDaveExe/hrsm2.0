/**
 * Direct database check for audit logs
 */

// Load environment variables from backend folder
require('dotenv').config({ path: './backend/.env' });

const { Sequelize } = require('sequelize');
const AuditLog = require('./backend/models/AuditLog');

async function checkAuditLogs() {
  console.log('🔍 Checking Audit Logs in Database\n');
  console.log('='.repeat(70));

  try {
    // Get all audit logs (limit to recent 20)
    const allLogs = await AuditLog.findAll({
      limit: 20,
      order: [['timestamp', 'DESC']],
      attributes: ['id', 'userId', 'userName', 'userRole', 'action', 'actionDescription', 'targetType', 'timestamp']
    });

    console.log(`\n📊 Found ${allLogs.length} recent audit logs\n`);

    if (allLogs.length === 0) {
      console.log('⚠️  No audit logs found in database!');
      console.log('   Possible reasons:');
      console.log('   1. Database is empty or was recently cleared');
      console.log('   2. AuditLog table doesn\'t exist');
      console.log('   3. No actions have been logged yet');
      return;
    }

    // Group by userId
    const byUser = {};
    allLogs.forEach(log => {
      const userId = log.userId || 'NULL';
      if (!byUser[userId]) {
        byUser[userId] = [];
      }
      byUser[userId].push(log);
    });

    console.log('👥 Logs grouped by User ID:\n');
    Object.keys(byUser).forEach(userId => {
      const userLogs = byUser[userId];
      const userName = userLogs[0].userName || 'Unknown';
      const userRole = userLogs[0].userRole || 'Unknown';
      
      console.log(`   User ID ${userId} (${userName} - ${userRole}): ${userLogs.length} activities`);
    });

    console.log('\n' + '-'.repeat(70));
    console.log('\n📝 Most Recent 10 Activities:\n');

    allLogs.slice(0, 10).forEach((log, index) => {
      console.log(`${index + 1}. [${new Date(log.timestamp).toLocaleString()}]`);
      console.log(`   User: ${log.userName} (ID: ${log.userId}, Role: ${log.userRole})`);
      console.log(`   Action: ${log.action}`);
      console.log(`   Description: ${log.actionDescription || 'N/A'}`);
      console.log(`   Target: ${log.targetType} (${log.targetId || 'N/A'})`);
      console.log('');
    });

    // Check for specific actions
    console.log('-'.repeat(70));
    console.log('\n🔎 Action Types Summary:\n');
    
    const actionCounts = {};
    allLogs.forEach(log => {
      const action = log.action || 'unknown';
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });

    Object.entries(actionCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([action, count]) => {
        console.log(`   ${action}: ${count}`);
      });

    console.log('\n' + '='.repeat(70));
    console.log('\n💡 Next Steps:');
    console.log('   1. Find your user ID from the list above');
    console.log('   2. Check if your recent actions appear with your user ID');
    console.log('   3. If your actions are missing, audit logging may not be working');
    console.log('   4. If your actions exist, the profile endpoint should show them\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    process.exit(0);
  }
}

checkAuditLogs();
