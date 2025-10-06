// restart-and-test.js
// Script to help with restarting backend and testing

const { spawn } = require('child_process');
const axios = require('axios');

async function waitForServer(maxAttempts = 10) {
  const BASE_URL = 'http://localhost:5000/api';
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await axios.get(`${BASE_URL}/audit/logs`, {
        headers: { 'Authorization': 'Bearer temp-admin-token' },
        timeout: 2000
      });
      console.log('✅ Server is responding');
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('❌ Server did not respond after waiting');
  return false;
}

async function testUserNameAfterRestart() {
  console.log('🔄 Please restart the backend server in another terminal...');
  console.log('   (cd backend && npm start or node server.js)');
  console.log('⏳ Waiting for server to be ready...\n');
  
  if (await waitForServer()) {
    console.log('\n🔍 Testing user name resolution...');
    
    // Import and run the test
    const { testUserNameFix } = require('./test-user-name-fix');
    await testUserNameFix();
  }
}

if (require.main === module) {
  testUserNameAfterRestart().catch(console.error);
}

module.exports = { waitForServer };