const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

const useOfficialMedications = async () => {
  try {
    console.log('🔄 Switching to official medications data...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Load the Medication model
    const MedicationModel = require('../models/Prescription.sequelize');
    const Medication = MedicationModel(sequelize);

    // Clear existing test data
    console.log('🗑️  Clearing test medications...');
    await Medication.destroy({ where: {}, truncate: true });
    console.log('✅ Test data cleared');

    // Load official medications data
    const medicationsPath = path.join(__dirname, '../data/medications.json');
    const medicationsData = JSON.parse(fs.readFileSync(medicationsPath, 'utf8'));
    
    console.log(`📋 Found ${medicationsData.length} official medications to import`);

    // Transform the data to match our database schema
    const transformedMedications = medicationsData.map(med => ({
      name: med.name,
      genericName: med.genericName,
      brandName: med.brandName,
      category: med.category,
      dosage: med.dosage,
      form: med.form,
      strength: med.strength,
      manufacturer: med.manufacturer,
      batchNumber: med.batchNumber,
      unitsInStock: med.unitsInStock,
      minimumStock: med.minimumStock,
      unitCost: med.unitCost,
      sellingPrice: med.sellingPrice,
      expiryDate: new Date(med.expiryDate),
      storageConditions: med.storageConditions,
      administrationRoute: med.administrationRoute,
      indication: med.indication,
      dosageInstructions: med.dosageInstructions,
      sideEffects: med.sideEffects,
      contraindications: med.contraindications,
      interactions: med.interactions,
      precautions: med.precautions,
      isPrescriptionRequired: med.isPrescriptionRequired,
      status: med.status,
      isActive: med.isActive,
      notes: med.notes
    }));

    // Import official medications in batches
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < transformedMedications.length; i += batchSize) {
      const batch = transformedMedications.slice(i, i + batchSize);
      await Medication.bulkCreate(batch, { 
        ignoreDuplicates: true,
        validate: true 
      });
      imported += batch.length;
      console.log(`✅ Imported ${imported}/${transformedMedications.length} medications`);
    }

    console.log(`🎉 Successfully imported ${imported} official medications!`);

    // Show sample of imported medications
    const sampleMeds = await Medication.findAll({
      attributes: ['name', 'unitsInStock', 'minimumStock', 'status'],
      limit: 10
    });

    console.log('\n📋 Sample of imported medications:');
    sampleMeds.forEach(med => {
      console.log(`   - ${med.name}: ${med.unitsInStock} units (min: ${med.minimumStock}) - ${med.status}`);
    });

    // Show inventory statistics
    const totalMeds = await Medication.count();
    const lowStock = await Medication.count({ 
      where: { status: 'Low Stock' } 
    });
    const outOfStock = await Medication.count({ 
      where: { status: 'Out of Stock' } 
    });

    console.log('\n📊 Inventory Statistics:');
    console.log(`   - Total medications: ${totalMeds}`);
    console.log(`   - Low stock items: ${lowStock}`);
    console.log(`   - Out of stock items: ${outOfStock}`);

    console.log('\n🚀 Official medications imported successfully!');
    console.log('The inventory deduction system is now ready with your official data.');

  } catch (error) {
    console.error('❌ Error importing official medications:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

useOfficialMedications();
