const axios = require('axios');

async function testPatientLogin() {
    try {
        console.log('🔍 Testing patient login...\n');
        
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            login: 'jojojosuke@gmail.com',
            password: '21-02-1992'
        });

        console.log('✅ Login successful!');
        console.log('User object returned:');
        console.log(JSON.stringify(response.data.user, null, 2));
        console.log('\npatientId:', response.data.user.patientId || 'MISSING');
        
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data?.msg || error.message);
    }
}

testPatientLogin();
