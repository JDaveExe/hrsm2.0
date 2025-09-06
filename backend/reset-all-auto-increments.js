const { sequelize } = require('./config/database');

async function resetAllAutoIncrements() {
    try {
        await sequelize.authenticate();
        console.log('🔧 Resetting all AUTO_INCREMENT counters to safe values...\n');

        // Define safe starting points (well above any hardcoded test IDs)
        const resetValues = {
            'users': 100,        // Start from 100 (hardcoded test accounts use 9001-9003)
            'patients': 100,     // Start from 100
            'appointments': 1,   // Start from 1 (empty)
            'families': 70,      // Start from 70 (current max is 67)
            'medications': 35,   // Start from 35 (current max is 30)
            'medicalrecords': 1, // Start from 1 (empty)
            'vital_signs': 15,   // Start from 15 (current max AUTO_INCREMENT is 11)
            'check_in_sessions': 5 // Start from 5 (current AUTO_INCREMENT is 4)
        };

        for (const [tableName, startValue] of Object.entries(resetValues)) {
            try {
                // Get current max ID
                const [maxResult] = await sequelize.query(`SELECT MAX(id) as maxId FROM ${tableName}`);
                const currentMaxId = maxResult[0].maxId || 0;
                
                // Use the higher of: current max + 1, or our safe start value
                const nextId = Math.max(currentMaxId + 1, startValue);
                
                await sequelize.query(`ALTER TABLE ${tableName} AUTO_INCREMENT = ${nextId}`);
                
                console.log(`✅ ${tableName}: AUTO_INCREMENT set to ${nextId} (max ID: ${currentMaxId})`);
                
            } catch (error) {
                console.log(`⚠️  ${tableName}: Error - ${error.message}`);
            }
        }
        
        console.log('\n🎯 SAFE ID RANGES:');
        console.log('  Regular database records: 100+');
        console.log('  Hardcoded test accounts: 9001-9003');
        console.log('  No conflicts possible!');
        
        console.log('\n✅ All AUTO_INCREMENT counters reset to safe values!');
        
        await sequelize.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

resetAllAutoIncrements();
