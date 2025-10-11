// Vaccine JSON to Database Batch Migration
require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./backend/config/database');
const fs = require('fs').promises;
const path = require('path');

// JSON vaccine data path
const vaccinesJsonPath = path.join(__dirname, 'backend', 'data', 'vaccines.json');

async function migrateVaccineJsonToBatches() {
    try {
        console.log('🚨 VACCINE JSON TO BATCH MIGRATION');
        console.log('==================================\n');
        
        // Step 1: Initialize models
        console.log('📋 Initializing database models...');
        const VaccineBatchModel = require('./backend/models/VaccineBatch');
        const VaccineBatch = VaccineBatchModel(sequelize);
        
        // Create table if it doesn't exist
        await VaccineBatch.sync({ alter: false });
        console.log('✅ VaccineBatch table ready\n');
        
        // Step 2: Read vaccines.json
        console.log('📖 Reading vaccines.json file...');
        const vaccinesJsonData = await fs.readFile(vaccinesJsonPath, 'utf8');
        const vaccines = JSON.parse(vaccinesJsonData);
        console.log(`✅ Found ${vaccines.length} vaccines in JSON file\n`);
        
        // Step 3: Create backup
        console.log('🛡️ Creating backup of vaccines.json...');
        const backupPath = path.join(__dirname, 'backend', 'data', `vaccines-backup-${Date.now()}.json`);
        await fs.writeFile(backupPath, vaccinesJsonData);
        console.log(`✅ Backup created: ${backupPath}\n`);
        
        // Step 4: Process each vaccine
        console.log('🔄 Migrating vaccines to batch system...\n');
        
        let migratedCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (const vaccine of vaccines) {
            try {
                console.log(`📦 Processing: ${vaccine.name} (ID: ${vaccine.id})`);
                
                // Skip if no stock
                if (!vaccine.dosesInStock || vaccine.dosesInStock === 0) {
                    console.log(`   ⚠️  Skipping - no stock (${vaccine.dosesInStock || 0} doses)`);
                    continue;
                }
                
                // Create batch record
                const batchData = {
                    vaccineId: vaccine.id,
                    vaccineName: vaccine.name,
                    batchNumber: vaccine.batchNumber || `BATCH-${vaccine.id}-${Date.now()}`,
                    lotNumber: vaccine.lotNumber || null,
                    dosesReceived: vaccine.dosesInStock,
                    dosesRemaining: vaccine.dosesInStock,
                    unitCost: vaccine.unitCost || 0,
                    expiryDate: new Date(vaccine.expiryDate),
                    receivedDate: new Date(), // Current date as received date
                    supplierName: vaccine.manufacturer || 'Unknown',
                    storageTemperature: vaccine.storageTemp || '2-8°C',
                    vvmStage: 1, // Default VVM stage
                    isTemperatureMonitored: true,
                    notes: `Migrated from JSON: ${vaccine.notes || ''}`,
                    status: 'Available'
                };
                
                const batch = await VaccineBatch.create(batchData);
                console.log(`   ✅ Created batch ${batch.batchNumber} with ${batch.dosesRemaining} doses`);
                
                migratedCount++;
                
            } catch (error) {
                console.log(`   ❌ Error processing ${vaccine.name}: ${error.message}`);
                errors.push({ vaccine: vaccine.name, error: error.message });
                errorCount++;
            }
        }
        
        console.log('\n📊 MIGRATION RESULTS');
        console.log('====================');
        console.log(`✅ Successfully migrated: ${migratedCount} vaccines`);
        console.log(`❌ Errors: ${errorCount}`);
        
        if (errors.length > 0) {
            console.log('\n❌ Error Details:');
            errors.forEach(err => {
                console.log(`   - ${err.vaccine}: ${err.error}`);
            });
        }
        
        // Step 5: Verify migration
        console.log('\n🔍 Verifying migration...');
        const totalBatches = await VaccineBatch.count();
        console.log(`📦 Total vaccine batches created: ${totalBatches}`);
        
        // Show sample batches
        const sampleBatches = await VaccineBatch.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']]
        });
        
        console.log('\n📋 Sample migrated batches:');
        sampleBatches.forEach(batch => {
            console.log(`   - ${batch.vaccineName}: Batch ${batch.batchNumber}, ${batch.dosesRemaining} doses, expires ${new Date(batch.expiryDate).toLocaleDateString()}`);
        });
        
        console.log('\n🎉 VACCINE BATCH MIGRATION COMPLETE!');
        console.log('===================================');
        console.log('✅ JSON vaccine data preserved');
        console.log('✅ Database batch tracking enabled');
        console.log('✅ Ready for frontend integration');
        console.log('✅ FIFO dispensing ready');
        
        console.log('\n🔄 NEXT STEPS:');
        console.log('1. Update VaccineInventory frontend component');
        console.log('2. Test vaccine batch display');
        console.log('3. Test vaccine add-stock functionality');
        console.log('4. Implement enhanced expiry displays');
        
        return {
            totalVaccines: vaccines.length,
            migratedCount,
            errorCount,
            errors,
            batchesCreated: totalBatches
        };
        
    } catch (error) {
        console.error('\n🚨 MIGRATION FAILED!');
        console.error('===================');
        console.error(`Error: ${error.message}`);
        
        console.log('\n🛑 ROLLBACK INSTRUCTIONS:');
        console.log('1. Check vaccines.json backup');
        console.log('2. Drop vaccine_batches table if needed');
        console.log('3. Restore original vaccines.json');
        
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run migration
migrateVaccineJsonToBatches()
    .then(result => {
        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    });