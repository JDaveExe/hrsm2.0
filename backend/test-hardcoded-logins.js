const axios = require('axios');

async function testHardcodedLogins() {
    try {
        console.log('🔍 Testing hardcoded login accounts...\n');
        
        const testAccounts = [
            { login: 'admin', password: 'admin123', expectedId: 100001 },
            { login: 'doctor', password: 'doctor123', expectedId: 100002 },
            { login: 'patient', password: 'patient123', expectedId: 100003 }
        ];

        for (const account of testAccounts) {
            try {
                console.log(`Testing ${account.login}...`);
                const response = await axios.post('http://localhost:5000/api/auth/login', {
                    login: account.login,
                    password: account.password
                });

                const user = response.data.user;
                console.log(`✅ ${account.login} login SUCCESS`);
                console.log(`   ID: ${user.id} (expected: ${account.expectedId})`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Name: ${user.firstName} ${user.lastName}`);
                if (user.patientId) console.log(`   PatientId: ${user.patientId}`);
                console.log('');
                
            } catch (error) {
                console.log(`❌ ${account.login} login FAILED: ${error.response?.data?.msg || error.message}`);
                console.log('');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testHardcodedLogins();
