const mysql = require('mysql2/promise');

async function analyzeDatabasePatientIDs() {
    console.log('🔍 ANALYZING CURRENT DATABASE PATIENT ID STATE');
    console.log('==============================================\n');
    
    let connection;
    try {
        // Database connection
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'hrsm2'
        });
        
        // 1. Analyze users/patients table
        console.log('👥 USERS TABLE ANALYSIS:');
        console.log('------------------------');
        
        const [users] = await connection.execute(`
            SELECT id, email, role, firstName, lastName, createdAt 
            FROM users 
            ORDER BY role, id
        `);
        
        const adminUsers = users.filter(u => ['admin', 'doctor', 'management'].includes(u.role));
        const patientUsers = users.filter(u => u.role === 'patient');
        
        console.log(`📊 Total users: ${users.length}`);
        console.log(`🔐 Admin/Doctor/Management: ${adminUsers.length}`);
        console.log(`👤 Patients: ${patientUsers.length}`);
        
        console.log('\n🔐 ADMIN/DOCTOR/MANAGEMENT ACCOUNTS (PRESERVE THESE):');
        adminUsers.forEach(user => {
            console.log(`   ID: ${user.id} | ${user.email} | ${user.role} | ${user.firstName} ${user.lastName}`);
        });
        
        console.log('\n👤 PATIENT ACCOUNTS (POTENTIAL PURGE CANDIDATES):');
        patientUsers.forEach(user => {
            console.log(`   ID: ${user.id} | ${user.email} | ${user.firstName} ${user.lastName} | Created: ${user.createdAt}`);
        });
        
        // 2. Analyze notifications table
        console.log('\n📬 NOTIFICATIONS TABLE ANALYSIS:');
        console.log('-------------------------------');
        
        const [notifications] = await connection.execute(`
            SELECT patient_id, COUNT(*) as count, 
                   GROUP_CONCAT(DISTINCT status) as statuses
            FROM notifications 
            GROUP BY patient_id
            ORDER BY patient_id
        `);
        
        console.log(`📊 Patients with notifications: ${notifications.length}`);
        notifications.forEach(notif => {
            const userInfo = users.find(u => u.id == notif.patient_id) || { email: 'UNKNOWN', role: 'UNKNOWN' };
            console.log(`   Patient ID: ${notif.patient_id} | ${notif.count} notifications | Statuses: ${notif.statuses} | User: ${userInfo.email} (${userInfo.role})`);
        });
        
        // 3. Analyze appointments table
        console.log('\n📅 APPOINTMENTS TABLE ANALYSIS:');
        console.log('------------------------------');
        
        const [appointments] = await connection.execute(`
            SELECT patientId, COUNT(*) as count,
                   GROUP_CONCAT(DISTINCT status) as statuses
            FROM appointments 
            GROUP BY patientId
            ORDER BY patientId
        `);
        
        console.log(`📊 Patients with appointments: ${appointments.length}`);
        appointments.forEach(appt => {
            const userInfo = users.find(u => u.id == appt.patientId) || { email: 'UNKNOWN', role: 'UNKNOWN' };
            console.log(`   Patient ID: ${appt.patientId} | ${appt.count} appointments | Statuses: ${appt.statuses} | User: ${userInfo.email} (${userInfo.role})`);
        });
        
        // 4. Check for ID mismatches
        console.log('\n⚠️  ID MISMATCH ANALYSIS:');
        console.log('------------------------');
        
        const notificationPatientIds = new Set(notifications.map(n => parseInt(n.patient_id)));
        const appointmentPatientIds = new Set(appointments.map(a => parseInt(a.patientId)));
        const actualPatientIds = new Set(patientUsers.map(u => parseInt(u.id)));
        
        console.log('🔍 Notification patient_ids:', Array.from(notificationPatientIds).sort());
        console.log('🔍 Appointment patientIds:', Array.from(appointmentPatientIds).sort());
        console.log('🔍 Actual patient IDs:', Array.from(actualPatientIds).sort());
        
        // Find orphaned records
        const orphanedNotifications = Array.from(notificationPatientIds).filter(id => !actualPatientIds.has(id));
        const orphanedAppointments = Array.from(appointmentPatientIds).filter(id => !actualPatientIds.has(id));
        
        if (orphanedNotifications.length > 0) {
            console.log('❌ ORPHANED NOTIFICATIONS (no matching patient):', orphanedNotifications);
        }
        
        if (orphanedAppointments.length > 0) {
            console.log('❌ ORPHANED APPOINTMENTS (no matching patient):', orphanedAppointments);
        }
        
        // 5. localStorage analysis recommendation
        console.log('\n💾 LOCALSTORAGE ANALYSIS NEEDED:');
        console.log('-------------------------------');
        console.log('Current localStorage patientId appears to be: 10015');
        console.log('But this ID does not exist in our patient records!');
        console.log('');
        console.log('Recommendation:');
        console.log('1. Clear localStorage completely');
        console.log('2. Purge patient records and start fresh');
        console.log('3. Create new test patients with IDs 1, 2, 3...');
        console.log('4. Implement proper ID management');
        
        // 6. Generate purge script preview
        console.log('\n🧹 SUGGESTED PURGE COMMANDS (PREVIEW ONLY):');
        console.log('==========================================');
        
        const preserveIds = adminUsers.map(u => u.id);
        console.log(`-- Preserve these admin IDs: ${preserveIds.join(', ')}`);
        console.log('');
        console.log('-- PREVIEW OF PURGE COMMANDS (DO NOT RUN YET):');
        console.log('DELETE FROM notifications WHERE patient_id NOT IN (' + preserveIds.join(', ') + ');');
        console.log('DELETE FROM appointments WHERE patientId NOT IN (' + preserveIds.join(', ') + ');');
        console.log('DELETE FROM users WHERE role = "patient";');
        console.log('');
        console.log('-- Reset auto increment:');
        console.log('ALTER TABLE users AUTO_INCREMENT = ' + (Math.max(...preserveIds) + 1) + ';');
        
        console.log('\n✅ ANALYSIS COMPLETE');
        console.log('====================');
        console.log('Next step: Review the analysis above and confirm purge strategy');
        
    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

analyzeDatabasePatientIDs();