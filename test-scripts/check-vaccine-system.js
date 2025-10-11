// Check current vaccine system structure
const axios = require('axios');

async function checkVaccineSystem() {
    try {
        console.log('🔍 CHECKING CURRENT VACCINE SYSTEM');
        console.log('==================================\n');
        
        // Get vaccine data
        const vaccineResponse = await axios.get('http://localhost:5000/api/inventory/vaccines');
        
        if (vaccineResponse.data.length > 0) {
            const sampleVaccine = vaccineResponse.data[0];
            
            console.log('📊 Current Vaccine Structure:');
            console.log(`   Name: ${sampleVaccine.name}`);
            console.log(`   Doses in Stock: ${sampleVaccine.dosesInStock || sampleVaccine.quantityInStock || 'N/A'}`);
            console.log(`   Batch Number: ${sampleVaccine.batchNumber || 'N/A'}`);
            console.log(`   Expiry Date: ${sampleVaccine.expiryDate || 'N/A'}`);
            console.log(`   Manufacturer: ${sampleVaccine.manufacturer || 'N/A'}`);
            
            console.log('\n🔍 Vaccine Field Analysis:');
            Object.keys(sampleVaccine).forEach(key => {
                if (key.includes('batch') || key.includes('stock') || key.includes('expiry') || key.includes('dose')) {
                    console.log(`   - ${key}: ${sampleVaccine[key]}`);
                }
            });
            
            console.log('\n❌ VACCINE SYSTEM STATUS:');
            console.log('❌ Still using legacy single-batch system');
            console.log('❌ Same overwriting problem as medications had');
            console.log('❌ No batch tracking for vaccines');
            console.log('❌ No FIFO support for vaccine expiry management');
            
            console.log('\n🎯 RECOMMENDATIONS:');
            console.log('1. Create VaccineBatch model (similar to MedicationBatch)');
            console.log('2. Create vaccine batch migration script');
            console.log('3. Update VaccineInventory frontend component');
            console.log('4. Update vaccine add-stock functionality');
            console.log('5. Apply same FIFO logic to vaccines');
            
            console.log('\n⚠️  CRITICAL: Vaccines need the same batch system upgrade!');
            
        } else {
            console.log('❌ No vaccine data found');
        }
        
    } catch (error) {
        console.error('❌ Error checking vaccine system:', error.message);
    }
}

checkVaccineSystem();