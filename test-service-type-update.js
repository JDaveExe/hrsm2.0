// Test script to verify service type update endpoint
async function testServiceTypeUpdate() {
  console.log('Testing service type update...');
  
  try {
    // First, let's try to login as admin
    console.log('1. Attempting to login as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status, loginResponse.statusText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData.user.username, '- Role:', loginData.user.role);
    
    // Get today's checkups first
    console.log('\n2. Getting today\'s checkups...');
    const checkupsResponse = await fetch('http://localhost:5000/api/checkups/today', {
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!checkupsResponse.ok) {
      console.error('Failed to get checkups:', checkupsResponse.status);
      return;
    }
    
    const checkups = await checkupsResponse.json();
    console.log('Found checkups:', checkups.length);
    
    if (checkups.length === 0) {
      console.log('No checkups found to test with');
      return;
    }
    
    const firstCheckup = checkups[0];
    console.log('Testing with checkup ID:', firstCheckup.id, 'for patient:', firstCheckup.patientName);
    console.log('Current service type:', firstCheckup.serviceType);
    
    // Test updating service type
    console.log('\n3. Testing service type update...');
    const updateResponse = await fetch(`http://localhost:5000/api/checkups/${firstCheckup.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        serviceType: 'general-checkup'
      })
    });
    
    if (!updateResponse.ok) {
      console.error('Update failed:', updateResponse.status, updateResponse.statusText);
      const errorText = await updateResponse.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const updateResult = await updateResponse.json();
    console.log('Update successful:', updateResult);
    
    console.log('\n✅ Service type update test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testServiceTypeUpdate();
