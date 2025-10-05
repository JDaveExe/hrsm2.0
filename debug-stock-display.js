// Debug script to check stock field data consistency
const axios = require('axios');

async function debugStockDisplay() {
    try {
        console.log('🔍 DEBUGGING STOCK DISPLAY ISSUES\n');
        
        // Test API connection
        console.log('1. Testing API connection...');
        const response = await axios.get('http://localhost:5000/api/inventory/medications');
        
        if (response.status !== 200) {
            console.log('❌ API connection failed');
            return;
        }
        
        console.log(`✅ API connected - Found ${response.data.length} medications\n`);
        
        // Analyze stock field data
        console.log('2. Analyzing stock field data...\n');
        
        let hasQuantityInStock = 0;
        let hasUnitsInStock = 0;
        let hasStock = 0;
        let missingStock = 0;
        
        const problematicMeds = [];
        
        response.data.forEach((med, index) => {
            const hasQIS = med.quantityInStock !== undefined && med.quantityInStock !== null;
            const hasUIS = med.unitsInStock !== undefined && med.unitsInStock !== null;
            const hasS = med.stock !== undefined && med.stock !== null;
            
            if (hasQIS) hasQuantityInStock++;
            if (hasUIS) hasUnitsInStock++;
            if (hasS) hasStock++;
            
            const actualStock = med.quantityInStock || med.unitsInStock || med.stock || 0;
            
            if (actualStock === 0 || (!hasQIS && !hasUIS && !hasS)) {
                missingStock++;
                problematicMeds.push({
                    id: med.id,
                    name: med.name,
                    quantityInStock: med.quantityInStock,
                    unitsInStock: med.unitsInStock,
                    stock: med.stock,
                    minimumStock: med.minimumStock,
                    actualStock: actualStock
                });
            }
            
            // Show first 10 medications for analysis
            if (index < 10) {
                console.log(`${index + 1}. ${med.name}`);
                console.log(`   - quantityInStock: ${med.quantityInStock}`);
                console.log(`   - unitsInStock: ${med.unitsInStock}`);
                console.log(`   - stock: ${med.stock}`);
                console.log(`   - minimumStock: ${med.minimumStock}`);
                console.log(`   - Actual displayed: ${actualStock}`);
                console.log('');
            }
        });
        
        console.log('📊 STOCK FIELD SUMMARY:');
        console.log(`   - Medications with quantityInStock: ${hasQuantityInStock}`);
        console.log(`   - Medications with unitsInStock: ${hasUnitsInStock}`);
        console.log(`   - Medications with stock: ${hasStock}`);
        console.log(`   - Medications missing stock data: ${missingStock}\n`);
        
        if (problematicMeds.length > 0) {
            console.log('⚠️  PROBLEMATIC MEDICATIONS (showing 0 stock):');
            problematicMeds.forEach(med => {
                console.log(`   - ${med.name} (ID: ${med.id})`);
                console.log(`     Current: ${med.actualStock}, Min: ${med.minimumStock}`);
            });
            console.log('');
        }
        
        // Test vaccines
        try {
            console.log('3. Testing vaccine data...');
            const vaccineResponse = await axios.get('http://localhost:5000/api/inventory/vaccines');
            console.log(`✅ Found ${vaccineResponse.data.length} vaccines\n`);
            
            // Analyze first few vaccines
            vaccineResponse.data.slice(0, 5).forEach((vaccine, index) => {
                const actualStock = vaccine.quantityInStock || vaccine.dosesInStock || 0;
                console.log(`${index + 1}. ${vaccine.name}`);
                console.log(`   - quantityInStock: ${vaccine.quantityInStock}`);
                console.log(`   - dosesInStock: ${vaccine.dosesInStock}`);
                console.log(`   - minimumStock: ${vaccine.minimumStock}`);
                console.log(`   - Actual displayed: ${actualStock}`);
                console.log('');
            });
            
        } catch (vaccineError) {
            console.log('❌ Could not fetch vaccine data');
        }
        
        console.log('🔧 RECOMMENDED FIXES:');
        console.log('1. Update display logic to show fallback values');
        console.log('2. Ensure database has consistent stock field names');
        console.log('3. Add null/undefined checks in frontend components');
        
    } catch (error) {
        console.error('❌ Error debugging stock display:', error.message);
        console.log('\n🔄 Make sure backend server is running on port 5000');
    }
}

debugStockDisplay();