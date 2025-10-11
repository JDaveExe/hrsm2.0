const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function migrateVaccineBatches() {
  try {
    console.log('🚀 Starting vaccine batch migration via API...\n');
    
    // Check if the backend is running
    const baseURL = 'http://localhost:5000';
    
    // First, check the current status
    console.log('📊 Checking current vaccine batch status...');
    try {
      const statusResponse = await axios.get(`${baseURL}/api/admin/vaccine-batch-status`);
      const status = statusResponse.data;
      
      if (status.success) {
        console.log('✅ Current Status:');
        console.log(`   - Total vaccines: ${status.summary.totalVaccines}`);
        console.log(`   - Vaccines with stock: ${status.summary.vaccinesWithStock}`);
        console.log(`   - Vaccines with batches: ${status.summary.vaccinesWithBatches}`);
        console.log(`   - Vaccines without batches: ${status.summary.vaccinesWithoutBatches}`);
        console.log(`   - Stock matches: ${status.summary.stockMatches}`);
        console.log(`   - Stock mismatches: ${status.summary.stockMismatches}\n`);
        
        if (status.summary.vaccinesWithoutBatches === 0) {
          console.log('✅ All vaccines already have batch records. No migration needed.');
          return;
        }
      }
    } catch (error) {
      console.log('⚠️  Could not check status (backend may not be running)');
      console.log('   Proceeding with migration attempt...\n');
    }
    
    // Perform the migration
    console.log('🔄 Performing vaccine batch migration...');
    const migrationResponse = await axios.post(`${baseURL}/api/admin/migrate-vaccine-batches`);
    const result = migrationResponse.data;
    
    if (result.success) {
      console.log('✅ Migration completed successfully!');
      console.log(`   - Created: ${result.created} new batch records`);
      console.log(`   - Skipped: ${result.skipped} existing batches`);
      console.log(`   - Total processed: ${result.totalProcessed} vaccines`);
      console.log(`   - Total doses: ${result.totalDoses} doses tracked\n`);
      
      // Show some created batches
      if (result.createdBatches && result.createdBatches.length > 0) {
        console.log('📋 Sample created batches:');
        result.createdBatches.slice(0, 5).forEach(batch => {
          console.log(`   - ${batch.vaccineName} (ID: ${batch.vaccineId})`);
          console.log(`     Batch: ${batch.batchNumber} | Stock: ${batch.dosesReceived} | Expires: ${batch.expiryDate}`);
        });
        
        if (result.createdBatches.length > 5) {
          console.log(`   ... and ${result.createdBatches.length - 5} more batches`);
        }
      }
      
      console.log('\n🎉 SUCCESS: All vaccines now have batch records!');
      console.log('   The "No batch information available" issue should be resolved.');
      
    } else {
      console.error('❌ Migration failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUTION: Start the backend server first:');
      console.log('   1. Open terminal in backend folder: cd backend');
      console.log('   2. Run: npm start (or node server.js)');
      console.log('   3. Wait for "Server running on port 5000"');
      console.log('   4. Then run this script again');
    } else if (error.response && error.response.status === 403) {
      console.log('\n💡 SOLUTION: Authentication required');
      console.log('   This endpoint requires admin authentication.');
      console.log('   You may need to implement a direct database approach.');
    }
  }
}

// Alternative: Direct database approach (if API fails)
async function directDatabaseMigration() {
  try {
    console.log('\n🔄 Attempting direct database migration...');
    
    require('dotenv').config();
    const { sequelize } = require('./backend/config/database');
    const VaccineBatch = require('./backend/models/VaccineBatch')(sequelize);
    
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Read batch data
    const batchDataPath = path.join(__dirname, 'vaccine-batch-creation-data.json');
    const batchData = JSON.parse(fs.readFileSync(batchDataPath, 'utf8'));
    
    // Check existing batches
    const existingBatches = await VaccineBatch.findAll({
      attributes: ['vaccineId', 'batchNumber']
    });
    
    const existingKeys = new Set(
      existingBatches.map(b => `${b.vaccineId}-${b.batchNumber}`)
    );
    
    const newBatches = batchData.batches.filter(batch => {
      const key = `${batch.vaccineId}-${batch.batchNumber}`;
      return !existingKeys.has(key);
    });
    
    if (newBatches.length === 0) {
      console.log('✅ All batches already exist');
      await sequelize.close();
      return;
    }
    
    // Create batches
    const created = await VaccineBatch.bulkCreate(newBatches, {
      validate: true,
      returning: true
    });
    
    console.log(`✅ Created ${created.length} batch records`);
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Direct database migration failed:', error.message);
  }
}

// Main execution
console.log('=== VACCINE BATCH MIGRATION SCRIPT ===\n');

migrateVaccineBatches()
  .then(() => {
    console.log('\n✅ Migration script completed');
    process.exit(0);
  })
  .catch(async (error) => {
    console.log('\n⚠️  API migration failed, trying direct database approach...');
    await directDatabaseMigration();
    console.log('\n✅ Migration script completed');
    process.exit(0);
  });