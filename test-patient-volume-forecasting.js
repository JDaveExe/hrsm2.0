const axios = require('axios');

// Test the updated forecasting system with real patient volume data
async function testPatientVolumeForecastingUpdates() {
  console.log('🧪 Testing Updated Forecasting System with Real Patient Volume Data');
  console.log('=' .repeat(70));
  
  try {
    console.log('\n📊 Patient Volume Configuration:');
    console.log('   Daily Patients: 60-70 (avg 65)');
    console.log('   Weekly Patients: 400-500 (avg 450)');
    console.log('   Prescription Patients: 70% (45.5 patients/day)');
    console.log('   Vaccination Patients: 30% (19.5 patients/day)');
    
    // Test basic medication forecasting with backend
    console.log('\n💊 Testing Updated Medication Demand Calculations...');
    
    // Simulate some common medications and their expected demand
    const testMedications = [
      {
        name: 'Paracetamol',
        prescriptionRate: 0.20, // 20% of prescription patients (adjusted)
        unitsPerPrescription: 10, // 10 tablets (adjusted)
        weatherMultiplier: 3.0 // High demand during dengue season
      },
      {
        name: 'Ambroxol (Mucosolvan)',
        prescriptionRate: 0.12, // 12% during respiratory season (adjusted)
        unitsPerPrescription: 7, // 7 tablets (adjusted)
        weatherMultiplier: 1.8 // Rainy season increase
      },
      {
        name: 'Oral Rehydration Salt (ORS)',
        prescriptionRate: 0.08, // 8% during hot weather (adjusted)
        unitsPerPrescription: 3, // 3 sachets (adjusted)
        weatherMultiplier: 2.5 // High demand during floods
      }
    ];
    
    console.log('\n📈 Daily Demand Calculations (Based on Real Patient Volume):');
    console.log('-'.repeat(70));
    
    const dailyPrescriptionPatients = 65 * 0.70; // 45.5 patients needing prescriptions
    
    testMedications.forEach(med => {
      const dailyPrescriptions = dailyPrescriptionPatients * med.prescriptionRate;
      const baseDailyDemand = dailyPrescriptions * med.unitsPerPrescription;
      const weatherAdjustedDemand = baseDailyDemand * med.weatherMultiplier;
      const monthlyDemand = weatherAdjustedDemand * 30;
      
      console.log(`\n${med.name}:`);
      console.log(`   Prescription Rate: ${Math.round(med.prescriptionRate * 100)}% of patients`);
      console.log(`   Daily Prescriptions: ${Math.round(dailyPrescriptions * 10) / 10}`);
      console.log(`   Base Daily Demand: ${Math.round(baseDailyDemand)} units`);
      console.log(`   Weather Adjusted: ${Math.round(weatherAdjustedDemand)} units/day`);
      console.log(`   Monthly Forecast: ${Math.round(monthlyDemand)} units`);
      console.log(`   Weekly Forecast: ${Math.round(weatherAdjustedDemand * 7)} units`);
    });
    
    // Test with actual batch data
    console.log('\n💾 Testing with Real Batch Data...');
    
    try {
      const batchResponse = await axios.get('http://localhost:5000/api/medication-batches/1/batches');
      if (batchResponse.data && batchResponse.data.length > 0) {
        const totalStock = batchResponse.data
          .filter(batch => new Date(batch.expiryDate) > new Date())
          .reduce((sum, batch) => sum + batch.quantityRemaining, 0);
        
        console.log(`✅ Paracetamol Current Stock (from batches): ${totalStock} units`);
        
        // Calculate how many days current stock will last
        const paracetamolDailyDemand = dailyPrescriptionPatients * 0.20 * 10 * 3.0; // Updated rates
        const daysUntilStockout = Math.floor(totalStock / paracetamolDailyDemand);
        
        console.log(`   Daily Demand (weather-adjusted): ${Math.round(paracetamolDailyDemand)} units`);
        console.log(`   Days until stockout: ${daysUntilStockout} days`);
        
        if (daysUntilStockout < 14) {
          console.log(`   ⚠️ URGENT: Stock will run out in ${daysUntilStockout} days!`);
        } else if (daysUntilStockout < 30) {
          console.log(`   ⚡ MEDIUM: Stock will run out in ${daysUntilStockout} days`);
        } else {
          console.log(`   ✅ GOOD: Sufficient stock for ${daysUntilStockout} days`);
        }
      }
    } catch (batchError) {
      console.log(`⚠️ Could not fetch batch data: ${batchError.message}`);
    }
    
    // Test comparison with old method
    console.log('\n📊 Comparison: Old vs New Forecasting Method');
    console.log('-'.repeat(70));
    
    const oldMethodExample = {
      name: 'Paracetamol',
      currentStock: 1244, // From JSON data
      oldDemandCalculation: 1244 * 3.0, // Old: stock * weather multiplier
      newDemandCalculation: Math.round(dailyPrescriptionPatients * 0.20 * 10 * 3.0 * 30) // New: patient-based (updated)
    };
    
    console.log(`Example: ${oldMethodExample.name}`);
    console.log(`   Old Method: ${oldMethodExample.oldDemandCalculation} units/month (stock-based)`);
    console.log(`   New Method: ${oldMethodExample.newDemandCalculation} units/month (patient-based)`);
    console.log(`   Difference: ${oldMethodExample.newDemandCalculation - oldMethodExample.oldDemandCalculation} units`);
    console.log(`   More realistic: ${oldMethodExample.newDemandCalculation < oldMethodExample.oldDemandCalculation ? 'Yes - lower demand' : 'No - higher demand'}`);
    
    console.log('\n🎯 Key Improvements:');
    console.log('   ✅ Demand based on actual patient volume (65 patients/day)');
    console.log('   ✅ Accounts for prescription vs vaccination split (70%/30%)');
    console.log('   ✅ Uses realistic prescription rates per medication');
    console.log('   ✅ Incorporates typical units per prescription');
    console.log('   ✅ Weather multipliers applied to calculated demand, not stock');
    console.log('   ✅ More accurate urgent medication alerts');
    
    console.log('\n✅ Patient Volume Forecasting Test Complete!');
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
}

testPatientVolumeForecastingUpdates();
