const fs = require('fs');
const path = require('path');

function createValidVaccineBatchData() {
  try {
    console.log('=== CREATING VALID VACCINE BATCH DATA ===\n');

    // Read vaccines.json
    const vaccinesPath = path.join(__dirname, 'backend', 'data', 'vaccines.json');
    const vaccinesData = JSON.parse(fs.readFileSync(vaccinesPath, 'utf8'));
    
    console.log(`📊 Total vaccines in JSON: ${vaccinesData.length}`);
    
    // Find vaccines with stock
    const vaccinesWithStock = vaccinesData.filter(v => v.dosesInStock > 0);
    console.log(`📦 Vaccines with stock: ${vaccinesWithStock.length}\n`);
    
    console.log('🛠️  Creating batch data with VALID columns only...');
    
    const validBatches = vaccinesWithStock.map(vaccine => {
      return {
        // Required fields that exist in the table
        vaccineId: vaccine.id,
        vaccineName: vaccine.name,
        batchNumber: vaccine.batchNumber || `${vaccine.name.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-${new Date().getFullYear()}-${String(vaccine.id).padStart(3, '0')}`,
        dosesReceived: vaccine.dosesInStock,
        dosesRemaining: vaccine.dosesInStock,
        unitCost: vaccine.unitCost || 0.00,
        expiryDate: vaccine.expiryDate || '2027-12-31',
        receivedDate: new Date().toISOString().split('T')[0],
        
        // Optional fields that exist in the table
        lotNumber: vaccine.lotNumber || `LOT-${vaccine.id}`,
        manufacturer: vaccine.manufacturer || 'Unknown',
        supplier: null,
        purchaseOrderNumber: null,
        storageLocation: null,
        storageTemperature: vaccine.storageTemp || null,
        vvmStage: null,
        status: new Date(vaccine.expiryDate || '2027-12-31') < new Date() ? 'expired' : 'active',
        notes: `Migrated from JSON stock data - Original stock: ${vaccine.dosesInStock}`,
        createdBy: null,
        lastUpdatedBy: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
    
    const batchCreationData = {
      createdAt: new Date().toISOString(),
      migration: 'vaccine-batch-valid-columns',
      totalBatches: validBatches.length,
      totalDoses: validBatches.reduce((sum, batch) => sum + batch.dosesReceived, 0),
      tableStructure: 'Matches actual vaccine_batches table columns',
      batches: validBatches
    };
    
    // Save valid batch data
    fs.writeFileSync(
      path.join(__dirname, 'vaccine-batch-valid-data.json'),
      JSON.stringify(batchCreationData, null, 2)
    );
    
    console.log('✅ Created vaccine-batch-valid-data.json');
    console.log(`📋 ${validBatches.length} batches prepared`);
    console.log(`📦 ${batchCreationData.totalDoses} total doses`);
    
    console.log('\n📋 SAMPLE VALID BATCH DATA:');
    validBatches.slice(0, 3).forEach((batch, index) => {
      console.log(`${index + 1}. ${batch.vaccineName} (ID: ${batch.vaccineId})`);
      console.log(`   Batch: ${batch.batchNumber}`);
      console.log(`   Stock: ${batch.dosesReceived} doses`);
      console.log(`   Status: ${batch.status}`);
      console.log(`   Expiry: ${batch.expiryDate}`);
      console.log('');
    });
    
    return validBatches;
    
  } catch (error) {
    console.error('❌ Error creating valid batch data:', error);
    return [];
  }
}

createValidVaccineBatchData();