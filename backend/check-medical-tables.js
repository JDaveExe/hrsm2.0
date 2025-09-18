require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSpecificTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hrsm'
    });
    
    try {
        console.log('📊 Checking specific table structures...\n');
        
        // Check medicalrecords table
        console.log('🏥 MEDICALRECORDS table structure:');
        const [medicalColumns] = await connection.execute('DESCRIBE medicalrecords');
        medicalColumns.forEach(col => {
            console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`);
        });
        
        // Check prescription_records table
        console.log('\n💊 PRESCRIPTION_RECORDS table structure:');
        const [prescriptionColumns] = await connection.execute('DESCRIBE prescription_records');
        prescriptionColumns.forEach(col => {
            console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`);
        });
        
        // Check appointments table
        console.log('\n📅 APPOINTMENTS table structure:');
        const [appointmentColumns] = await connection.execute('DESCRIBE appointments');
        appointmentColumns.forEach(col => {
            console.log(`  ${col.Field} - ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

checkSpecificTables().catch(console.error);
