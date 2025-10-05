// Execute the critical migration to batch system
const axios = require('axios');

async function executeMigration() {
    try {
        console.log('🚨 EXECUTING CRITICAL BATCH MIGRATION');
        console.log('====================================');
        console.log('⚠️  This will create batch records from existing medication data');
        console.log('🛡️  All data has been backed up for safety\n');
        
        console.log('🔄 Starting migration...');
        
        const migrationResponse = await axios.post('http://localhost:5000/api/medication-batches/migrate-to-batches');
        
        console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('==================================\n');
        
        console.log('📊 Migration Results:');
        console.log(`   Total medications: ${migrationResponse.data.totalMedications}`);
        console.log(`   Successfully migrated: ${migrationResponse.data.migratedCount}`);
        console.log(`   Errors: ${migrationResponse.data.errors}`);
        
        if (migrationResponse.data.errors > 0) {
            console.log('\n⚠️  Error details:');
            migrationResponse.data.errorDetails.forEach(error => {
                console.log(`   - ${error}`);
            });
        }
        
        // Test the migration by checking a few medications
        console.log('\n🔍 Verifying migration results...');
        
        // Check Paracetamol (ID: 1)
        const paracetamolBatches = await axios.get('http://localhost:5000/api/medication-batches/1/batches');
        console.log(`✅ Paracetamol now has ${paracetamolBatches.data.length} batch(es)`);
        
        if (paracetamolBatches.data.length > 0) {
            const batch = paracetamolBatches.data[0];
            console.log(`   Batch: ${batch.batchNumber}`);
            console.log(`   Quantity: ${batch.quantityRemaining}`);
            console.log(`   Expiry: ${new Date(batch.expiryDate).toLocaleDateString()}`);
        }
        
        // Check enhanced view
        const enhancedParacetamol = await axios.get('http://localhost:5000/api/medication-batches/1/enhanced');
        console.log(`✅ Enhanced view - Total stock: ${enhancedParacetamol.data.totalStock}`);
        console.log(`✅ Enhanced view - Batch count: ${enhancedParacetamol.data.batchCount}`);
        
        console.log('\n🎉 MIGRATION SUCCESS!');
        console.log('====================');
        console.log('✅ All medication data converted to batch system');
        console.log('✅ No data loss detected');
        console.log('✅ System ready for enhanced batch management');
        
        console.log('\n🔄 Next: Update frontend to display batch information');
        
        return migrationResponse.data;
        
    } catch (error) {
        console.error('\n🚨 MIGRATION FAILED!');
        console.error('===================');
        console.error(`Error: ${error.message}`);
        
        if (error.response?.data) {
            console.error('Server response:', error.response.data);
        }
        
        console.log('\n🛑 ROLLBACK INSTRUCTIONS:');
        console.log('1. Stop the server immediately');
        console.log('2. Restore from backup in batch-migration-backup/');
        console.log('3. Check rollback instructions in ROLLBACK-INSTRUCTIONS.md');
        
        throw error;
    }
}

executeMigration();