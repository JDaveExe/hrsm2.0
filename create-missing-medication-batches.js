require('dotenv').config();
const { Sequelize } = require('sequelize');

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

async function createMissingMedicationBatches() {
  try {
    console.log('=== CREATING MISSING MEDICATION BATCHES ===\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Get medications without batch records
    const [medicationsWithoutBatches] = await sequelize.query(`
      SELECT m.* 
      FROM medications m 
      LEFT JOIN medication_batches mb ON m.id = mb.medicationId 
      WHERE mb.medicationId IS NULL AND m.unitsInStock > 0
    `);
    
    console.log(`Found ${medicationsWithoutBatches.length} medications without batch records:`);
    
    if (medicationsWithoutBatches.length === 0) {
      console.log('✅ All medications already have batch records');
      await sequelize.close();
      return;
    }
    
    // Create batch records for each medication
    let created = 0;
    
    for (const medication of medicationsWithoutBatches) {
      try {
        console.log(`\n🔄 Creating batch for: ${medication.name}`);
        
        const batchData = {
          medicationId: medication.id,
          batchNumber: medication.batchNumber || `${medication.name.replace(/[^A-Z0-9]/gi, '').toUpperCase()}-${new Date().getFullYear()}-${String(medication.id).padStart(3, '0')}`,
          quantityReceived: medication.unitsInStock || 0,
          quantityRemaining: medication.unitsInStock || 0,
          unitCost: medication.costPerUnit || 0.00,
          expiryDate: medication.expiryDate || '2027-12-31',
          receivedDate: new Date().toISOString().split('T')[0],
          supplier: null,
          purchaseOrderNumber: null,
          storageLocation: null,
          status: new Date(medication.expiryDate || '2027-12-31') < new Date() ? 'expired' : 'active',
          notes: `Migrated from legacy medication data - Original stock: ${medication.unitsInStock}`,
          createdBy: null,
          lastUpdatedBy: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const [result] = await sequelize.query(`
          INSERT INTO medication_batches (
            medicationId, batchNumber, quantityReceived, quantityRemaining,
            unitCost, expiryDate, receivedDate, supplier,
            purchaseOrderNumber, storageLocation, status,
            notes, createdBy, lastUpdatedBy, createdAt, updatedAt
          ) VALUES (
            :medicationId, :batchNumber, :quantityReceived, :quantityRemaining,
            :unitCost, :expiryDate, :receivedDate, :supplier,
            :purchaseOrderNumber, :storageLocation, :status,
            :notes, :createdBy, :lastUpdatedBy, :createdAt, :updatedAt
          )
        `, {
          replacements: batchData,
          type: sequelize.QueryTypes.INSERT
        });
        
        created++;
        console.log(`   ✅ Created batch: ${batchData.batchNumber} | Stock: ${batchData.quantityRemaining} | Status: ${batchData.status}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to create batch for ${medication.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`✅ Created: ${created} medication batch records`);
    console.log(`❌ Failed: ${medicationsWithoutBatches.length - created} records`);
    
    // Verify results
    const [finalCheck] = await sequelize.query(`
      SELECT COUNT(*) as total_meds, 
             COUNT(mb.medicationId) as meds_with_batches,
             (COUNT(*) - COUNT(mb.medicationId)) as meds_without_batches
      FROM medications m 
      LEFT JOIN medication_batches mb ON m.id = mb.medicationId 
      WHERE m.unitsInStock > 0
    `);
    
    const summary = finalCheck[0];
    console.log(`\n🔍 VERIFICATION:`);
    console.log(`   - Total medications with stock: ${summary.total_meds}`);
    console.log(`   - Medications with batches: ${summary.meds_with_batches}`);
    console.log(`   - Medications without batches: ${summary.meds_without_batches}`);
    
    if (summary.meds_without_batches === 0) {
      console.log('\n🎉 SUCCESS: All medications now have batch records!');
      console.log('✅ "Legacy data" warnings should be resolved');
    } else {
      console.log('\n⚠️  Some medications still need batch records');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (sequelize) {
      await sequelize.close();
    }
    process.exit(1);
  }
}

createMissingMedicationBatches()
  .then(() => {
    console.log('\n✅ Medication batch creation completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });