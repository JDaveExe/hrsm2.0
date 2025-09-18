require('dotenv').config();
const mysql = require('mysql2/promise');

async function deleteSpecificRecords() {
    console.log('🎯 Targeted deletion of specific records...\n');
    
    // CONFIGURE THESE ARRAYS WITH THE IDs YOU WANT TO DELETE
    const MEDICAL_RECORD_IDS = []; // e.g., [1, 2, 3]
    const PRESCRIPTION_IDS = []; // e.g., [1, 2, 3]
    const APPOINTMENT_IDS = []; // e.g., [1, 2, 3]
    
    // SAFETY SWITCH - Set to true to actually delete
    const CONFIRM_DELETE = false;
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hrsm'
    });
    
    try {
        if (MEDICAL_RECORD_IDS.length === 0 && PRESCRIPTION_IDS.length === 0 && APPOINTMENT_IDS.length === 0) {
            console.log('📝 No IDs specified for deletion.');
            console.log('💡 Edit this script and add the IDs you want to delete to the arrays at the top.');
            console.log('   Example: const MEDICAL_RECORD_IDS = [1, 2, 3];');
            return;
        }
        
        // Show what will be deleted
        console.log('🔍 Records targeted for deletion:');
        
        if (MEDICAL_RECORD_IDS.length > 0) {
            console.log(`📋 Medical Records: ${MEDICAL_RECORD_IDS.join(', ')}`);
            
            const [records] = await connection.execute(`
                SELECT mr.id, mr.patientId, p.firstName, p.lastName, mr.diagnosis, mr.created_at
                FROM medicalrecords mr 
                LEFT JOIN patients p ON mr.patientId = p.id 
                WHERE mr.id IN (${MEDICAL_RECORD_IDS.join(',')})
            `);
            
            records.forEach(record => {
                console.log(`   - ID ${record.id}: ${record.firstName} ${record.lastName}, ${record.diagnosis}, ${record.created_at}`);
            });
        }
        
        if (PRESCRIPTION_IDS.length > 0) {
            console.log(`💊 Prescriptions: ${PRESCRIPTION_IDS.join(', ')}`);
            
            const [prescriptions] = await connection.execute(`
                SELECT pr.id, pr.patientId, p.firstName, p.lastName, pr.medication_name, pr.created_at
                FROM prescription_records pr 
                LEFT JOIN patients p ON pr.patientId = p.id 
                WHERE pr.id IN (${PRESCRIPTION_IDS.join(',')})
            `);
            
            prescriptions.forEach(prescription => {
                console.log(`   - ID ${prescription.id}: ${prescription.firstName} ${prescription.lastName}, ${prescription.medication_name}, ${prescription.created_at}`);
            });
        }
        
        if (APPOINTMENT_IDS.length > 0) {
            console.log(`📅 Appointments: ${APPOINTMENT_IDS.join(', ')}`);
            
            const [appointments] = await connection.execute(`
                SELECT a.id, a.patientId, p.firstName, p.lastName, a.status, a.created_at
                FROM appointments a 
                LEFT JOIN patients p ON a.patientId = p.id 
                WHERE a.id IN (${APPOINTMENT_IDS.join(',')})
            `);
            
            appointments.forEach(appointment => {
                console.log(`   - ID ${appointment.id}: ${appointment.firstName} ${appointment.lastName}, ${appointment.status}, ${appointment.created_at}`);
            });
        }
        
        if (!CONFIRM_DELETE) {
            console.log('\n⚠️  SAFETY MODE - No deletion performed');
            console.log('📝 To actually delete these records, set CONFIRM_DELETE = true');
            return;
        }
        
        // Start transaction
        await connection.beginTransaction();
        
        let totalDeleted = 0;
        
        // Delete in proper order (foreign key constraints)
        
        // 1. Delete prescriptions
        if (PRESCRIPTION_IDS.length > 0) {
            console.log('\n🗑️  Deleting prescription records...');
            const [result] = await connection.execute(`
                DELETE FROM prescription_records 
                WHERE id IN (${PRESCRIPTION_IDS.join(',')})
            `);
            totalDeleted += result.affectedRows;
            console.log(`✅ Deleted ${result.affectedRows} prescription records`);
        }
        
        // 2. Delete medical records
        if (MEDICAL_RECORD_IDS.length > 0) {
            console.log('\n🗑️  Deleting medical records...');
            const [result] = await connection.execute(`
                DELETE FROM medicalrecords 
                WHERE id IN (${MEDICAL_RECORD_IDS.join(',')})
            `);
            totalDeleted += result.affectedRows;
            console.log(`✅ Deleted ${result.affectedRows} medical records`);
        }
        
        // 3. Delete appointments
        if (APPOINTMENT_IDS.length > 0) {
            console.log('\n🗑️  Deleting appointments...');
            const [result] = await connection.execute(`
                DELETE FROM appointments 
                WHERE id IN (${APPOINTMENT_IDS.join(',')})
            `);
            totalDeleted += result.affectedRows;
            console.log(`✅ Deleted ${result.affectedRows} appointments`);
        }
        
        // Commit transaction
        await connection.commit();
        console.log(`\n✅ Deletion completed! Total records deleted: ${totalDeleted}`);
        
    } catch (error) {
        console.error('\n❌ Error during deletion:', error.message);
        await connection.rollback();
        console.log('🔄 Transaction rolled back - no data was deleted');
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    deleteSpecificRecords().catch(console.error);
}

module.exports = deleteSpecificRecords;
