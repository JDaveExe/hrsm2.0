// Test vaccine batch creation by checking the API endpoints
const axios = require('axios');
const fs = require('fs');

async function testVaccineBatchAPI() {
    console.log('🧪 TESTING VACCINE BATCH CREATION API (Frontend Perspective)');
    
    const BASE_URL = 'http://localhost:5000/api';
    
    try {
        // 1. Check if backend is running
        console.log('\n🔗 Checking backend server...');
        await axios.get(`${BASE_URL}/health`, { timeout: 3000 });
        console.log('✅ Backend server is running');
        
    } catch (error) {
        console.log('❌ Backend server not running. Starting server check...');
        console.log('Please make sure the backend is running with: npm start');
        return;
    }

    try {
        // 2. Get sample vaccine data
        console.log('\n📊 Getting vaccine data...');
        const vaccinesData = JSON.parse(fs.readFileSync('./backend/data/vaccines.json', 'utf8'));
        const testVaccine = vaccinesData[0]; // Use first vaccine
        console.log(`Testing with vaccine: ${testVaccine.name} (ID: ${testVaccine.id})`);

        // 3. Test batch creation API
        console.log('\n🔬 Testing batch creation...');
        const testBatchData = {
            batchNumber: `TEST-BATCH-${Date.now()}`,
            lotNumber: `LOT-${Date.now()}`,
            dosesReceived: 50,
            expiryDate: '2025-06-30',
            unitCost: 25.00,
            manufacturer: testVaccine.manufacturer || 'Test Manufacturer',
            supplier: 'Test Supplier'
        };

        const createResponse = await axios.post(
            `${BASE_URL}/vaccine-batches/${testVaccine.id}/batches`,
            testBatchData,
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 10000
            }
        );
        
        console.log('✅ Batch creation response:', createResponse.data);

        // 4. Test enhanced endpoint to see the batch
        console.log('\n🔍 Testing enhanced endpoint...');
        const enhancedResponse = await axios.get(
            `${BASE_URL}/vaccine-batches/${testVaccine.id}/enhanced`,
            { timeout: 5000 }
        );
        
        console.log('✅ Enhanced endpoint data:', {
            vaccineName: enhancedResponse.data.name,
            totalDoses: enhancedResponse.data.totalDoses,
            batchCount: enhancedResponse.data.batchCount,
            batchesFound: enhancedResponse.data.batches?.length || 0
        });

        if (enhancedResponse.data.batches && enhancedResponse.data.batches.length > 0) {
            console.log('📦 Sample batch:', {
                batchNumber: enhancedResponse.data.batches[0].batchNumber,
                dosesRemaining: enhancedResponse.data.batches[0].dosesRemaining,
                expiryDate: enhancedResponse.data.batches[0].expiryDate
            });
        }

        // 5. Test getting all batches for this vaccine
        console.log('\n📋 Testing batch list endpoint...');
        const batchesResponse = await axios.get(
            `${BASE_URL}/vaccine-batches/${testVaccine.id}/batches`,
            { timeout: 5000 }
        );
        
        console.log(`✅ Found ${batchesResponse.data.length} batches for this vaccine`);

        console.log('\n🎉 ALL VACCINE BATCH API TESTS PASSED!');
        console.log('\n📝 SUMMARY:');
        console.log('- Vaccine batch creation API: ✅ Working');
        console.log('- Enhanced vaccine endpoint: ✅ Working');
        console.log('- Batch listing endpoint: ✅ Working');
        console.log('- Vaccine inventory now has proper batch tracking like prescriptions! 🎯');

    } catch (error) {
        console.error('❌ API Test failed:', error.message);
        
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response data:', error.response.data);
        }
    }
}

// Run the test
testVaccineBatchAPI().catch(console.error);