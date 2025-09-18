require('dotenv').config();
const mysql = require('mysql2/promise');

async function viewCurrentData() {
    console.log('📊 Viewing current checkup data (ongoing and history sections)...\n');
    
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hrsm'
    });
    
    try {
        // 1. Show all medical records with patient details
        console.log('🏥 MEDICAL RECORDS (Checkups):');
        console.log('=' .repeat(80));
        
        const [records] = await connection.execute(`
            SELECT 
                mr.id,
                mr.patientId,
                p.firstName,
                p.lastName,
                p.contactNumber,
                mr.chiefComplaint,
                mr.diagnosis,
                mr.treatment,
                mr.prescription,
                mr.notes,
                mr.visitDate,
                mr.createdAt,
                mr.updatedAt
            FROM medicalrecords mr 
            LEFT JOIN patients p ON mr.patientId = p.id 
            ORDER BY mr.createdAt DESC
        `);
        
        if (records.length === 0) {
            console.log('📝 No medical records found.');
        } else {
            records.forEach((record, index) => {
                console.log(`\n📋 Record ${index + 1}:`);
                console.log(`   ID: ${record.id}`);
                console.log(`   Patient: ${record.firstName} ${record.lastName} (ID: ${record.patientId})`);
                console.log(`   Contact: ${record.contactNumber}`);
                console.log(`   Visit Date: ${record.visitDate}`);
                console.log(`   Chief Complaint: ${record.chiefComplaint || 'N/A'}`);
                console.log(`   Diagnosis: ${record.diagnosis || 'N/A'}`);
                console.log(`   Treatment: ${record.treatment || 'N/A'}`);
                console.log(`   Prescription: ${record.prescription || 'N/A'}`);
                console.log(`   Notes: ${record.notes || 'N/A'}`);
                console.log(`   Created: ${record.createdAt}`);
                console.log(`   Updated: ${record.updatedAt}`);
            });
        }
        
        // 2. Show all prescription records
        console.log('\n\n💊 PRESCRIPTION RECORDS:');
        console.log('=' .repeat(80));
        
        const [prescriptions] = await connection.execute(`
            SELECT 
                pr.id,
                pr.patientId,
                p.firstName,
                p.lastName,
                pr.medications,
                pr.status,
                pr.dateIssued,
                pr.createdAt
            FROM prescription_records pr 
            LEFT JOIN patients p ON pr.patientId = p.id 
            ORDER BY pr.createdAt DESC
        `);
        
        if (prescriptions.length === 0) {
            console.log('📝 No prescription records found.');
        } else {
            prescriptions.forEach((prescription, index) => {
                console.log(`\n💊 Prescription ${index + 1}:`);
                console.log(`   ID: ${prescription.id}`);
                console.log(`   Patient: ${prescription.firstName} ${prescription.lastName} (ID: ${prescription.patientId})`);
                console.log(`   Medications: ${prescription.medications || 'N/A'}`);
                console.log(`   Status: ${prescription.status}`);
                console.log(`   Date Issued: ${prescription.dateIssued}`);
                console.log(`   Created: ${prescription.createdAt}`);
            });
        }
        
        // 3. Show appointments that might be related to ongoing checkups
        console.log('\n\n📅 RECENT APPOINTMENTS:');
        console.log('=' .repeat(80));
        
        const [appointments] = await connection.execute(`
            SELECT 
                a.id,
                a.patientId,
                p.firstName,
                p.lastName,
                a.status,
                a.type,
                a.appointmentDate,
                a.createdAt,
                a.updatedAt
            FROM appointments a 
            LEFT JOIN patients p ON a.patientId = p.id 
            ORDER BY a.createdAt DESC
            LIMIT 10
        `);
        
        if (appointments.length === 0) {
            console.log('📝 No appointments found.');
        } else {
            appointments.forEach((appointment, index) => {
                console.log(`\n📅 Appointment ${index + 1}:`);
                console.log(`   ID: ${appointment.id}`);
                console.log(`   Patient: ${appointment.firstName} ${appointment.lastName} (ID: ${appointment.patientId})`);
                console.log(`   Status: ${appointment.status}`);
                console.log(`   Type: ${appointment.type || 'N/A'}`);
                console.log(`   Appointment Date: ${appointment.appointmentDate}`);
                console.log(`   Created: ${appointment.createdAt}`);
                console.log(`   Updated: ${appointment.updatedAt}`);
            });
        }
        
        // 4. Summary
        console.log('\n\n📊 SUMMARY:');
        console.log('=' .repeat(40));
        console.log(`Total Medical Records: ${records.length}`);
        console.log(`Total Prescriptions: ${prescriptions.length}`);
        console.log(`Recent Appointments: ${appointments.length}`);
        
        console.log('\n💡 NEXT STEPS:');
        console.log('1. Review the data above');
        console.log('2. Identify which records are old test data');
        console.log('3. Use cleanup-specific-records.js to delete by ID');
        console.log('4. Or use cleanup-old-test-data.js to delete by pattern/date');
        
    } catch (error) {
        console.error('\n❌ Error viewing data:', error.message);
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    viewCurrentData().catch(console.error);
}

module.exports = viewCurrentData;
