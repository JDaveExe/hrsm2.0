require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Create database connection using the same config as the backend
const sequelize = new Sequelize(
  process.env.DB_NAME || 'hrsm2',
  process.env.DB_USER || 'root', 
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      charset: 'utf8mb4',
    },
    define: {
      charset: 'utf8mb4',
    }
  }
);

// Import VaccineBatch model
const VaccineBatch = require('./backend/models/VaccineBatch')(sequelize);

async function migrateVaccineBatches() {
  try {
    console.log('=== VACCINE BATCH MIGRATION ===\n');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully\n');
    
    // Sync the VaccineBatch table (create if it doesn't exist)
    await VaccineBatch.sync();
    console.log('✅ VaccineBatch table ready\n');
    
    // Read the prepared batch data
    const batchDataPath = path.join(__dirname, 'vaccine-batch-creation-data.json');
    
    if (!fs.existsSync(batchDataPath)) {
      console.error('❌ vaccine-batch-creation-data.json not found');
      console.log('Run create-vaccine-batch-data.js first to generate the data');
      return;
    }
    
    const batchData = JSON.parse(fs.readFileSync(batchDataPath, 'utf8'));
    console.log(`📋 Found ${batchData.totalBatches} batches to migrate`);
    console.log(`📦 Total doses: ${batchData.totalDoses}\n`);
    
    // Check for existing batches to avoid duplicates
    const existingBatches = await VaccineBatch.findAll({
      attributes: ['vaccineId', 'batchNumber']
    });
    
    console.log(`🔍 Found ${existingBatches.length} existing batch records`);
    
    const existingBatchKeys = new Set(
      existingBatches.map(b => `${b.vaccineId}-${b.batchNumber}`)
    );
    
    // Filter out batches that already exist
    const newBatches = batchData.batches.filter(batch => {
      const key = `${batch.vaccineId}-${batch.batchNumber}`;
      return !existingBatchKeys.has(key);
    });
    
    console.log(`✅ ${newBatches.length} new batches to create`);
    console.log(`⏭️  ${batchData.totalBatches - newBatches.length} batches already exist\n`);
    
    if (newBatches.length === 0) {
      console.log('🎉 All vaccine batches already exist!');
      console.log('✅ No migration needed - all vaccines have batch records');
      await sequelize.close();
      return;
    }
    
    // Create batch records
    console.log('🔄 Creating batch records...');
    
    const createdBatches = await VaccineBatch.bulkCreate(newBatches, {
      validate: true,
      returning: true
    });
    
    console.log(`✅ Successfully created ${createdBatches.length} batch records\n`);
    
    // Show summary of created batches
    console.log('📋 CREATED BATCHES SUMMARY:');
    createdBatches.forEach((batch, index) => {
      console.log(`${index + 1}. ${batch.vaccineName} (ID: ${batch.vaccineId})`);
      console.log(`   Batch: ${batch.batchNumber} | Stock: ${batch.dosesReceived} | Expires: ${batch.expiryDate}`);
      console.log(`   Status: ${batch.status} | Notes: ${batch.notes.substring(0, 50)}...`);
      console.log('');
    });
    
    // Create migration report
    const report = {
      timestamp: new Date().toISOString(),
      migration: 'vaccine-batch-creation',
      status: 'completed',
      summary: {
        totalProcessed: batchData.totalBatches,
        created: createdBatches.length,
        skipped: batchData.totalBatches - newBatches.length,
        totalDoses: newBatches.reduce((sum, batch) => sum + batch.dosesReceived, 0)
      },
      createdBatches: createdBatches.map(batch => ({
        id: batch.id,
        vaccineId: batch.vaccineId,
        vaccineName: batch.vaccineName,
        batchNumber: batch.batchNumber,
        dosesReceived: batch.dosesReceived,
        expiryDate: batch.expiryDate,
        status: batch.status
      }))
    };
    
    // Save migration report
    fs.writeFileSync(
      path.join(__dirname, 'vaccine-batch-migration-report.json'),
      JSON.stringify(report, null, 2)
    );
    
    console.log('📄 Migration report saved to vaccine-batch-migration-report.json');
    
    await sequelize.close();
    
    console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('✅ All vaccines now have batch records in the database');
    console.log('✅ The "No batch information available" issue should be resolved');
    console.log('✅ VaccineInventory component will now show proper batch details');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    
    if (error.name === 'SequelizeConnectionError') {
      console.log('\n💡 DATABASE CONNECTION ISSUE:');
      console.log('1. Make sure MySQL is running');
      console.log('2. Check database credentials in .env file');
      console.log('3. Ensure database "hrsm2" exists');
      console.log('4. Verify user has proper permissions');
    } else if (error.name === 'SequelizeValidationError') {
      console.log('\n💡 DATA VALIDATION ISSUE:');
      console.log('Some batch data failed validation. Check the vaccine data structure.');
    }
    
    if (sequelize) {
      await sequelize.close();
    }
    
    process.exit(1);
  }
}

// Run migration
migrateVaccineBatches()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });