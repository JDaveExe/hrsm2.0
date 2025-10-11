const mysql = require('mysql2/promise');

async function fixOrphanedPatientData() {
    console.log('🔧 FIXING ORPHANED PATIENT DATA');
    console.log('===============================\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'hrsm2'
        });
        
        console.log('🔗 Connected to database');
        
        // Step 1: Show current orphaned data
        console.log('\n📊 CURRENT ORPHANED DATA:');
        console.log('-------------------------');
        
        const [notifications] = await connection.execute(`
            SELECT id, patient_id, title, status, created_at 
            FROM notifications 
            WHERE patient_id IN (113, 134)
            ORDER BY patient_id, id
        `);
        
        const [appointments] = await connection.execute(`
            SELECT id, patientId, appointmentDate, appointmentTime, status
            FROM appointments 
            WHERE patientId IN (113, 134)
            ORDER BY patientId, id
        `);
        
        console.log(`📬 Orphaned notifications: ${notifications.length}`);
        notifications.forEach(notif => {
            console.log(`   ID: ${notif.id} | Patient: ${notif.patient_id} | "${notif.title}" | ${notif.status}`);
        });
        
        console.log(`📅 Orphaned appointments: ${appointments.length}`);
        appointments.forEach(appt => {
            console.log(`   ID: ${appt.id} | Patient: ${appt.patientId} | ${appt.appointmentDate} ${appt.appointmentTime} | ${appt.status}`);
        });
        
        // Step 2: Show target patients
        console.log('\n🎯 TARGET PATIENTS (existing accounts):');
        console.log('-------------------------------------');
        
        const [targetPatients] = await connection.execute(`
            SELECT id, email, firstName, lastName 
            FROM users 
            WHERE id IN (10015, 10016) AND role = 'patient'
            ORDER BY id
        `);
        
        targetPatients.forEach(patient => {
            console.log(`   ID: ${patient.id} | ${patient.email} | ${patient.firstName} ${patient.lastName}`);
        });
        
        if (targetPatients.length !== 2) {
            throw new Error('Target patients (10015, 10016) not found or not patients!');
        }
        
        // Step 3: Confirm before proceeding
        console.log('\n🔄 PROPOSED CHANGES:');
        console.log('-------------------');
        console.log('1. Notifications with patient_id 113 → reassign to 10015 (Valentina Laurel)');
        console.log('2. Notifications with patient_id 134 → reassign to 10016 (Kaleia Aris)'); 
        console.log('3. Appointments with patientId 113 → reassign to 10015 (Valentina Laurel)');
        console.log('4. Appointments with patientId 134 → reassign to 10016 (Kaleia Aris)');
        
        console.log('\n⚠️  This will make these notifications/appointments visible to the target patients!');
        console.log('⚠️  Continue? (This script will proceed automatically in 3 seconds...)\n');
        
        // Wait 3 seconds for user to cancel if needed
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 4: Execute fixes
        console.log('🔧 EXECUTING FIXES...');
        console.log('=====================');
        
        // Start transaction
        await connection.beginTransaction();
        
        try {
            // Fix notifications
            console.log('📬 Fixing notifications...');
            
            const [notifResult1] = await connection.execute(`
                UPDATE notifications 
                SET patient_id = 10015 
                WHERE patient_id = 113
            `);
            console.log(`   ✅ Updated ${notifResult1.affectedRows} notifications: 113 → 10015`);
            
            const [notifResult2] = await connection.execute(`
                UPDATE notifications 
                SET patient_id = 10016 
                WHERE patient_id = 134
            `);
            console.log(`   ✅ Updated ${notifResult2.affectedRows} notifications: 134 → 10016`);
            
            // Fix appointments
            console.log('📅 Fixing appointments...');
            
            const [apptResult1] = await connection.execute(`
                UPDATE appointments 
                SET patientId = 10015 
                WHERE patientId = 113
            `);
            console.log(`   ✅ Updated ${apptResult1.affectedRows} appointments: 113 → 10015`);
            
            const [apptResult2] = await connection.execute(`
                UPDATE appointments 
                SET patientId = 10016 
                WHERE patientId = 134
            `);
            console.log(`   ✅ Updated ${apptResult2.affectedRows} appointments: 134 → 10016`);
            
            // Commit transaction
            await connection.commit();
            console.log('\n✅ TRANSACTION COMMITTED - ALL CHANGES SAVED');
            
        } catch (error) {
            await connection.rollback();
            throw error;
        }
        
        // Step 5: Verify fixes
        console.log('\n🔍 VERIFICATION:');
        console.log('---------------');
        
        const [verifyNotifications] = await connection.execute(`
            SELECT patient_id, COUNT(*) as count
            FROM notifications 
            WHERE patient_id IN (10015, 10016)
            GROUP BY patient_id
            ORDER BY patient_id
        `);
        
        const [verifyAppointments] = await connection.execute(`
            SELECT patientId, COUNT(*) as count
            FROM appointments 
            WHERE patientId IN (10015, 10016)
            GROUP BY patientId
            ORDER BY patientId
        `);
        
        console.log('📬 Notifications by patient:');
        verifyNotifications.forEach(row => {
            const patient = targetPatients.find(p => p.id == row.patient_id);
            console.log(`   Patient ${row.patient_id} (${patient?.firstName} ${patient?.lastName}): ${row.count} notifications`);
        });
        
        console.log('📅 Appointments by patient:');
        verifyAppointments.forEach(row => {
            const patient = targetPatients.find(p => p.id == row.patientId);
            console.log(`   Patient ${row.patientId} (${patient?.firstName} ${patient?.lastName}): ${row.count} appointments`);
        });
        
        // Step 6: Check for remaining orphaned data
        console.log('\n🔍 CHECKING FOR REMAINING ORPHANED DATA:');
        console.log('---------------------------------------');
        
        const [remainingOrphans] = await connection.execute(`
            SELECT 'notifications' as table_name, patient_id as orphan_id, COUNT(*) as count
            FROM notifications n
            LEFT JOIN users u ON n.patient_id = u.id
            WHERE u.id IS NULL
            GROUP BY patient_id
            
            UNION ALL
            
            SELECT 'appointments' as table_name, patientId as orphan_id, COUNT(*) as count
            FROM appointments a
            LEFT JOIN users u ON a.patientId = u.id
            WHERE u.id IS NULL
            GROUP BY patientId
        `);
        
        if (remainingOrphans.length > 0) {
            console.log('⚠️  REMAINING ORPHANED DATA FOUND:');
            remainingOrphans.forEach(orphan => {
                console.log(`   ${orphan.table_name}: ${orphan.count} records with orphan ID ${orphan.orphan_id}`);
            });
        } else {
            console.log('✅ NO REMAINING ORPHANED DATA - ALL CLEAN!');
        }
        
        console.log('\n🎉 FIX COMPLETE!');
        console.log('===============');
        console.log('Next steps:');
        console.log('1. Test login as valentina.laurel@email.com - should see notifications');
        console.log('2. Test login as kal@gmail.com - should see notifications');
        console.log('3. Verify notification display works in UI');
        console.log('4. Test accept/decline functionality');
        
    } catch (error) {
        console.error('❌ Fix failed:', error.message);
        if (connection) {
            try {
                await connection.rollback();
                console.log('🔄 Transaction rolled back');
            } catch (rollbackError) {
                console.error('❌ Rollback failed:', rollbackError.message);
            }
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

fixOrphanedPatientData();