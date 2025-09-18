require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanupOldCheckups() {
    console.log('🧹 Starting cleanup of old test checkup data...\n');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hrsm'
    });
    
    try {
        // Start transaction for safety
        await connection.beginTransaction();
        
        // 1. Check what medical records exist
        console.log('📋 Checking existing medical records...');
        const [records] = await connection.execute(`
            SELECT mr.id, mr.patientId, mr.created_at, mr.diagnosis, mr.treatment_plan,
                   p.firstName, p.lastName 
            FROM medicalrecords mr 
            LEFT JOIN patients p ON mr.patientId = p.id 
            ORDER BY mr.created_at DESC
        `);
        
        console.log(`Found ${records.length} medical records:`);
        records.forEach(record => {
            console.log(`  - ID: ${record.id}, Patient: ${record.firstName} ${record.lastName}, Date: ${record.created_at}`);
        });
        
        if (records.length === 0) {
            console.log('✅ No medical records found to clean up.');
            await connection.rollback();
            return;
        }
        
        // 2. Check prescription records
        console.log('\n💊 Checking prescription records...');
        const [prescriptions] = await connection.execute(`
            SELECT pr.id, pr.patientId, pr.medication_name, pr.created_at,
                   p.firstName, p.lastName 
            FROM prescription_records pr 
            LEFT JOIN patients p ON pr.patientId = p.id 
            ORDER BY pr.created_at DESC
        `);
        
        console.log(`Found ${prescriptions.length} prescription records:`);
        prescriptions.forEach(prescription => {
            console.log(`  - ID: ${prescription.id}, Patient: ${prescription.firstName} ${prescription.lastName}, Medication: ${prescription.medication_name}, Date: ${prescription.created_at}`);
        });
        
        // 3. Ask for confirmation before deleting
        console.log('\n⚠️  WARNING: This will DELETE the above records!');
        console.log('📝 Please review the data above carefully.');
        console.log('🔄 If you want to proceed, modify this script to set CONFIRM_DELETE = true');
        
        const CONFIRM_DELETE = false; // Set to true to actually delete
        
        if (!CONFIRM_DELETE) {
            console.log('\n❌ Deletion not confirmed. No data was deleted.');
            console.log('   To proceed: Edit this script and set CONFIRM_DELETE = true');
            await connection.rollback();
            return;
        }
        
        // 4. Delete prescription records first (foreign key constraints)
        if (prescriptions.length > 0) {
            console.log('\n🗑️  Deleting prescription records...');
            const [prescriptionResult] = await connection.execute(`
                DELETE FROM prescription_records 
                WHERE id IN (${prescriptions.map(p => p.id).join(',')})
            `);
            console.log(`✅ Deleted ${prescriptionResult.affectedRows} prescription records`);
        }
        
        // 5. Delete medical records
        if (records.length > 0) {
            console.log('\n🗑️  Deleting medical records...');
            const [medicalResult] = await connection.execute(`
                DELETE FROM medicalrecords 
                WHERE id IN (${records.map(r => r.id).join(',')})
            `);
            console.log(`✅ Deleted ${medicalResult.affectedRows} medical records`);
        }
        
        // 6. Commit transaction
        await connection.commit();
        console.log('\n✅ Cleanup completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Error during cleanup:', error.message);
        await connection.rollback();
        console.log('🔄 Transaction rolled back - no data was deleted');
    } finally {
        await connection.end();
    }
}

// Add a safety check
if (require.main === module) {
    console.log('🛡️  SAFETY CHECK: This script will show you what data exists');
    console.log('📋 Review the output carefully before enabling deletion\n');
    cleanupOldCheckups().catch(console.error);
}

module.exports = cleanupOldCheckups;
