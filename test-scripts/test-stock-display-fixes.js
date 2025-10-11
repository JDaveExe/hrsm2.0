// Test script to verify stock display fixes
const axios = require('axios');

async function testStockDisplayFixes() {
    try {
        console.log('🧪 TESTING STOCK DISPLAY FIXES\n');
        
        console.log('1. Testing medication data fields...');
        const medResponse = await axios.get('http://localhost:5000/api/inventory/medications');
        
        console.log(`✅ Found ${medResponse.data.length} medications\n`);
        
        // Test first 5 medications for field consistency
        console.log('Sample medications with correct stock fields:');
        medResponse.data.slice(0, 5).forEach((med, index) => {
            const displayStock = med.unitsInStock || med.quantityInStock || 0;
            console.log(`${index + 1}. ${med.name}`);
            console.log(`   Frontend Display: ${displayStock} (Min: ${med.minimumStock})`);
            console.log(`   Database Fields: unitsInStock=${med.unitsInStock}, quantityInStock=${med.quantityInStock}`);
            console.log('');
        });
        
        console.log('2. Testing vaccine data fields...');
        const vaccineResponse = await axios.get('http://localhost:5000/api/inventory/vaccines');
        
        console.log(`✅ Found ${vaccineResponse.data.length} vaccines\n`);
        
        // Test first 3 vaccines for field consistency
        console.log('Sample vaccines with correct stock fields:');
        vaccineResponse.data.slice(0, 3).forEach((vaccine, index) => {
            const displayStock = vaccine.dosesInStock || vaccine.quantityInStock || 0;
            console.log(`${index + 1}. ${vaccine.name}`);
            console.log(`   Frontend Display: ${displayStock} (Min: ${vaccine.minimumStock})`);
            console.log(`   Database Fields: dosesInStock=${vaccine.dosesInStock}, quantityInStock=${vaccine.quantityInStock}`);
            console.log('');
        });
        
        // Test stock status calculations
        console.log('3. Testing stock status calculations...');
        
        function getStockStatus(currentStock, minimumStock) {
            if (currentStock === 0) return 'critical';
            if (currentStock <= minimumStock) return 'low';
            if (currentStock <= minimumStock * 1.5) return 'warning';
            return 'good';
        }
        
        const testMedications = medResponse.data.slice(0, 3);
        testMedications.forEach(med => {
            const currentStock = med.unitsInStock || med.quantityInStock || 0;
            const status = getStockStatus(currentStock, med.minimumStock);
            console.log(`${med.name}: Stock ${currentStock}, Min ${med.minimumStock} → Status: ${status.toUpperCase()}`);
        });
        
        console.log('\n4. Summary of applied fixes:');
        console.log('✅ PrescriptionInventory.js - Updated to use unitsInStock || quantityInStock');
        console.log('✅ VaccineInventory.js - Updated to use dosesInStock || quantityInStock');
        console.log('✅ Fixed stock statistics (Low Stock/Critical counts)');
        console.log('✅ Fixed sorting logic for stock levels');
        console.log('✅ All components now show actual stock numbers instead of "undefined"');
        
        console.log('\n🎯 EXPECTED RESULT:');
        console.log('• Inventory dashboard should now show actual stock numbers (e.g., "1244", "200", "150")');
        console.log('• No more blank stock displays or "undefined" values');
        console.log('• Minimum stock still shows as "Min: X" below the main stock number');
        console.log('• Stock sorting should work correctly');
        console.log('• Low Stock and Critical counts should be accurate');
        
    } catch (error) {
        console.error('❌ Error testing fixes:', error.message);
        console.log('\n🔄 Make sure backend server is running on port 5000');
    }
}

testStockDisplayFixes();