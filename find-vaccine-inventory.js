// Find actual vaccine inventory system
require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./backend/config/database');

async function findVaccineInventory() {
    try {
        console.log('🔍 SEARCHING FOR VACCINE INVENTORY SYSTEM');
        console.log('=========================================\n');
        
        await sequelize.authenticate();
        
        // Get all tables
        const [tables] = await sequelize.query("SHOW TABLES");
        console.log('📋 All Database Tables:');
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });
        
        // Check each table for vaccine-related data
        console.log('\n🔍 Searching for vaccine inventory data...\n');
        
        const potentialTables = [
            'medications', // might include vaccines
            'vaccinations',
            'users',
            'appointments'
        ];
        
        for (const tableName of potentialTables) {
            try {
                console.log(`📋 Checking ${tableName} table...`);
                const [columns] = await sequelize.query(`DESCRIBE ${tableName}`);
                
                // Look for stock/inventory related columns
                const inventoryColumns = columns.filter(col => 
                    col.Field.toLowerCase().includes('stock') ||
                    col.Field.toLowerCase().includes('dose') ||
                    col.Field.toLowerCase().includes('batch') ||
                    col.Field.toLowerCase().includes('inventory') ||
                    col.Field.toLowerCase().includes('quantity')
                );
                
                if (inventoryColumns.length > 0) {
                    console.log(`✅ Found inventory-related columns in ${tableName}:`);
                    inventoryColumns.forEach(col => {
                        console.log(`   - ${col.Field} (${col.Type})`);
                    });
                    
                    // Check for vaccine data
                    if (tableName === 'medications') {
                        const [vaccineCheck] = await sequelize.query("SELECT COUNT(*) as count FROM medications WHERE category LIKE '%vaccine%' OR name LIKE '%vaccine%'");
                        console.log(`   🧪 Vaccine-like medications: ${vaccineCheck[0].count}`);
                        
                        if (vaccineCheck[0].count > 0) {
                            const [vaccineData] = await sequelize.query("SELECT id, name, category, batchNumber, unitsInStock FROM medications WHERE category LIKE '%vaccine%' OR name LIKE '%vaccine%' LIMIT 5");
                            console.log('   📋 Sample vaccine medications:');
                            vaccineData.forEach(item => {
                                console.log(`     ID ${item.id}: ${item.name} (${item.category}) - Batch: ${item.batchNumber}, Stock: ${item.unitsInStock}`);
                            });
                        }
                    }
                }
                
            } catch (error) {
                console.log(`❌ Error checking ${tableName}: ${error.message}`);
            }
        }
        
        console.log('\n🎯 CONCLUSION');
        console.log('=============');
        console.log('Based on the structure, it appears vaccines might be stored in the medications table');
        console.log('or there might be a separate vaccine inventory system we need to identify.');
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

findVaccineInventory();