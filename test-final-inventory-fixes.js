require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Create database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'hrsm2',
  process.env.DB_USER || 'root', 
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

async function testBothInventorySystems() {
  try {
    console.log('=== COMPREHENSIVE INVENTORY SYSTEM TEST ===\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // 1. TEST MEDICATION BATCH SYSTEM
    console.log('🧪 TESTING MEDICATION BATCH SYSTEM:');
    
    // Check Ibuprofen specifically (the one shown in screenshot)
    const [ibuprofenMeds] = await sequelize.query(
      'SELECT * FROM medications WHERE name LIKE "%Ibuprofen%" LIMIT 3'
    );
    
    console.log(`Found ${ibuprofenMeds.length} Ibuprofen medications:`);
    
    for (const med of ibuprofenMeds) {
      const [batches] = await sequelize.query(
        'SELECT * FROM medication_batches WHERE medicationId = ?',
        { replacements: [med.id] }
      );
      
      console.log(`   ${med.name}: ${batches.length} batch(es)`);
      if (batches.length > 0) {
        batches.forEach(batch => {
          const isExpired = new Date(batch.expiryDate) < new Date();
          console.log(`     - Batch: ${batch.batchNumber} | Stock: ${batch.quantityRemaining} | Status: ${batch.status} | ${isExpired ? '🔴 EXPIRED' : '🟢 Active'}`);
        });
      } else {
        console.log('     ❌ NO BATCHES FOUND - Will show legacy warning');
      }
    }
    
    // Overall medication batch status
    const [medBatchSummary] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT m.id) as total_medications,
        COUNT(DISTINCT mb.medicationId) as medications_with_batches,
        (COUNT(DISTINCT m.id) - COUNT(DISTINCT mb.medicationId)) as medications_without_batches
      FROM medications m
      LEFT JOIN medication_batches mb ON m.id = mb.medicationId
      WHERE m.unitsInStock > 0
    `);
    
    const medSummary = medBatchSummary[0];
    console.log(`\n📊 MEDICATION SUMMARY:`);
    console.log(`   - Total medications with stock: ${medSummary.total_medications}`);
    console.log(`   - With batch records: ${medSummary.medications_with_batches}`);
    console.log(`   - WITHOUT batch records: ${medSummary.medications_without_batches}`);
    
    if (medSummary.medications_without_batches === 0) {
      console.log('   ✅ SUCCESS: No legacy data warnings should appear!');
    } else {
      console.log('   ❌ ISSUE: Some medications will still show legacy warnings');
    }
    
    // 2. TEST VACCINE BATCH SYSTEM
    console.log('\n🧪 TESTING VACCINE BATCH SYSTEM:');
    
    // Read vaccines.json
    const vaccinesPath = path.join(__dirname, 'backend', 'data', 'vaccines.json');
    const vaccinesData = JSON.parse(fs.readFileSync(vaccinesPath, 'utf8'));
    
    // Check OPV specifically (the one shown in screenshot)
    const opvVaccine = vaccinesData.find(v => v.name.includes('Oral Polio'));
    if (opvVaccine) {
      console.log(`OPV Vaccine (ID: ${opvVaccine.id}): ${opvVaccine.dosesInStock} doses in JSON`);
      
      const [opvBatches] = await sequelize.query(
        'SELECT * FROM vaccine_batches WHERE vaccineId = ?',
        { replacements: [opvVaccine.id] }
      );
      
      console.log(`   Database batches: ${opvBatches.length}`);
      opvBatches.forEach(batch => {
        const isExpired = new Date(batch.expiryDate) < new Date();
        console.log(`     - Batch: ${batch.batchNumber} | Stock: ${batch.dosesRemaining} | Status: ${batch.status} | ${isExpired ? '🔴 EXPIRED' : '🟢 Active'}`);
      });
      
      if (opvBatches.length === 0) {
        console.log('     ❌ NO BATCHES FOUND - Will show "No batch information available"');
      } else {
        console.log('     ✅ BATCHES FOUND - Should display batch details now');
      }
    }
    
    // Test the enhanced endpoint that the frontend uses
    console.log('\n🔗 TESTING ENHANCED ENDPOINT:');
    try {
      // Simulate the enhanced endpoint logic
      const vaccineId = 4; // OPV
      const [enhancedBatches] = await sequelize.query(
        'SELECT * FROM vaccine_batches WHERE vaccineId = ? ORDER BY expiryDate ASC',
        { replacements: [vaccineId] }
      );
      
      console.log(`   Enhanced endpoint would return ${enhancedBatches.length} batches for OPV`);
      if (enhancedBatches.length > 0) {
        const totalDoses = enhancedBatches.reduce((sum, batch) => sum + batch.dosesRemaining, 0);
        console.log(`   Total doses: ${totalDoses}`);
        console.log(`   ✅ Frontend should now show batch details!`);
      } else {
        console.log(`   ❌ Frontend will still show "No batch information available"`);
      }
    } catch (error) {
      console.error('   ❌ Enhanced endpoint test failed:', error.message);
    }
    
    // Overall vaccine batch status
    const vaccinesWithStock = vaccinesData.filter(v => v.dosesInStock > 0);
    const [vaccineBatchCounts] = await sequelize.query(
      'SELECT DISTINCT vaccineId FROM vaccine_batches'
    );
    
    console.log(`\n📊 VACCINE SUMMARY:`);
    console.log(`   - Total vaccines with stock: ${vaccinesWithStock.length}`);
    console.log(`   - Vaccines with batch records: ${vaccineBatchCounts.length}`);
    console.log(`   - Vaccines without batch records: ${vaccinesWithStock.length - vaccineBatchCounts.length}`);
    
    if (vaccinesWithStock.length === vaccineBatchCounts.length) {
      console.log('   ✅ SUCCESS: All vaccines have batch records!');
    } else {
      console.log('   ❌ ISSUE: Some vaccines missing batch records');
    }
    
    // 3. FINAL ASSESSMENT
    console.log('\n🎯 FINAL ASSESSMENT:');
    
    const medicationsFixed = medSummary.medications_without_batches === 0;
    const vaccinesFixed = vaccinesWithStock.length === vaccineBatchCounts.length;
    
    if (medicationsFixed && vaccinesFixed) {
      console.log('🎉 BOTH SYSTEMS FIXED!');
      console.log('✅ Prescription "Legacy data" warnings should be resolved');
      console.log('✅ Vaccine "No batch information available" should be resolved');
      console.log('\n💡 Next steps:');
      console.log('   1. Refresh the frontend application');
      console.log('   2. Test both inventory pages');
      console.log('   3. Verify batch details display correctly');
    } else {
      console.log('⚠️  PARTIAL SUCCESS:');
      if (!medicationsFixed) console.log('❌ Medication legacy warnings still present');
      if (!vaccinesFixed) console.log('❌ Vaccine batch display still broken');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (sequelize) {
      await sequelize.close();
    }
  }
}

testBothInventorySystems()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });