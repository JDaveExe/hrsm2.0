const { sequelize } = require('./config/database');

async function resetAutoIncrement() {
    try {
        await sequelize.authenticate();
        console.log('🔧 Resetting AUTO_INCREMENT counters...\n');

        // Get current max IDs to set counters appropriately
        const [userResults] = await sequelize.query('SELECT MAX(id) as maxId FROM users');
        const [patientResults] = await sequelize.query('SELECT MAX(id) as maxId FROM patients');
        
        const maxUserId = userResults[0].maxId || 0;
        const maxPatientId = patientResults[0].maxId || 0;
        
        console.log('Current max User ID:', maxUserId);
        console.log('Current max Patient ID:', maxPatientId);
        
        // Reset AUTO_INCREMENT to next available ID
        const nextUserId = maxUserId + 1;
        const nextPatientId = maxPatientId + 1;
        
        await sequelize.query(`ALTER TABLE users AUTO_INCREMENT = ${nextUserId}`);
        await sequelize.query(`ALTER TABLE patients AUTO_INCREMENT = ${nextPatientId}`);
        
        console.log('\n✅ AUTO_INCREMENT counters reset!');
        console.log('Next User ID will be:', nextUserId);
        console.log('Next Patient ID will be:', nextPatientId);
        
        await sequelize.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

resetAutoIncrement();
