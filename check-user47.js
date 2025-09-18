const axios = require('axios');

async function checkUser47() {
  try {
    const adminLogin = await axios.post('http://localhost:5000/api/auth/login', {
      login: 'admin',
      password: 'admin123'
    });
    
    const token = adminLogin.data.token;
    
    // Try to get users
    try {
      const usersResponse = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Users response type:', typeof usersResponse.data);
      console.log('Is array:', Array.isArray(usersResponse.data));
      
      if (Array.isArray(usersResponse.data)) {
        const user47 = usersResponse.data.find(u => u.id == 47);
        console.log('User 47:', JSON.stringify(user47, null, 2));
      } else {
        console.log('Users data:', usersResponse.data);
      }
      
    } catch (error) {
      console.log('Users API error:', error.response?.data || error.message);
    }
    
    // Try direct user endpoint
    try {
      const userResponse = await axios.get('http://localhost:5000/api/users/47', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Direct user 47:', JSON.stringify(userResponse.data, null, 2));
    } catch (error) {
      console.log('Direct user API error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.log('Admin login error:', error.response?.data || error.message);
  }
}

checkUser47();
