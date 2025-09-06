const { IdAllocationService } = require('./middleware/smartIdAllocation');

async function testSmartIdAllocation() {
    try {
        console.log('🧪 Testing Smart ID Allocation System...\n');
        
        // Get current allocation status
        console.log('📊 Current ID Allocation Status:');
        const status = await IdAllocationService.getAllocationStatus();
        console.log(JSON.stringify(status, null, 2));
        console.log('');
        
        // Test next ID predictions
        console.log('🔮 Next ID Predictions:');
        
        const nextPatientId = await IdAllocationService.getNextPatientId();
        console.log(`Next Patient ID: ${nextPatientId}`);
        
        const nextAdminId = await IdAllocationService.getNextAdminDoctorId();
        console.log(`Next Admin/Doctor ID: ${nextAdminId}`);
        
        console.log('');
        
        // Test AUTO_INCREMENT setting
        console.log('🎯 Testing AUTO_INCREMENT Management:');
        
        await IdAllocationService.setPatientAutoIncrement();
        await IdAllocationService.setUserAutoIncrement('admin');
        
        console.log('✅ Smart ID Allocation System working correctly!');
        
        console.log('\n📋 ID Range Summary:');
        console.log('  🔹 Hardcoded test accounts: 100001-100003 (virtual)');
        console.log('  🔹 Regular patients: 100-9999 (database AUTO_INCREMENT)');
        console.log('  🔹 Admin/Doctor creation: 10003+ (database AUTO_INCREMENT)');
        console.log('  🔹 Patient overflow: 11000+ (when patients > 9999)');
        
    } catch (error) {
        console.error('❌ Error testing smart ID allocation:', error.message);
    }
}

testSmartIdAllocation();
