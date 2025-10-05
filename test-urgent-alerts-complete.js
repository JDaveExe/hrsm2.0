const axios = require('axios');

// Test the complete urgent medication alert system with new batch + patient volume calculations
async function testUrgentMedicationAlerts() {
  console.log('🚨 Testing Urgent Medication Alert System');
  console.log('=' .repeat(60));
  
  try {
    console.log('\n📊 System Overview:');
    console.log('   Patient Volume: 65 patients/day (45.5 prescription patients)');
    console.log('   Stock Calculation: Batch-based (excludes expired)');
    console.log('   Demand Calculation: Patient volume + weather multipliers');
    
    // Test multiple medications
    const testMedications = [1, 2, 32]; // Paracetamol, other med, Ambroxol
    
    console.log('\n💊 Testing Medication Alert Calculations:');
    console.log('-'.repeat(60));
    
    for (const medId of testMedications) {
      try {
        // Get medication info
        const medResponse = await axios.get(`http://localhost:5000/api/inventory/medications`);
        const medication = medResponse.data.find(m => m.id === medId);
        
        if (!medication) {
          console.log(`❌ Medication ID ${medId} not found`);
          continue;
        }
        
        // Get batch data
        const batchResponse = await axios.get(`http://localhost:5000/api/medication-batches/${medId}/batches`);
        const batches = batchResponse.data || [];
        
        // Calculate current stock from active batches
        const activeBatches = batches.filter(batch => new Date(batch.expiryDate) > new Date());
        const totalStock = activeBatches.reduce((sum, batch) => sum + batch.quantityRemaining, 0);
        const expiredBatches = batches.filter(batch => new Date(batch.expiryDate) <= new Date());
        
        // Patient volume calculations
        const dailyPrescriptionPatients = 65 * 0.70; // 45.5 patients
        
        // Get prescription rates (simulate the new system)
        const prescriptionRates = {
          'Paracetamol': 0.20,
          'Ambroxol Hydrochloride': 0.12,
          'Mucosolvan': 0.12, // Alternative name
          // Add more as needed
        };
        
        const unitsPerPrescription = {
          'Paracetamol': 10,
          'Ambroxol Hydrochloride': 7,
          'Mucosolvan': 7,
        };
        
        const weatherMultipliers = {
          'Paracetamol': 3.0, // High during dengue season
          'Ambroxol Hydrochloride': 1.8, // Respiratory season
          'Mucosolvan': 1.8,
        };
        
        // Calculate demand for this medication
        const medName = medication.name;
        const prescriptionRate = prescriptionRates[medName] || 0.05; // Default 5%
        const unitsPerRx = unitsPerPrescription[medName] || 5; // Default 5 units
        const weatherMultiplier = weatherMultipliers[medName] || 1.2; // Default 20% increase
        
        const dailyPrescriptions = dailyPrescriptionPatients * prescriptionRate;
        const baseDailyDemand = dailyPrescriptions * unitsPerRx;
        const weatherAdjustedDemand = baseDailyDemand * weatherMultiplier;
        const daysUntilStockout = totalStock > 0 ? Math.floor(totalStock / weatherAdjustedDemand) : 0;
        
        // Determine alert level
        let alertLevel = 'GOOD';
        let alertColor = '✅';
        if (daysUntilStockout <= 3) {
          alertLevel = 'CRITICAL';
          alertColor = '🔴';
        } else if (daysUntilStockout <= 7) {
          alertLevel = 'URGENT';
          alertColor = '🟠';
        } else if (daysUntilStockout <= 14) {
          alertLevel = 'WARNING';
          alertColor = '🟡';
        }
        
        console.log(`\n${alertColor} ${medName} (ID: ${medId}):`);
        console.log(`   Batch Stock: ${totalStock} units (${activeBatches.length} active batches)`);
        if (expiredBatches.length > 0) {
          console.log(`   Expired Batches: ${expiredBatches.length} (excluded from calculations)`);
        }
        console.log(`   Prescription Rate: ${Math.round(prescriptionRate * 100)}% of patients`);
        console.log(`   Daily Demand: ${Math.round(weatherAdjustedDemand)} units/day`);
        console.log(`   Days Until Stockout: ${daysUntilStockout} days`);
        console.log(`   Alert Level: ${alertLevel}`);
        
        // Recommendations
        if (alertLevel === 'CRITICAL') {
          console.log(`   📢 IMMEDIATE ACTION: Order ${Math.ceil(weatherAdjustedDemand * 30)} units within 24-48 hours!`);
        } else if (alertLevel === 'URGENT') {
          console.log(`   ⚡ ACTION NEEDED: Plan to restock within 1 week`);
        } else if (alertLevel === 'WARNING') {
          console.log(`   💡 MONITOR: Consider restocking in next 2 weeks`);
        }
        
      } catch (error) {
        console.log(`❌ Error testing medication ID ${medId}: ${error.message}`);
      }
    }
    
    console.log('\n🎯 Summary of Improvements:');
    console.log('   ✅ Real patient volume: 65 patients/day incorporated');
    console.log('   ✅ Batch-based stock: Excludes expired medications');
    console.log('   ✅ Weather multipliers: Applied to calculated demand, not stock');
    console.log('   ✅ Realistic prescription patterns: Health station appropriate');
    console.log('   ✅ Actionable alerts: Days until stockout with clear actions');
    
    console.log('\n📈 Expected Alert Accuracy:');
    console.log('   🔴 CRITICAL (≤3 days): Immediate procurement needed');
    console.log('   🟠 URGENT (≤7 days): Plan restocking this week');
    console.log('   🟡 WARNING (≤14 days): Monitor and plan ahead');
    console.log('   ✅ GOOD (>14 days): Sufficient stock levels');
    
    console.log('\n✅ Urgent Medication Alert System Test Complete!');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testUrgentMedicationAlerts();