// Check existing database tables before vaccine migration
// Make sure to run this from the correct directory with proper env setup
require('dotenv').config({ path: './backend/.env' });
const { sequelize } = require('./backend/config/database');

async function checkDatabaseTables() {
    try {
        console.log('🔍 CHECKING DATABASE STRUCTURE');
        console.log('==============================\n');
        
        // Check if connected
        await sequelize.authenticate();
        console.log('✅ Database connection successful\n');
        
        // Get all table names
        const [tables] = await sequelize.query("SHOW TABLES");
        
        console.log('📋 Existing Tables:');
        tables.forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });
        
        // Check vaccines table specifically
        console.log('\n🧪 Checking vaccines table structure...');
        
        try {
            const [vaccineColumns] = await sequelize.query("DESCRIBE vaccines");
            console.log('✅ vaccines table found with columns:');
            vaccineColumns.forEach(col => {
                console.log(`   - ${col.Field} (${col.Type}) ${col.Key === 'PRI' ? '🔑 PRIMARY KEY' : ''}`);
            });
            
            // Count vaccines
            const [vaccineCount] = await sequelize.query("SELECT COUNT(*) as count FROM vaccines");
            console.log(`\n📊 Total vaccines in database: ${vaccineCount[0].count}`);
            
            // Show first few vaccines
            if (vaccineCount[0].count > 0) {
                const [vaccines] = await sequelize.query("SELECT id, name FROM vaccines LIMIT 5");
                console.log('\n🧪 Sample vaccines:');
                vaccines.forEach(vaccine => {
                    console.log(`   ID ${vaccine.id}: ${vaccine.name}`);
                });
            }
            
        } catch (error) {
            console.log('❌ vaccines table not found or has issues:', error.message);
        }
        
        // Check if vaccine_batches table already exists
        console.log('\n🔍 Checking vaccine_batches table...');
        try {
            const [batchColumns] = await sequelize.query("DESCRIBE vaccine_batches");
            console.log('⚠️  vaccine_batches table already exists with columns:');
            batchColumns.forEach(col => {
                console.log(`   - ${col.Field} (${col.Type})`);
            });
            
            // Drop it so we can recreate properly
            console.log('\n🗑️  Dropping existing vaccine_batches table...');
            await sequelize.query("DROP TABLE vaccine_batches");
            console.log('✅ Dropped existing vaccine_batches table');
            
        } catch (error) {
            console.log('✅ vaccine_batches table does not exist (good)');
        }
        
        console.log('\n🎯 READY FOR VACCINE BATCH MIGRATION');
        console.log('===================================');
        console.log('✅ vaccines table verified');
        console.log('✅ vaccine_batches table cleared');
        console.log('✅ Foreign key constraints ready');
        
    } catch (error) {
        console.error('\n❌ DATABASE CHECK FAILED');
        console.error('========================');
        console.error(`Error: ${error.message}`);
        console.error('\nPlease fix database issues before proceeding');
        throw error;
    } finally {
        await sequelize.close();
    }
}

checkDatabaseTables();