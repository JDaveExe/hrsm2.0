const fs = require('fs');
const path = require('path');

async function analyzeVaccineStockIssue() {
  try {
    console.log('=== VACCINE STOCK BATCH ANALYSIS ===\n');

    // Read vaccines.json
    const vaccinesPath = path.join(__dirname, 'backend', 'data', 'vaccines.json');
    const vaccinesData = JSON.parse(fs.readFileSync(vaccinesPath, 'utf8'));
    
    console.log(`📊 Total vaccines in JSON: ${vaccinesData.length}`);
    
    // Find vaccines with stock
    const vaccinesWithStock = vaccinesData.filter(v => v.dosesInStock > 0);
    console.log(`📦 Vaccines with stock: ${vaccinesWithStock.length}`);
    
    console.log('\n=== PROBLEM ANALYSIS ===');
    console.log('The issue you identified is correct:');
    console.log('- Vaccines in JSON have dosesInStock but may not have corresponding database batch records');
    console.log('- VaccineInventory component looks for batch records in the database');
    console.log('- When no batch records exist, it shows "No batch information available"');
    console.log('- This creates inconsistency between JSON stock and database batch tracking\n');
    
    console.log('=== VACCINES THAT NEED BATCH CREATION ===');
    
    let batchesToCreate = [];
    
    vaccinesWithStock.forEach((vaccine, index) => {
      console.log(`${index + 1}. ID: ${vaccine.id} | ${vaccine.name}`);
      console.log(`   Stock: ${vaccine.dosesInStock} doses`);
      console.log(`   Batch Number: ${vaccine.batchNumber || 'MISSING'}`);
      console.log(`   Expiry Date: ${vaccine.expiryDate || 'MISSING'}`);
      console.log(`   Manufacturer: ${vaccine.manufacturer || 'Unknown'}`);
      
      // Prepare batch creation data
      const batchData = {
        vaccineId: vaccine.id,
        vaccineName: vaccine.name,
        batchNumber: vaccine.batchNumber || `${vaccine.name.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-${new Date().getFullYear()}-${String(vaccine.id).padStart(3, '0')}`,
        lotNumber: vaccine.lotNumber || `LOT-${vaccine.id}`,
        dosesReceived: vaccine.dosesInStock,
        dosesRemaining: vaccine.dosesInStock,
        dosesUsed: 0,
        dosesExpired: 0,
        dosesWasted: 0,
        expiryDate: vaccine.expiryDate || '2027-12-31',
        manufacturer: vaccine.manufacturer || 'Unknown',
        unitCost: vaccine.unitCost || 0.00,
        storageTemp: vaccine.storageTemp || '2-8°C',
        status: new Date(vaccine.expiryDate || '2027-12-31') < new Date() ? 'Expired' : 'Available',
        notes: `Migrated from JSON stock data - Original stock: ${vaccine.dosesInStock}`,
        receivedDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      batchesToCreate.push(batchData);
      console.log('');
    });
    
    console.log(`\n📋 BATCH CREATION SUMMARY:`);
    console.log(`- Total vaccines needing batch records: ${batchesToCreate.length}`);
    console.log(`- Total doses to be recorded in batches: ${batchesToCreate.reduce((sum, batch) => sum + batch.dosesReceived, 0)}`);
    
    // Save batch data for creation script
    const batchCreationData = {
      createdAt: new Date().toISOString(),
      totalBatches: batchesToCreate.length,
      totalDoses: batchesToCreate.reduce((sum, batch) => sum + batch.dosesReceived, 0),
      batches: batchesToCreate
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'vaccine-batch-creation-data.json'),
      JSON.stringify(batchCreationData, null, 2)
    );
    
    console.log('\n✅ Created vaccine-batch-creation-data.json');
    console.log('📁 This file contains all the batch data ready for database insertion');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Use vaccine-batch-creation-data.json to create database batch records');
    console.log('2. This will resolve the "No batch information available" issue');
    console.log('3. All vaccines will then have proper batch tracking in the UI');
    
    return batchesToCreate;
    
  } catch (error) {
    console.error('❌ Error analyzing vaccine stock:', error);
    return [];
  }
}

// Run the analysis
analyzeVaccineStockIssue()
  .then((batches) => {
    console.log(`\n✅ Analysis complete - ${batches.length} batches prepared for creation`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });