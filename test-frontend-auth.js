// Simple script to test frontend authentication
console.log('🔍 Testing frontend authentication...');

// Check if we can access localStorage values
if (typeof localStorage !== 'undefined') {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Token exists:', !!token);
  console.log('User exists:', !!user);
  
  if (token) {
    console.log('Token preview:', token.substring(0, 20) + '...');
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('User data:', userData);
    } catch (e) {
      console.log('User data (raw):', user);
    }
  }
} else {
  console.log('localStorage not available (running in Node.js)');
}

// Test the appointment service approach
console.log('\n🧪 Testing appointment service auth headers...');
const getAuthHeaders = () => {
  // This mirrors the appointmentService logic
  return {
    'Content-Type': 'application/json',
    'x-auth-token': 'temp-admin-token'
  };
};

console.log('Current auth headers:', getAuthHeaders());

console.log('\n💡 Recommendations:');
console.log('1. Check if admin is properly logged in');
console.log('2. Update appointmentService to use proper JWT tokens');
console.log('3. Add authentication middleware to handle missing tokens');