// Find vaccine data in the database
require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./backend/config/database');

async function findVaccineData() {
    try {
        console.log('🔍 SEARCHING FOR VACCINE DATA');
        console.log('=============================\n');
        
        // Check if connected
        await sequelize.authenticate();
        console.log('✅ Database connection successful\n');
        
        // Check vaccinations table
        console.log('🧪 Checking vaccinations table...');
        try {
            const [vaccinationColumns] = await sequelize.query("DESCRIBE vaccinations");
            console.log('✅ vaccinations table found with columns:');
            vaccinationColumns.forEach(col => {
                console.log(`   - ${col.Field} (${col.Type}) ${col.Key === 'PRI' ? '🔑 PRIMARY KEY' : ''}`);
            });
            
            // Count vaccinations
            const [vaccinationCount] = await sequelize.query("SELECT COUNT(*) as count FROM vaccinations");
            console.log(`\n📊 Total vaccination records: ${vaccinationCount[0].count}`);
            
            // Show vaccine names
            if (vaccinationCount[0].count > 0) {
                const [vaccineNames] = await sequelize.query("SELECT DISTINCT vaccineName FROM vaccinations ORDER BY vaccineName");
                console.log('\n🧪 Vaccine names found:');
                vaccineNames.forEach((vaccine, index) => {
                    console.log(`   ${index + 1}. ${vaccine.vaccineName}`);
                });
                
                // Show sample vaccination records
                const [samples] = await sequelize.query("SELECT id, vaccineName, batchNumber, dosesInStock, expiryDate FROM vaccinations LIMIT 5");
                console.log('\n📋 Sample vaccination records:');
                samples.forEach(record => {
                    console.log(`   ID ${record.id}: ${record.vaccineName} - Batch: ${record.batchNumber}, Stock: ${record.dosesInStock}, Expires: ${record.expiryDate}`);
                });
            }
            
        } catch (error) {
            console.log('❌ vaccinations table issue:', error.message);
        }
        
        // Look for any other vaccine-related tables
        const [tables] = await sequelize.query("SHOW TABLES LIKE '%vaccine%'");
        console.log('\n🔍 Vaccine-related tables:');
        if (tables.length > 0) {
            tables.forEach((table, index) => {
                const tableName = Object.values(table)[0];
                console.log(`   ${index + 1}. ${tableName}`);
            });
        } else {
            console.log('   No tables with "vaccine" in the name found');
        }
        
        console.log('\n📋 ANALYSIS COMPLETE');
        console.log('===================');
        console.log('The system appears to use the "vaccinations" table');
        console.log('instead of a separate "vaccines" table.');
        console.log('We need to adapt our batch system accordingly.');
        
    } catch (error) {
        console.error('❌ ERROR:', error.message);
        throw error;
    } finally {
        await sequelize.close();
    }
}

findVaccineData();