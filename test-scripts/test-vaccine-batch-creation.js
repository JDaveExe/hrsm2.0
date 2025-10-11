// Test vaccine batch creation API functionality
const mysql = require('mysql2/promise');

async function testVaccineBatchCreation() {
    console.log('🧪 TESTING VACCINE BATCH CREATION API');
    
    // Database connection
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'admin123',
        database: 'healthsystem_db'
    });

    try {
        // 1. Check if vaccine_batches table exists and its structure
        console.log('\n📊 Checking vaccine_batches table structure...');
        const [tableInfo] = await connection.execute('DESCRIBE vaccine_batches');
        console.log('Table structure:', tableInfo.map(col => `${col.Field}: ${col.Type}`));

        // 2. Count existing vaccine batches
        const [batchCount] = await connection.execute('SELECT COUNT(*) as count FROM vaccine_batches');
        console.log(`\n📦 Current vaccine batches: ${batchCount[0].count}`);

        // 3. Test the API endpoint with a sample vaccine
        console.log('\n🔬 Testing vaccine batch creation API...');
        
        // First, let's find a vaccine to test with
        const fs = require('fs');
        const vaccinesData = JSON.parse(fs.readFileSync('./backend/data/vaccines.json', 'utf8'));
        const testVaccine = vaccinesData[0]; // Use first vaccine
        
        console.log(`Testing with vaccine: ${testVaccine.name} (ID: ${testVaccine.id})`);
        
        // Test batch data
        const testBatchData = {
            batchNumber: `TEST-BATCH-${Date.now()}`,
            lotNumber: `LOT-${Date.now()}`,
            dosesReceived: 50,
            expiryDate: '2025-06-30',
            unitCost: 25.00,
            manufacturer: testVaccine.manufacturer || 'Test Manufacturer',
            supplier: 'Test Supplier'
        };

        // Make API request to create batch
        const axios = require('axios');
        try {
            const response = await axios.post(
                `http://localhost:5000/api/vaccine-batches/${testVaccine.id}/batches`,
                testBatchData,
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000
                }
            );
            
            console.log('✅ API Response:', response.data);
            
            // 4. Verify the batch was created in database
            const [newBatches] = await connection.execute(
                'SELECT * FROM vaccine_batches WHERE batchNumber = ?',
                [testBatchData.batchNumber]
            );
            
            if (newBatches.length > 0) {
                console.log('✅ Batch successfully created in database:', {
                    id: newBatches[0].id,
                    batchNumber: newBatches[0].batchNumber,
                    dosesReceived: newBatches[0].dosesReceived,
                    dosesRemaining: newBatches[0].dosesRemaining
                });
            } else {
                console.log('❌ Batch not found in database');
            }
            
        } catch (apiError) {
            console.log('⚠️ API Error:', apiError.message);
            
            if (apiError.code === 'ECONNREFUSED') {
                console.log('❌ Backend server not running. Please start the server first.');
            } else {
                console.log('Full error:', apiError.response?.data || apiError.message);
            }
        }

        // 5. Test enhanced endpoint
        console.log('\n🔍 Testing enhanced vaccine endpoint...');
        try {
            const enhancedResponse = await axios.get(
                `http://localhost:5000/api/vaccine-batches/${testVaccine.id}/enhanced`,
                { timeout: 5000 }
            );
            
            console.log('✅ Enhanced endpoint working:', {
                vaccineName: enhancedResponse.data.name,
                totalDoses: enhancedResponse.data.totalDoses,
                batchCount: enhancedResponse.data.batchCount,
                batches: enhancedResponse.data.batches?.length || 0
            });
            
        } catch (enhancedError) {
            console.log('⚠️ Enhanced endpoint error:', enhancedError.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await connection.end();
    }
}

// Run the test
testVaccineBatchCreation().catch(console.error);