// Check medications table for vaccine data  
require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./backend/config/database');

async function checkMedicationsForVaccines() {
    try {
        console.log('🔍 ANALYZING MEDICATIONS TABLE FOR VACCINES');
        console.log('===========================================\n');
        
        await sequelize.authenticate();
        
        // Get medications table structure
        const [columns] = await sequelize.query("DESCRIBE medications");
        console.log('📋 Medications table structure:');
        columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type}) ${col.Key === 'PRI' ? '🔑 PRIMARY' : ''} ${col.Default ? `[${col.Default}]` : ''}`);
        });
        
        // Count total medications
        const [totalCount] = await sequelize.query("SELECT COUNT(*) as count FROM medications");
        console.log(`\n📊 Total medications: ${totalCount[0].count}`);
        
        // Check categories
        const [categories] = await sequelize.query("SELECT DISTINCT category, COUNT(*) as count FROM medications GROUP BY category");
        console.log('\n📂 Medication categories:');
        categories.forEach(cat => {
            console.log(`   - ${cat.category}: ${cat.count} items`);
        });
        
        // Look for vaccines in various ways
        console.log('\n🧪 Searching for vaccines...');
        
        // Check for "Vaccine" category
        const [vaccineCategory] = await sequelize.query("SELECT COUNT(*) as count FROM medications WHERE category = 'Vaccine' OR category LIKE '%vaccine%'");
        console.log(`Vaccine category items: ${vaccineCategory[0].count}`);
        
        // Check for vaccine names
        const [vaccineNames] = await sequelize.query("SELECT COUNT(*) as count FROM medications WHERE name LIKE '%vaccine%' OR name LIKE '%BCG%' OR name LIKE '%COVID%' OR name LIKE '%OPV%' OR name LIKE '%DTP%'");
        console.log(`Vaccine-like names: ${vaccineNames[0].count}`);
        
        // Show all medications to see if we can identify vaccines
        console.log('\n📋 All medications in database:');
        const [allMeds] = await sequelize.query("SELECT id, name, category, batchNumber, unitsInStock, expiryDate FROM medications ORDER BY category, name");
        allMeds.forEach(med => {
            console.log(`   ID ${med.id}: ${med.name} (${med.category}) - Batch: ${med.batchNumber}, Stock: ${med.unitsInStock}, Expires: ${new Date(med.expiryDate).toLocaleDateString()}`);
        });
        
        console.log('\n🎯 ANALYSIS RESULT');
        console.log('==================');
        if (allMeds.length === 0) {
            console.log('❌ No medications found in database');
            console.log('🔍 This might mean vaccines are stored separately or not yet added');
        } else {
            console.log('✅ Found medications in database');
            console.log('🧪 Need to determine if vaccines are mixed with medications or separate');
        }
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

checkMedicationsForVaccines();