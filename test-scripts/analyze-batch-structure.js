// Analyze current database structure for batch management
const axios = require('axios');

async function analyzeBatchStructure() {
    try {
        console.log('🔍 ANALYZING CURRENT BATCH MANAGEMENT STRUCTURE\n');
        
        // Get medication data to see current structure
        const response = await axios.get('http://localhost:5000/api/inventory/medications');
        
        if (response.status !== 200) {
            console.log('❌ API connection failed');
            return;
        }
        
        console.log(`📦 Found ${response.data.length} medications\n`);
        
        // Analyze first few medications for structure
        console.log('🔬 CURRENT DATABASE STRUCTURE:');
        const sampleMeds = response.data.slice(0, 3);
        
        sampleMeds.forEach((med, index) => {
            console.log(`\n${index + 1}. ${med.name}`);
            console.log(`   Structure Analysis:`);
            
            // Check all fields related to batches/stock
            const fields = Object.keys(med);
            const batchFields = fields.filter(field => 
                field.includes('batch') || 
                field.includes('expiry') || 
                field.includes('stock') || 
                field.includes('quantity') ||
                field.includes('units')
            );
            
            batchFields.forEach(field => {
                console.log(`   - ${field}: ${med[field]}`);
            });
        });
        
        // Check if there are any batch-related tables
        console.log('\n📋 PROBLEMS WITH CURRENT STRUCTURE:');
        console.log('❌ Single expiry date per medication (not per batch)');
        console.log('❌ Single stock quantity (no batch breakdown)');
        console.log('❌ No batch tracking system');
        console.log('❌ No FIFO (First In, First Out) management');
        console.log('❌ Risk of dispensing expired medications');
        
        console.log('\n🎯 RECOMMENDED SOLUTION:');
        console.log('1. Create separate "medication_batches" table');
        console.log('2. Each batch has: batch_number, expiry_date, quantity, medication_id');
        console.log('3. Medication table shows: total_stock (sum of all batches)');
        console.log('4. Display: "Next expiry" (earliest batch expiry date)');
        console.log('5. Implement FIFO dispensing logic');
        
        console.log('\n📊 PROPOSED DATABASE STRUCTURE:');
        console.log(`
medications table:
├── id, name, category, strength, etc.
├── total_stock (calculated from batches)
├── minimum_stock
└── next_expiry (earliest batch expiry)

medication_batches table:
├── id, medication_id
├── batch_number
├── quantity_remaining
├── expiry_date
├── unit_cost
├── supplier
├── received_date
└── status (active/expired/recalled)
        `);
        
        console.log('\n🚨 MIGRATION COMPLEXITY:');
        console.log('⚠️  HIGH - This requires database schema changes');
        console.log('⚠️  Existing data needs to be migrated to batch records');
        console.log('⚠️  Frontend components need updates');
        console.log('⚠️  Add stock functionality needs complete rewrite');
        console.log('⚠️  Dispensing logic needs FIFO implementation');
        
    } catch (error) {
        console.error('❌ Error analyzing structure:', error.message);
    }
}

analyzeBatchStructure();