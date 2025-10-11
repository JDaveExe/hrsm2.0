// Test script to manually call the doctor checkups API
const fetch = require('node-fetch');

async function testDoctorCheckupsAPI() {
  try {
    console.log('=== TESTING DOCTOR CHECKUPS API ===');
    
    // You'll need to get the actual auth token from the browser
    const authToken = 'YOUR_AUTH_TOKEN_HERE'; // Replace this with actual token
    
    const response = await fetch('http://localhost:5000/api/doctor/checkups', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:');
      console.log(JSON.stringify(data, null, 2));
      console.log(`\nTotal checkups returned: ${data.length}`);
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Alternatively, let's check the backend logs directly
console.log('To test this manually:');
console.log('1. Open browser dev tools');
console.log('2. Go to Application tab > Local Storage');
console.log('3. Copy the auth token');
console.log('4. Replace YOUR_AUTH_TOKEN_HERE with the actual token');
console.log('5. Run this script again');
console.log('');
console.log('Or check the backend logs when the frontend makes the API call');

testDoctorCheckupsAPI();