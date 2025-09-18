const { sequelize } = require('./backend/config/database');

async function testPrescriptionAnalytics() {
  try {
    console.log('🧪 Testing prescription analytics endpoint...');
    
    // Check if we have any completed checkups with prescriptions
    const [rawData] = await sequelize.query(`
      SELECT 
        prescription, 
        completedAt,
        assignedDoctor,
        patientId
      FROM check_in_sessions 
      WHERE prescription IS NOT NULL 
        AND prescription != '' 
        AND prescription != 'null'
        AND prescription != '[]'
        AND status = 'completed'
        AND completedAt IS NOT NULL
      ORDER BY completedAt DESC
      LIMIT 10
    `);
    
    console.log(`📋 Found ${rawData.length} completed checkups with prescriptions:`);
    
    if (rawData.length === 0) {
      console.log('❌ No prescription data found. Need to complete some checkups with prescriptions first.');
      await sequelize.close();
      return;
    }
    
    // Process prescription analytics
    const medicationUsage = {};
    let totalPrescriptions = 0;
    let totalMedicationsDispensed = 0;

    rawData.forEach((row, index) => {
      try {
        const prescriptions = JSON.parse(row.prescription);
        console.log(`  ${index + 1}. Patient ${row.patientId} - ${prescriptions.length} prescriptions`);
        
        if (Array.isArray(prescriptions) && prescriptions.length > 0) {
          totalPrescriptions++;
          
          prescriptions.forEach((presc, i) => {
            const medicationName = presc.medication || presc.medicine;
            const quantity = parseInt(presc.quantity) || 1;
            
            console.log(`     ${i + 1}. ${medicationName} - ${quantity} units`);
            
            if (medicationName) {
              totalMedicationsDispensed += quantity;
              
              if (!medicationUsage[medicationName]) {
                medicationUsage[medicationName] = {
                  name: medicationName,
                  totalQuantity: 0,
                  prescriptionCount: 0
                };
              }
              
              medicationUsage[medicationName].totalQuantity += quantity;
              medicationUsage[medicationName].prescriptionCount += 1;
            }
          });
        }
      } catch (e) {
        console.log(`  ${index + 1}. Parse error for patient ${row.patientId}:`, e.message);
      }
    });
    
    // Display analytics summary
    console.log('\n📊 Analytics Summary:');
    console.log(`Total prescriptions: ${totalPrescriptions}`);
    console.log(`Total medications dispensed: ${totalMedicationsDispensed}`);
    console.log(`Average medications per prescription: ${(totalMedicationsDispensed / totalPrescriptions).toFixed(2)}`);
    
    console.log('\nTop medications:');
    const topMedications = Object.values(medicationUsage)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);
    
    topMedications.forEach((med, index) => {
      console.log(`  ${index + 1}. ${med.name}: ${med.totalQuantity} units (${med.prescriptionCount} prescriptions)`);
    });
    
    console.log('\n✅ Analytics test completed successfully!');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await sequelize.close();
    process.exit(1);
  }
}

testPrescriptionAnalytics();
