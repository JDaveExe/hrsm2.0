const { sequelize } = require('./config/database');

async function checkAllAutoIncrements() {
    try {
        await sequelize.authenticate();
        console.log('🔍 Checking all table AUTO_INCREMENT values and data...\n');

        // Get all table names
        const [tables] = await sequelize.query("SHOW TABLES");
        const tableNames = tables.map(row => Object.values(row)[0]);
        
        console.log('📊 DATABASE ANALYSIS:\n');
        
        for (const tableName of tableNames) {
            console.log(`=== ${tableName.toUpperCase()} ===`);
            
            // Get table status (includes AUTO_INCREMENT)
            const [status] = await sequelize.query(`SHOW TABLE STATUS LIKE '${tableName}'`);
            const autoIncrement = status[0]?.Auto_increment || 'N/A';
            
            // Get current max ID and count
            try {
                const [maxResult] = await sequelize.query(`SELECT MAX(id) as maxId, COUNT(*) as count FROM ${tableName}`);
                const maxId = maxResult[0].maxId || 0;
                const count = maxResult[0].count || 0;
                
                console.log(`  Current records: ${count}`);
                console.log(`  Max ID in use: ${maxId}`);
                console.log(`  Next AUTO_INCREMENT: ${autoIncrement}`);
                
                // Show actual records if few
                if (count <= 10 && count > 0) {
                    const [records] = await sequelize.query(`SELECT id, email, role FROM ${tableName} ORDER BY id LIMIT 10`);
                    console.log('  Records:');
                    records.forEach(record => {
                        console.log(`    ID: ${record.id}, Email: ${record.email || 'N/A'}, Role: ${record.role || 'N/A'}`);
                    });
                }
                
                // Check for potential conflicts
                if (autoIncrement <= maxId && maxId > 0) {
                    console.log(`  ⚠️  POTENTIAL CONFLICT: AUTO_INCREMENT (${autoIncrement}) <= MAX_ID (${maxId})`);
                }
                
            } catch (e) {
                console.log(`  (Table doesn't have id/email/role columns or error: ${e.message})`);
            }
            
            console.log('');
        }
        
        console.log('🔍 HARDCODED TEST ACCOUNT IDs:');
        console.log('  Admin: ID 1');
        console.log('  Doctor: ID 2'); 
        console.log('  Patient: ID 3');
        console.log('');
        
        await sequelize.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAllAutoIncrements();
