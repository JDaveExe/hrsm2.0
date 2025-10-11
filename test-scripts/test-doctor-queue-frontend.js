// Test script to check if the frontend can access doctor queue data

async function testDoctorQueueAccess() {
  console.log('Testing doctor queue access...');
  
  try {
    // First, let's try to login as doctor
    console.log('1. Attempting to login as doctor...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: 'doctor',
        password: 'doctor123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status, loginResponse.statusText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData.user.username, '- Role:', loginData.user.role);
    
    // Now test the doctor queue endpoint with authentication
    console.log('\n2. Testing doctor queue endpoint with auth token...');
    const queueResponse = await fetch('http://localhost:5000/api/doctor/queue', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!queueResponse.ok) {
      console.error('Queue access failed:', queueResponse.status, queueResponse.statusText);
      const errorText = await queueResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const queueData = await queueResponse.json();
    console.log('Queue data received successfully:');
    console.log('Number of patients in queue:', queueData.length);
    
    if (queueData.length > 0) {
      console.log('\nFirst patient details:');
      console.log('- Name:', queueData[0].patientName);
      console.log('- Status:', queueData[0].status);
      console.log('- Check-in time:', queueData[0].checkInTime);
      console.log('- Queued at:', queueData[0].queuedAt);
    }
    
    console.log('\n✅ Doctor queue access test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testDoctorQueueAccess();
