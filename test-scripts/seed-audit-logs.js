/**
 * Seed Audit Logs for Testing Dropdowns
 * This script creates sample audit log entries to populate the action and type dropdowns
 */

// Load environment variables from backend directory
require('dotenv').config({ path: './backend/.env' });

const { sequelize } = require('./backend/config/database');
const AuditLog = require('./backend/models/AuditLog');

async function seedAuditLogs() {
  try {
    console.log('🌱 Starting audit log seeding...\n');

    // Check if audit_logs table exists and has data
    const existingLogs = await AuditLog.count();
    console.log(`📊 Current audit logs in database: ${existingLogs}`);

    // Sample audit log entries covering all actions and types
    const sampleLogs = [
      // Report actions
      {
        userId: 1,
        userName: 'Admin User',
        userRole: 'management',
        action: 'generated_report',
        actionDescription: 'Generated Patient Demographics report in bar format',
        targetType: 'report',
        targetId: 1,
        targetName: 'Patient Demographics',
        metadata: {
          reportType: 'Patient Demographics',
          format: 'Chart',
          isCustomReport: true
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      },
      // Stock update
      {
        userId: 1,
        userName: 'Admin User',
        userRole: 'management',
        action: 'stock_update',
        actionDescription: 'Added 50 units to Paracetamol (Expiry: 12/31/2026)',
        targetType: 'medication',
        targetId: 1,
        targetName: 'Paracetamol',
        metadata: {
          updateType: 'added',
          quantity: 50,
          itemType: 'medication'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      },
      // Disposal
      {
        userId: 1,
        userName: 'Admin User',
        userRole: 'management',
        action: 'disposed_item',
        actionDescription: 'Disposed vaccine BCG (Qty: 10, Expiry: 09/15/2025, Reason: expired)',
        targetType: 'vaccine',
        targetId: 1,
        targetName: 'BCG',
        metadata: {
          quantity: 10,
          disposalReason: 'expired'
        },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      },
      // Patient action
      {
        userId: 1,
        userName: 'Admin User',
        userRole: 'admin',
        action: 'created_patient',
        actionDescription: 'Created new patient record',
        targetType: 'patient',
        targetId: 100,
        targetName: 'John Doe',
        metadata: {},
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      },
      // User action
      {
        userId: 1,
        userName: 'Admin User',
        userRole: 'admin',
        action: 'created_user',
        actionDescription: 'Created new user account',
        targetType: 'user',
        targetId: 10,
        targetName: 'staff@example.com',
        metadata: {},
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      },
      // Appointment action
      {
        userId: 1,
        userName: 'Admin User',
        userRole: 'management',
        action: 'created_appointment',
        actionDescription: 'Created new appointment',
        targetType: 'appointment',
        targetId: 50,
        targetName: 'Checkup Appointment',
        metadata: {},
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      },
      // Checkup action
      {
        userId: 1,
        userName: 'Admin User',
        userRole: 'doctor',
        action: 'completed_checkup',
        actionDescription: 'Completed patient checkup',
        targetType: 'checkup',
        targetId: 75,
        targetName: 'Patient Checkup',
        metadata: {},
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      },
      // Viewed logs
      {
        userId: 1,
        userName: 'Admin User',
        userRole: 'management',
        action: 'viewed_audit_logs',
        actionDescription: 'Viewed audit trail',
        targetType: 'audit',
        targetId: null,
        targetName: 'Audit Trail',
        metadata: {},
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date()
      }
    ];

    console.log(`\n📝 Creating ${sampleLogs.length} sample audit log entries...\n`);

    // Create all sample logs
    for (const log of sampleLogs) {
      await AuditLog.create(log);
      console.log(`✅ Created: ${log.action} - ${log.actionDescription}`);
    }

    console.log(`\n🎉 Successfully seeded ${sampleLogs.length} audit log entries!`);
    
    // Verify the data
    const finalCount = await AuditLog.count();
    console.log(`📊 Total audit logs now: ${finalCount}\n`);

    // Show unique actions
    const uniqueActions = await sequelize.query(
      'SELECT DISTINCT action FROM audit_logs ORDER BY action',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('📋 Unique Actions:');
    uniqueActions.forEach(row => console.log(`   - ${row.action}`));

    // Show unique types
    const uniqueTypes = await sequelize.query(
      'SELECT DISTINCT targetType FROM audit_logs ORDER BY targetType',
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('\n📋 Unique Target Types:');
    uniqueTypes.forEach(row => console.log(`   - ${row.targetType}`));

    console.log('\n✨ Seeding complete! The dropdowns should now show data.\n');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding audit logs:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the seeder
seedAuditLogs();
