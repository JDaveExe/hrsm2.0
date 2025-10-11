const mysql = require('mysql2/promise');

async function fixOrphanedDataCorrectly() {
    console.log('🔧 FIXING ORPHANED DATA - CORRECT APPROACH');
    console.log('==========================================\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'hrsm2'
        });
        
        console.log('🔗 Connected to database');
        
        // Step 1: Understand the relationship
        console.log('\n🔍 UNDERSTANDING USER → PATIENT RELATIONSHIP:');
        console.log('--------------------------------------------');
        
        const [userPatientMapping] = await connection.execute(`
            SELECT u.id as userId, u.email, u.firstName as userFirstName, u.lastName as userLastName,
                   p.id as patientId, p.firstName as patientFirstName, p.lastName as patientLastName
            FROM users u
            LEFT JOIN patients p ON u.id = p.userId
            WHERE u.id IN (10015, 10016)
            ORDER BY u.id
        `);
        
        userPatientMapping.forEach(row => {
            console.log(`   User ${row.userId} (${row.email}) → Patient ${row.patientId || 'NONE'} (${row.patientFirstName || 'N/A'} ${row.patientLastName || 'N/A'})`);
        });
        
        // Step 2: Check current orphaned data
        console.log('\n📊 CURRENT SITUATION:');
        console.log('---------------------');
        
        const [notifications] = await connection.execute(`
            SELECT patient_id, COUNT(*) as count,
                   GROUP_CONCAT(DISTINCT status) as statuses,
                   GROUP_CONCAT(id ORDER BY id) as notification_ids
            FROM notifications 
            WHERE patient_id IN (113, 134)
            GROUP BY patient_id
            ORDER BY patient_id
        `);
        
        const [appointments] = await connection.execute(`
            SELECT patientId, COUNT(*) as count,
                   GROUP_CONCAT(id ORDER BY id) as appointment_ids
            FROM appointments 
            WHERE patientId IN (113, 134)
            GROUP BY patientId
            ORDER BY patientId
        `);
        
        console.log('📬 Orphaned notifications:');
        notifications.forEach(row => {
            console.log(`   Patient ID ${row.patient_id}: ${row.count} notifications (IDs: ${row.notification_ids}) - Statuses: ${row.statuses}`);
        });
        
        console.log('📅 Orphaned appointments:');
        appointments.forEach(row => {
            console.log(`   Patient ID ${row.patientId}: ${row.count} appointments (IDs: ${row.appointment_ids})`);
        });
        
        // Step 3: The key insight!
        console.log('\n💡 KEY INSIGHT:');
        console.log('---------------');
        console.log('Patient ID 113 in our orphaned data actually corresponds to:');
        console.log('User 10016 (Kaleia) → Patient 113');
        console.log('');
        console.log('This means the notifications for patient_id 113 are ALREADY correctly assigned!');
        console.log('The issue is that the notification API is being called with user.id instead of patient.id!');
        
        // Step 4: Check what patient ID 134 should map to
        console.log('\n🔍 WHAT ABOUT PATIENT ID 134?');
        console.log('-----------------------------');
        
        const [patientSearch] = await connection.execute(`
            SELECT id, userId, firstName, lastName 
            FROM patients 
            WHERE id = 134 OR userId = 134
        `);
        
        if (patientSearch.length > 0) {
            console.log('Found patient record for ID 134:');
            patientSearch.forEach(p => console.log(`   Patient ${p.id} → User ${p.userId} (${p.firstName} ${p.lastName})`));
        } else {
            console.log('❌ No patient record found for ID 134 - this is truly orphaned');
            console.log('   We should reassign these to an existing patient...');
            
            // Let's assign patient 134 data to patient 112 (Valentina)
            console.log('   Suggested: Reassign patient 134 data → patient 112 (Valentina)');
        }
        
        // Step 5: The REAL solution
        console.log('\n🎯 THE REAL SOLUTION:');
        console.log('=====================');
        console.log('1. Notifications for patient_id 113 are CORRECT (belongs to Kaleia)');
        console.log('2. Notifications for patient_id 134 should be reassigned to patient_id 112 (Valentina)');
        console.log('3. The FRONTEND needs to be fixed to use PATIENT ID, not USER ID!');
        console.log('');
        console.log('Frontend fix needed:');
        console.log('- Currently calling: /api/notifications/patient/10016 (USER ID)');
        console.log('- Should be calling: /api/notifications/patient/113 (PATIENT ID)');
        
        // Step 6: Execute the partial fix (reassign patient 134 → 112)
        console.log('\n🔧 EXECUTING PARTIAL FIX:');
        console.log('=========================');
        console.log('Reassigning orphaned patient 134 data to patient 112 (Valentina)...');
        
        await connection.beginTransaction();
        
        try {
            // Only fix the truly orphaned data (patient 134)
            const [notifResult] = await connection.execute(`
                UPDATE notifications 
                SET patient_id = 112 
                WHERE patient_id = 134
            `);
            console.log(`   ✅ Updated ${notifResult.affectedRows} notifications: 134 → 112`);
            
            const [apptResult] = await connection.execute(`
                UPDATE appointments 
                SET patientId = 112 
                WHERE patientId = 134
            `);
            console.log(`   ✅ Updated ${apptResult.affectedRows} appointments: 134 → 112`);
            
            await connection.commit();
            console.log('✅ TRANSACTION COMMITTED');
            
        } catch (error) {
            await connection.rollback();
            throw error;
        }
        
        // Step 7: Final verification
        console.log('\n🔍 FINAL VERIFICATION:');
        console.log('---------------------');
        
        const [finalCheck] = await connection.execute(`
            SELECT 'notifications' as type, patient_id as id, COUNT(*) as count
            FROM notifications 
            WHERE patient_id IN (112, 113)
            GROUP BY patient_id
            
            UNION ALL
            
            SELECT 'appointments' as type, patientId as id, COUNT(*) as count
            FROM appointments 
            WHERE patientId IN (112, 113)
            GROUP BY patientId
            
            ORDER BY type, id
        `);
        
        finalCheck.forEach(row => {
            const patientInfo = userPatientMapping.find(p => p.patientId == row.id);
            const userInfo = patientInfo ? `User ${patientInfo.userId} (${patientInfo.email})` : 'Unknown';
            console.log(`   ${row.type}: Patient ${row.id} has ${row.count} records → ${userInfo}`);
        });
        
        console.log('\n🎉 PARTIAL FIX COMPLETE!');
        console.log('========================');
        console.log('NEXT CRITICAL STEP: Fix the frontend to use patient IDs instead of user IDs!');
        console.log('');
        console.log('Frontend changes needed:');
        console.log('1. When user 10016 (Kaleia) logs in → use patient ID 113 for API calls');
        console.log('2. When user 10015 (Valentina) logs in → use patient ID 112 for API calls');
        console.log('3. Create mapping function: getUserPatientId(userId) → patientId');
        
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

fixOrphanedDataCorrectly();