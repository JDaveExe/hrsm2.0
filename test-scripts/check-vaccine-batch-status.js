const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// Import database models
require('dotenv').config();
const { sequelize } = require('./backend/models');
const { VaccineBatch } = require('./backend/models');

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
    
    console.log('\n=== VACCINES WITH STOCK BUT NO BATCH RECORDS ===');
    
    let orphanedStocks = [];
    
    for (const vaccine of vaccinesWithStock) {
      // Check if this vaccine has batch records
      const batches = await VaccineBatch.findAll({
        where: { vaccineId: vaccine.id }
      });
      
      if (batches.length === 0) {
        orphanedStocks.push(vaccine);
        console.log(`❌ ID: ${vaccine.id} | ${vaccine.name} | Stock: ${vaccine.dosesInStock} | Batch: ${vaccine.batchNumber || 'N/A'} | Expiry: ${vaccine.expiryDate || 'N/A'}`);
      } else {
        console.log(`✅ ID: ${vaccine.id} | ${vaccine.name} | Stock: ${vaccine.dosesInStock} | Batches: ${batches.length}`);
      }
    }
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`- Vaccines with stock: ${vaccinesWithStock.length}`);
    console.log(`- Orphaned stocks (no batch records): ${orphanedStocks.length}`);
    console.log(`- Vaccines with proper batches: ${vaccinesWithStock.length - orphanedStocks.length}`);
    
    if (orphanedStocks.length > 0) {
      console.log('\n🔧 RECOMMENDED ACTION:');
      console.log('Create batch records for orphaned stocks to maintain data consistency.');
      
      console.log('\n📋 ORPHANED VACCINES DETAILS:');
      orphanedStocks.forEach(vaccine => {
        console.log(`\nVaccine ID: ${vaccine.id}`);
        console.log(`Name: ${vaccine.name}`);
        console.log(`Current Stock: ${vaccine.dosesInStock}`);
        console.log(`Batch Number: ${vaccine.batchNumber || 'Missing'}`);
        console.log(`Expiry Date: ${vaccine.expiryDate || 'Missing'}`);
        console.log(`Manufacturer: ${vaccine.manufacturer}`);
      });
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error checking vaccine batch status:', error);
    await sequelize.close();
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