// BATCH SYSTEM MIGRATION - SAFETY PLAN AND BACKUP
// CRITICAL: This script creates backups and documents current system state

const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function createSafetyPlan() {
    try {
        console.log('🛡️  PHARMACEUTICAL BATCH SYSTEM MIGRATION');
        console.log('==========================================');
        console.log('🚨 CRITICAL SYSTEM MODIFICATION IN PROGRESS');
        console.log('⚠️  Patient safety depends on careful execution\n');
        
        // Create backup directory
        const backupDir = path.join(__dirname, 'batch-migration-backup');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir);
        }
        
        console.log('1. 📂 Creating data backups...');
        
        // Backup current medication data
        const medicationResponse = await axios.get('http://localhost:5000/api/inventory/medications');
        const medicationBackup = {
            timestamp: new Date().toISOString(),
            totalRecords: medicationResponse.data.length,
            data: medicationResponse.data
        };
        
        fs.writeFileSync(
            path.join(backupDir, 'medications-backup.json'),
            JSON.stringify(medicationBackup, null, 2)
        );
        
        // Backup current vaccine data
        const vaccineResponse = await axios.get('http://localhost:5000/api/inventory/vaccines');
        const vaccineBackup = {
            timestamp: new Date().toISOString(),
            totalRecords: vaccineResponse.data.length,
            data: vaccineResponse.data
        };
        
        fs.writeFileSync(
            path.join(backupDir, 'vaccines-backup.json'),
            JSON.stringify(vaccineBackup, null, 2)
        );
        
        console.log(`✅ Backed up ${medicationResponse.data.length} medications`);
        console.log(`✅ Backed up ${vaccineResponse.data.length} vaccines`);
        
        // Document current database structure
        console.log('\n2. 📋 Documenting current structure...');
        
        const currentStructure = {
            timestamp: new Date().toISOString(),
            medications: {
                totalRecords: medicationResponse.data.length,
                sampleStructure: medicationResponse.data[0] || {},
                criticalFields: {
                    batchNumber: 'Single batch per medication',
                    unitsInStock: 'Total stock without batch breakdown',
                    expiryDate: 'Single expiry date per medication'
                }
            },
            vaccines: {
                totalRecords: vaccineResponse.data.length,
                sampleStructure: vaccineResponse.data[0] || {}
            }
        };
        
        fs.writeFileSync(
            path.join(backupDir, 'current-structure.json'),
            JSON.stringify(currentStructure, null, 2)
        );
        
        // Create rollback instructions
        console.log('\n3. 📝 Creating rollback procedures...');
        
        const rollbackInstructions = `
# BATCH MIGRATION ROLLBACK PROCEDURES
====================================

## Emergency Rollback Steps:

1. STOP the application immediately
2. Restore database from backup
3. Replace modified files with originals
4. Restart application
5. Verify data integrity

## Files to Backup Before Migration:
- backend/models/Prescription.sequelize.js
- src/components/management/components/PrescriptionInventory.js
- src/components/management/components/VaccineInventory.js
- All inventory-related API endpoints

## Critical Data Points:
- Total medications: ${medicationResponse.data.length}
- Total vaccines: ${vaccineResponse.data.length}
- Backup location: ./batch-migration-backup/
- Backup timestamp: ${new Date().toISOString()}

## Validation Queries:
- Check total stock matches before/after migration
- Verify no duplicate batch records
- Confirm all expiry dates preserved
- Test add-stock functionality

## Emergency Contact:
If migration fails, immediately restore from backup and investigate.
`;
        
        fs.writeFileSync(
            path.join(backupDir, 'ROLLBACK-INSTRUCTIONS.md'),
            rollbackInstructions
        );
        
        // Create migration log
        console.log('\n4. 📊 Initializing migration log...');
        
        const migrationLog = {
            startTime: new Date().toISOString(),
            phase: 'BACKUP_COMPLETED',
            steps: [
                {
                    step: 'Backup Creation',
                    timestamp: new Date().toISOString(),
                    status: 'COMPLETED',
                    details: 'Medications and vaccines backed up successfully'
                }
            ],
            criticalChecks: {
                dataIntegrity: 'PENDING',
                batchMigration: 'PENDING',
                frontendUpdates: 'PENDING',
                fifoLogic: 'PENDING'
            }
        };
        
        fs.writeFileSync(
            path.join(backupDir, 'migration-log.json'),
            JSON.stringify(migrationLog, null, 2)
        );
        
        console.log('\n🛡️  SAFETY MEASURES COMPLETED');
        console.log('==============================');
        console.log('✅ Data backed up successfully');
        console.log('✅ Current structure documented');
        console.log('✅ Rollback procedures created');
        console.log('✅ Migration log initialized');
        
        console.log('\n📂 Backup location:', backupDir);
        console.log('\n🚀 Ready to proceed with batch system implementation');
        console.log('⚠️  Proceed with extreme caution - patient safety is critical!');
        
        return {
            backupDir,
            medicationCount: medicationResponse.data.length,
            vaccineCount: vaccineResponse.data.length,
            ready: true
        };
        
    } catch (error) {
        console.error('❌ CRITICAL ERROR during backup creation:', error.message);
        console.log('\n🛑 MIGRATION ABORTED - Cannot proceed without proper backups');
        throw error;
    }
}

createSafetyPlan();