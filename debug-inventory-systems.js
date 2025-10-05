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

async function debugBothInventorySystems() {
  try {
    console.log('=== DEBUGGING BOTH INVENTORY SYSTEMS ===\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // 1. Check Medication Batches
    console.log('🔍 CHECKING MEDICATION BATCHES:');
    const [medications] = await sequelize.query('SELECT * FROM medications WHERE name LIKE "%Ibuprofen%" LIMIT 5');
    console.log('Medications found:', medications.length);
    
    medications.forEach(med => {
      console.log(`   - ID: ${med.id} | Name: ${med.name} | Stock: ${med.unitsInStock || 'N/A'} | Batch: ${med.batchNumber || 'N/A'}`);
    });
    
    const [medBatches] = await sequelize.query('SELECT * FROM medication_batches WHERE medicationId IN (SELECT id FROM medications WHERE name LIKE "%Ibuprofen%") LIMIT 5');
    console.log(`Found ${medBatches.length} medication batch records`);
    
    medBatches.forEach(batch => {
      console.log(`   - Batch: ${batch.batchNumber} | Med ID: ${batch.medicationId} | Remaining: ${batch.unitsRemaining} | Expiry: ${batch.expiryDate}`);
    });
    
    // 2. Check Vaccine Batches  
    console.log('\n🔍 CHECKING VACCINE BATCHES:');
    
    // Read vaccines.json
    const vaccinesPath = path.join(__dirname, 'backend', 'data', 'vaccines.json');
    const vaccinesData = JSON.parse(fs.readFileSync(vaccinesPath, 'utf8'));
    
    const opvVaccine = vaccinesData.find(v => v.name.includes('Oral Polio'));
    if (opvVaccine) {
      console.log(`OPV Vaccine: ID: ${opvVaccine.id} | Stock: ${opvVaccine.dosesInStock} | Batch: ${opvVaccine.batchNumber}`);
    }
    
    const [vaccineBatches] = await sequelize.query('SELECT * FROM vaccine_batches WHERE vaccineId = ? OR vaccineName LIKE "%Oral Polio%"', {
      replacements: [4]
    });
    console.log(`Found ${vaccineBatches.length} vaccine batch records for OPV`);
    
    vaccineBatches.forEach(batch => {
      console.log(`   - Batch: ${batch.batchNumber} | Vaccine ID: ${batch.vaccineId} | Remaining: ${batch.dosesRemaining} | Expiry: ${batch.expiryDate}`);
    });
    
    // 3. Check all vaccine batches
    const [allVaccineBatches] = await sequelize.query('SELECT COUNT(*) as count, vaccineId, vaccineName FROM vaccine_batches GROUP BY vaccineId, vaccineName ORDER BY vaccineId');
    console.log(`\n📊 VACCINE BATCH SUMMARY: ${allVaccineBatches.length} vaccine types have batches`);
    
    allVaccineBatches.forEach(summary => {
      console.log(`   - Vaccine ID: ${summary.vaccineId} | ${summary.vaccineName} | Batches: ${summary.count}`);
    });
    
    // 4. Check for missing vaccine batches
    console.log('\n🔍 CHECKING FOR MISSING VACCINE BATCHES:');
    const vaccinesWithStock = vaccinesData.filter(v => v.dosesInStock > 0);
    console.log(`Vaccines with stock in JSON: ${vaccinesWithStock.length}`);
    
    for (const vaccine of vaccinesWithStock.slice(0, 5)) {
      const [batches] = await sequelize.query('SELECT COUNT(*) as count FROM vaccine_batches WHERE vaccineId = ?', {
        replacements: [vaccine.id]
      });
      const batchCount = batches[0].count;
      
      if (batchCount === 0) {
        console.log(`   ❌ MISSING: ${vaccine.name} (ID: ${vaccine.id}) has ${vaccine.dosesInStock} stock but NO batches`);
      } else {
        console.log(`   ✅ OK: ${vaccine.name} (ID: ${vaccine.id}) has ${batchCount} batch(es)`);
      }
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
    if (sequelize) {
      await sequelize.close();
    }
  }
}

debugBothInventorySystems()
  .then(() => {
    console.log('\n✅ Debug complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });