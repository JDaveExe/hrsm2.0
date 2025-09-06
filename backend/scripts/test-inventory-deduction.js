const { sequelize } = require('../config/database');

const testInventoryDeduction = async () => {
  try {
    console.log('🧪 Starting inventory deduction test...');
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Load the Medication model
    const MedicationModel = require('../models/Prescription.sequelize');
    const Medication = MedicationModel(sequelize);

    // --- 1. Check available medications ---
    const medications = await Medication.findAll({
      attributes: ['id', 'name', 'unitsInStock', 'minimumStock'],
      limit: 5
    });
    
    if (medications.length === 0) {
      console.log('❌ No medications found in database. Please seed the medications table first.');
      return;
    }

    console.log('📋 Available medications:');
    medications.forEach(med => {
      console.log(`   - ${med.name}: ${med.unitsInStock} units (min: ${med.minimumStock})`);
    });

    // --- 2. Test with first available medication ---
    const testMedication = medications[0];
    const quantityToTest = Math.min(5, testMedication.unitsInStock); // Test with 5 units or available stock
    
    if (quantityToTest === 0) {
      console.log('❌ No stock available for testing. Please add stock to medications first.');
      return;
    }

    console.log(`\n🧪 Testing with medication: ${testMedication.name}`);
    console.log(`📊 Initial stock: ${testMedication.unitsInStock} units`);
    console.log(`📝 Will simulate prescription of: ${quantityToTest} units`);

    // --- 3. Simulate prescription (what happens when checkup is completed) ---
    const transaction = await sequelize.transaction();
    
    try {
      // Find the medication with transaction
      const medication = await Medication.findByPk(testMedication.id, { transaction });
      
      // Check stock availability
      if (medication.unitsInStock < quantityToTest) {
        throw new Error(`Insufficient stock. Available: ${medication.unitsInStock}, Required: ${quantityToTest}`);
      }
      
      // Deduct stock
      const newStock = medication.unitsInStock - quantityToTest;
      await medication.update({ 
        unitsInStock: newStock,
        status: newStock <= medication.minimumStock ? 'Low Stock' : 
                newStock === 0 ? 'Out of Stock' : 'Available'
      }, { transaction });
      
      await transaction.commit();
      
      // --- 4. Verify results ---
      await medication.reload();
      console.log(`✅ SUCCESS: Stock deducted successfully!`);
      console.log(`📊 Final stock: ${medication.unitsInStock} units`);
      console.log(`📊 Status: ${medication.status}`);
      
      // --- 5. Test rollback scenario ---
      console.log(`\n🧪 Testing rollback scenario (insufficient stock)...`);
      const excessiveQuantity = medication.unitsInStock + 10;
      
      const rollbackTransaction = await sequelize.transaction();
      
      try {
        const med = await Medication.findByPk(testMedication.id, { transaction: rollbackTransaction });
        
        if (med.unitsInStock < excessiveQuantity) {
          throw new Error(`Insufficient stock. Available: ${med.unitsInStock}, Required: ${excessiveQuantity}`);
        }
        
        await rollbackTransaction.commit();
        console.log('❌ ERROR: Should have thrown insufficient stock error');
        
      } catch (error) {
        await rollbackTransaction.rollback();
        console.log(`✅ SUCCESS: Rollback worked correctly - ${error.message}`);
      }
      
      // --- 6. Restore original stock for test repeatability ---
      await medication.update({ unitsInStock: testMedication.unitsInStock });
      console.log(`\n🔄 Test cleanup: Restored stock to ${testMedication.unitsInStock} units`);
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

testInventoryDeduction();
