require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Create database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'healthcare_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    }
  }
);

// Import VaccineBatch model
const VaccineBatch = require('./backend/models/VaccineBatch')(sequelize);

async function checkVaccineBatchStatus() {
  try {
    console.log('=== VACCINE BATCH STATUS ANALYSIS ===\n');

    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Read vaccines.json
    const vaccinesPath = path.join(__dirname, 'backend', 'data', 'vaccines.json');
    const vaccinesData = JSON.parse(fs.readFileSync(vaccinesPath, 'utf8'));
    
    console.log(`📊 Total vaccines in JSON: ${vaccinesData.length}`);
    
    // Find vaccines with stock
    const vaccinesWithStock = vaccinesData.filter(v => v.dosesInStock > 0);
    console.log(`📦 Vaccines with stock: ${vaccinesWithStock.length}`);
    
    // Check database batch records
    const allBatches = await VaccineBatch.findAll();
    console.log(`🗄️ Total batch records in database: ${allBatches.length}`);
    
    console.log('\n=== VACCINE STOCK VS BATCH ANALYSIS ===');
    
    let orphanedStocks = [];
    let properBatches = [];
    
    for (const vaccine of vaccinesWithStock) {
      // Check if this vaccine has batch records
      const batches = await VaccineBatch.findAll({
        where: { vaccineId: vaccine.id }
      });
      
      if (batches.length === 0) {
        orphanedStocks.push(vaccine);
        console.log(`❌ ID: ${vaccine.id} | ${vaccine.name} | Stock: ${vaccine.dosesInStock} | Batch: ${vaccine.batchNumber || 'N/A'} | Expiry: ${vaccine.expiryDate || 'N/A'}`);
      } else {
        properBatches.push({ vaccine, batches });
        const totalBatchStock = batches.reduce((sum, batch) => sum + batch.dosesRemaining, 0);
        console.log(`✅ ID: ${vaccine.id} | ${vaccine.name} | JSON Stock: ${vaccine.dosesInStock} | DB Batches: ${batches.length} | DB Stock: ${totalBatchStock}`);
        
        // Check for stock mismatch
        if (vaccine.dosesInStock !== totalBatchStock) {
          console.log(`   ⚠️  STOCK MISMATCH: JSON shows ${vaccine.dosesInStock}, DB batches total ${totalBatchStock}`);
        }
      }
    }
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`- Total vaccines with stock: ${vaccinesWithStock.length}`);
    console.log(`- Orphaned stocks (no batch records): ${orphanedStocks.length}`);
    console.log(`- Vaccines with proper batches: ${properBatches.length}`);
    
    if (orphanedStocks.length > 0) {
      console.log('\n🔧 ORPHANED VACCINES NEEDING BATCH CREATION:');
      console.log('These vaccines have stock but no batch records in the database:\n');
      
      orphanedStocks.forEach((vaccine, index) => {
        console.log(`${index + 1}. Vaccine ID: ${vaccine.id}`);
        console.log(`   Name: ${vaccine.name}`);
        console.log(`   Current Stock: ${vaccine.dosesInStock} doses`);
        console.log(`   Batch Number: ${vaccine.batchNumber || 'Missing'}`);
        console.log(`   Expiry Date: ${vaccine.expiryDate || 'Missing'}`);
        console.log(`   Manufacturer: ${vaccine.manufacturer || 'Unknown'}`);
        console.log('');
      });
      
      console.log('🚨 CRITICAL ISSUE: These vaccines will show "No batch information available"');
      console.log('   in the UI because the VaccineInventory component looks for batch records.');
      console.log('\n💡 SOLUTION: Create batch records for these vaccines to maintain system consistency.');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error checking vaccine batch status:', error);
    if (sequelize) {
      await sequelize.close();
    }
  }
}

// Run the analysis
checkVaccineBatchStatus()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });