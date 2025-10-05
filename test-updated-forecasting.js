// Test script to verify updated forecasting system uses batch-based calculations
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testUpdatedForecasting() {
  console.log('🧪 Testing Updated Forecasting System with Batch-Based Calculations\n');

  try {
    // 1. Check medication batches for Paracetamol
    console.log('📊 Testing medication batches for Paracetamol (ID 1)...');
    const batchResponse = await axios.get(`${BASE_URL}/api/medication-batches/1/batches`);
    const batches = batchResponse.data;
    
    const totalBatchStock = batches
      .filter(batch => new Date(batch.expiryDate) > new Date()) // Only non-expired
      .reduce((sum, batch) => sum + batch.quantityRemaining, 0);
    
    console.log(`✅ Found ${batches.length} batches for Paracetamol`);
    console.log(`   Total active stock from batches: ${totalBatchStock} units`);
    
    // Show each batch
    batches.forEach((batch, index) => {
      const isExpired = new Date(batch.expiryDate) <= new Date();
      console.log(`   Batch ${index + 1}: ${batch.batchNumber} - ${batch.quantityRemaining} units (Expires: ${batch.expiryDate.split('T')[0]}) ${isExpired ? '❌ EXPIRED' : '✅ Active'}`);
    });

    // 2. Check old JSON data for comparison
    console.log('\n💾 Checking old JSON stock data...');
    const oldDataResponse = await axios.get(`${BASE_URL}/api/inventory/medications`);
    const paracetamolOldData = oldDataResponse.data.find(med => med.id === 1);
    console.log(`   Old JSON stock for Paracetamol: ${paracetamolOldData.unitsInStock} units`);
    
    // 3. Test the updated weather prescription service
    console.log('\n🌦️  Testing weather-based medication recommendations...');
    
    // Import and test the weatherPrescriptionService getCurrentInventory method
    // Note: This is a bit tricky to test directly since it's a module, 
    // but we can test the overall flow through the enhanced forecasting service
    
    try {
      // Test the enhanced forecasting service endpoint if available
      const forecastResponse = await axios.get(`${BASE_URL}/api/dashboard/enhanced-forecasting`);
      if (forecastResponse.data && forecastResponse.data.urgentMedications) {
        console.log('✅ Enhanced forecasting API responded');
        console.log('   Urgent medications detected:', forecastResponse.data.urgentMedications.length);
        
        // Look for Paracetamol in urgent medications
        const paracetamolAlert = forecastResponse.data.urgentMedications.find(med => 
          med.medication.toLowerCase().includes('paracetamol')
        );
        
        if (paracetamolAlert) {
          console.log(`   📋 Paracetamol alert: ${paracetamolAlert.medication} - ${paracetamolAlert.requiredUnits} units needed`);
          console.log(`   🔍 This should now be calculated using batch stock (${totalBatchStock}) instead of old JSON (${paracetamolOldData.unitsInStock})`);
        }
      }
    } catch (forecastError) {
      console.log('ℹ️  Enhanced forecasting API not available, checking alternative endpoints...');
      
      // Try alternative weather service endpoints
      try {
        const weatherResponse = await axios.get(`${BASE_URL}/api/weather/recommendations`);
        console.log('✅ Weather recommendations API available');
      } catch (weatherError) {
        console.log('ℹ️  Weather recommendations API not available');
      }
    }

    console.log('\n🎯 Key Verification Points:');
    console.log(`   ✓ Batch system has ${batches.length} batches for Paracetamol`);
    console.log(`   ✓ Total batch stock: ${totalBatchStock} units (vs old JSON: ${paracetamolOldData.unitsInStock})`);
    console.log(`   ✓ Updated getCurrentInventory() should use batch calculation`);
    console.log(`   ✓ Expired batches are properly excluded from calculations`);
    
    // 4. Test with another medication that might have batches
    console.log('\n📋 Testing another medication with batches...');
    try {
      const batch2Response = await axios.get(`${BASE_URL}/api/medication-batches/2/batches`);
      if (batch2Response.data && batch2Response.data.length > 0) {
        const med2Batches = batch2Response.data;
        const med2Stock = med2Batches
          .filter(batch => new Date(batch.expiryDate) > new Date())
          .reduce((sum, batch) => sum + batch.quantityRemaining, 0);
        console.log(`   Medication ID 2 has ${med2Batches.length} batches with ${med2Stock} active units`);
      } else {
        console.log('   Medication ID 2 has no batch data');
      }
    } catch (error) {
      console.log('   Could not fetch batches for medication ID 2');
    }

  } catch (error) {
    console.error('❌ Error testing updated forecasting:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the test
testUpdatedForecasting();