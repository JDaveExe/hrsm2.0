const axios = require('axios');

async function findJosukeCredentials() {
  console.log('🔍 Comprehensive search for Josuke login credentials...\n');

  const baseURL = 'http://localhost:5000';
  
  // Common username variations for Josuke
  const usernameVariations = [
    'jojojosuke@gmail.com',
    '09167674206',
    'josuke',
    'josuke.joestar',
    'joestar',
    'josuke@gmail.com',
    'jojojosuke',
    'patient',
    'Patient-40',
    'PAT-40',
    'Josuke',
    'JOSUKE'
  ];
  
  // Common password variations
  const passwordVariations = [
    'josuke123',
    'password',
    '123456',
    'josuke',
    'joestar',
    'patient123',
    'Josuke123',
    'josuke@123',
    '09167674206',
    'jojojosuke',
    '12345678',
    'qwerty',
    'admin123'
  ];

  console.log('🔑 Testing common credential combinations...\n');

  for (const username of usernameVariations) {
    for (const password of passwordVariations) {
      try {
        const response = await axios.post(`${baseURL}/api/auth/login`, {
          login: username,
          password: password
        });
        
        if (response.data.user) {
          console.log('🎉 SUCCESS! Found working credentials:');
          console.log(`   Username: ${username}`);
          console.log(`   Password: ${password}`);
          console.log(`   User ID: ${response.data.user.id}`);
          console.log(`   Patient ID: ${response.data.user.patientId}`);
          console.log(`   Name: ${response.data.user.firstName} ${response.data.user.lastName}`);
          console.log(`   Role: ${response.data.user.role}`);
          
          // Test if this gives us access to treatment records
          if (response.data.user.patientId) {
            try {
              const recordsResponse = await axios.get(`${baseURL}/api/checkups/history/${response.data.user.patientId}`, {
                headers: { Authorization: `Bearer ${response.data.token}` }
              });
              console.log(`   Treatment Records: ${recordsResponse.data.length} found`);
            } catch (recordError) {
              console.log(`   Treatment Records: Error - ${recordError.response?.data?.msg || recordError.message}`);
            }
          }
          
          return { username, password, user: response.data.user };
        }
        
      } catch (error) {
        // Continue trying other combinations
        // Only log if it's not a simple "Invalid credentials" error
        if (!error.response?.data?.msg?.includes('Invalid credentials')) {
          console.log(`❌ ${username}/${password}: ${error.response?.data?.msg || error.message}`);
        }
      }
    }
  }
  
  console.log('❌ No working credentials found with common combinations.');
  console.log('\n💡 Suggestions:');
  console.log('1. Check if credentials were generated with a different format');
  console.log('2. Look for any documentation with the actual credentials');
  console.log('3. Create new credentials for Josuke manually');
  
  return null;
}

findJosukeCredentials();
