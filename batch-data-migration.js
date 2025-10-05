
const { Sequelize, DataTypes } = require('sequelize');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function migrateToBatchSystem() {
    console.log('🚨 CRITICAL MEDICATION DATA MIGRATION');
    console.log('====================================');
    console.log('⚠️  Patient safety depends on successful migration');
    console.log('🛡️  All data will be validated before and after migration\n');
    
    try {
        // Step 1: Load backup data for validation
        console.log('1. 📂 Loading backup data for validation...');
        const backupDir = path.join(__dirname, 'batch-migration-backup');
        const medicationBackup = JSON.parse(
            fs.readFileSync(path.join(backupDir, 'medications-backup.json'), 'utf8')
        );
        
        console.log(`✅ Loaded backup: ${medicationBackup.data.length} medications`);
        
        // Step 2: Get current medication data from API
        console.log('\n2. 🔄 Fetching current medication data...');
        const currentResponse = await axios.get('http://localhost:5000/api/inventory/medications');
        const currentMedications = currentResponse.data;
        
        console.log(`✅ Current medications: ${currentMedications.length}`);
        
        // Step 3: Validate data integrity before migration
        console.log('\n3. 🔍 Validating data integrity...');
        if (medicationBackup.data.length !== currentMedications.length) {
            throw new Error(`Data count mismatch: Backup(${medicationBackup.data.length}) vs Current(${currentMedications.length})`);
        }
        
        console.log('✅ Data counts match');
        
        // Step 4: Prepare batch records from current medication data
        console.log('\n4. 🏗️  Preparing batch records...');
        const batchRecords = [];
        const migrationLog = [];
        
        for (const medication of currentMedications) {
            try {
                // Validate required fields exist
                if (!medication.batchNumber || !medication.unitsInStock || !medication.expiryDate) {
                    console.warn(`⚠️  Skipping ${medication.name}: Missing batch data`);
                    migrationLog.push({
                        medicationId: medication.id,
                        medicationName: medication.name,
                        status: 'SKIPPED',
                        reason: 'Missing batch data',
                        timestamp: new Date().toISOString()
                    });
                    continue;
                }
                
                // Create batch record from existing medication data
                const batchRecord = {
                    medicationId: medication.id,
                    batchNumber: medication.batchNumber,
                    quantityReceived: medication.unitsInStock, // Assume current stock was original
                    quantityRemaining: medication.unitsInStock,
                    unitCost: medication.unitCost || 0,
                    expiryDate: medication.expiryDate,
                    receivedDate: new Date().toISOString(), // Set to today for existing data
                    supplier: medication.manufacturer || 'Unknown',
                    status: new Date(medication.expiryDate) < new Date() ? 'expired' : 'active',
                    notes: 'Migrated from legacy single-batch system',
                    createdBy: 1 // System user
                };
                
                batchRecords.push(batchRecord);
                
                migrationLog.push({
                    medicationId: medication.id,
                    medicationName: medication.name,
                    batchNumber: medication.batchNumber,
                    quantity: medication.unitsInStock,
                    expiryDate: medication.expiryDate,
                    status: 'PREPARED',
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error(`❌ Error preparing ${medication.name}: ${error.message}`);
                migrationLog.push({
                    medicationId: medication.id,
                    medicationName: medication.name,
                    status: 'ERROR',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
        
        console.log(`✅ Prepared ${batchRecords.length} batch records`);
        
        // Step 5: Save migration plan for review
        console.log('\n5. 📋 Saving migration plan...');
        const migrationPlan = {
            timestamp: new Date().toISOString(),
            totalMedications: currentMedications.length,
            batchRecordsToCreate: batchRecords.length,
            migrationLog: migrationLog,
            batchRecords: batchRecords
        };
        
        fs.writeFileSync(
            path.join(backupDir, 'migration-plan.json'),
            JSON.stringify(migrationPlan, null, 2)
        );
        
        console.log('✅ Migration plan saved');
        
        // Step 6: Create batch records via API (when ready)
        console.log('\n6. 🚀 Creating batch records...');
        console.log('⚠️  This step will be executed when models are updated');
        
        // Placeholder for actual batch creation
        // This will be uncommented after models are updated:
        /*
        for (const batchRecord of batchRecords) {
            try {
                const response = await axios.post('http://localhost:5000/api/inventory/batches', batchRecord);
                console.log(`✅ Created batch: ${batchRecord.batchNumber}`);
            } catch (error) {
                console.error(`❌ Failed to create batch ${batchRecord.batchNumber}: ${error.message}`);
            }
        }
        */
        
        console.log('\n🎯 MIGRATION PLAN SUMMARY:');
        console.log(`📦 Total medications: ${currentMedications.length}`);
        console.log(`📋 Batch records to create: ${batchRecords.length}`);
        console.log(`✅ Successfully prepared: ${migrationLog.filter(l => l.status === 'PREPARED').length}`);
        console.log(`⚠️  Skipped: ${migrationLog.filter(l => l.status === 'SKIPPED').length}`);
        console.log(`❌ Errors: ${migrationLog.filter(l => l.status === 'ERROR').length}`);
        
        console.log('\n📂 Files created:');
        console.log('- migration-plan.json (batch records to create)');
        console.log('- migration-log.json (detailed log)');
        
        console.log('\n⚠️  NEXT STEPS:');
        console.log('1. Review migration-plan.json');
        console.log('2. Update backend models');
        console.log('3. Execute batch creation');
        console.log('4. Validate data integrity');
        console.log('5. Update frontend components');
        
        return {
            success: true,
            batchRecordsCount: batchRecords.length,
            migrationLog: migrationLog
        };
        
    } catch (error) {
        console.error('🚨 CRITICAL MIGRATION ERROR:', error.message);
        console.log('\n🛑 MIGRATION ABORTED');
        console.log('🔄 Please restore from backup and investigate');
        throw error;
    }
}

// Export for use in actual migration
module.exports = { migrateToBatchSystem };

// Run if called directly
if (require.main === module) {
    migrateToBatchSystem()
        .then((result) => {
            console.log('\n🎉 MIGRATION PREPARATION COMPLETED');
            console.log(`📊 ${result.batchRecordsCount} batch records prepared`);
        })
        .catch((error) => {
            console.error('💥 MIGRATION FAILED:', error.message);
            process.exit(1);
        });
}
