require('dotenv').config();
const mysql = require('mysql2/promise');

async function cleanupOldTestData() {
    console.log('🧹 Starting cleanup of old test data in ongoing and history sections...\n');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hrsm'
    });
    
    try {
        // Start transaction for safety
        await connection.beginTransaction();
        
        // 1. Find old test data (more than 30 days old or with test patterns)
        console.log('🔍 Finding old test data...');
        
        // Check for medical records older than 30 days or with test patterns
        const [oldRecords] = await connection.execute(`
            SELECT mr.id, mr.patientId, mr.created_at, mr.diagnosis, mr.treatment_plan,
                   p.firstName, p.lastName, p.contactNumber
            FROM medicalrecords mr 
            LEFT JOIN patients p ON mr.patientId = p.id 
            WHERE 
                mr.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
                OR mr.diagnosis LIKE '%test%'
                OR mr.diagnosis LIKE '%debug%'
                OR mr.treatment_plan LIKE '%test%'
                OR p.firstName LIKE '%test%'
                OR p.lastName LIKE '%test%'
                OR p.firstName LIKE '%debug%'
            ORDER BY mr.created_at DESC
        `);
        
        console.log(`📋 Found ${oldRecords.length} old medical records:`);
        oldRecords.forEach(record => {
            console.log(`  - ID: ${record.id}, Patient: ${record.firstName} ${record.lastName}`);
            console.log(`    Date: ${record.created_at}, Diagnosis: ${record.diagnosis}`);
        });
        
        // Check for old prescription records
        const [oldPrescriptions] = await connection.execute(`
            SELECT pr.id, pr.patientId, pr.medication_name, pr.created_at,
                   p.firstName, p.lastName
            FROM prescription_records pr 
            LEFT JOIN patients p ON pr.patientId = p.id 
            WHERE 
                pr.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
                OR pr.medication_name LIKE '%test%'
                OR p.firstName LIKE '%test%'
                OR p.lastName LIKE '%test%'
                OR p.firstName LIKE '%debug%'
            ORDER BY pr.created_at DESC
        `);
        
        console.log(`\n💊 Found ${oldPrescriptions.length} old prescription records:`);
        oldPrescriptions.forEach(prescription => {
            console.log(`  - ID: ${prescription.id}, Patient: ${prescription.firstName} ${prescription.lastName}`);
            console.log(`    Medication: ${prescription.medication_name}, Date: ${prescription.created_at}`);
        });
        
        // Check for appointments that might be related
        const [oldAppointments] = await connection.execute(`
            SELECT a.id, a.patientId, a.status, a.created_at,
                   p.firstName, p.lastName
            FROM appointments a 
            LEFT JOIN patients p ON a.patientId = p.id 
            WHERE 
                a.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
                OR p.firstName LIKE '%test%'
                OR p.lastName LIKE '%test%'
                OR p.firstName LIKE '%debug%'
            ORDER BY a.created_at DESC
        `);
        
        console.log(`\n📅 Found ${oldAppointments.length} old appointments:`);
        oldAppointments.forEach(appointment => {
            console.log(`  - ID: ${appointment.id}, Patient: ${appointment.firstName} ${appointment.lastName}`);
            console.log(`    Status: ${appointment.status}, Date: ${appointment.created_at}`);
        });
        
        // Safety confirmation
        const CONFIRM_DELETE = false; // Set to true to actually delete
        
        if (!CONFIRM_DELETE) {
            console.log('\n⚠️  REVIEW MODE - No data will be deleted');
            console.log('📝 To actually delete this data, set CONFIRM_DELETE = true in the script');
            await connection.rollback();
            return;
        }
        
        console.log('\n🗑️  DELETION CONFIRMED - Proceeding with cleanup...');
        
        // Delete in proper order (foreign key constraints)
        let deletedCount = 0;
        
        // 1. Delete old prescription records
        if (oldPrescriptions.length > 0) {
            const prescriptionIds = oldPrescriptions.map(p => p.id);
            const [prescriptionResult] = await connection.execute(`
                DELETE FROM prescription_records 
                WHERE id IN (${prescriptionIds.join(',')})
            `);
            deletedCount += prescriptionResult.affectedRows;
            console.log(`✅ Deleted ${prescriptionResult.affectedRows} prescription records`);
        }
        
        // 2. Delete old medical records
        if (oldRecords.length > 0) {
            const recordIds = oldRecords.map(r => r.id);
            const [medicalResult] = await connection.execute(`
                DELETE FROM medicalrecords 
                WHERE id IN (${recordIds.join(',')})
            `);
            deletedCount += medicalResult.affectedRows;
            console.log(`✅ Deleted ${medicalResult.affectedRows} medical records`);
        }
        
        // 3. Delete old appointments (if any)
        if (oldAppointments.length > 0) {
            const appointmentIds = oldAppointments.map(a => a.id);
            const [appointmentResult] = await connection.execute(`
                DELETE FROM appointments 
                WHERE id IN (${appointmentIds.join(',')})
            `);
            deletedCount += appointmentResult.affectedRows;
            console.log(`✅ Deleted ${appointmentResult.affectedRows} appointments`);
        }
        
        // Commit transaction
        await connection.commit();
        console.log(`\n✅ Cleanup completed! Total records deleted: ${deletedCount}`);
        
    } catch (error) {
        console.error('\n❌ Error during cleanup:', error.message);
        await connection.rollback();
        console.log('🔄 Transaction rolled back - no data was deleted');
    } finally {
        await connection.end();
    }
}

// Safety wrapper
if (require.main === module) {
    console.log('🛡️  SAFETY MODE: This script will first show you what would be deleted');
    console.log('📋 Review the output carefully before enabling deletion\n');
    cleanupOldTestData().catch(console.error);
}

module.exports = cleanupOldTestData;
