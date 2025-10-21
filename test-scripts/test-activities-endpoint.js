/**
 * Test script to check if activities are being logged and retrieved correctly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// You'll need to replace this with a valid admin token
// Get it from: sessionStorage.getItem('authData') in browser console
const AUTH_TOKEN = 'YOUR_TOKEN_HERE';

async function testActivitiesEndpoint() {
  console.log('🧪 Testing Profile Activities Endpoint\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Get current user's activities
    console.log('\n📋 Test 1: Fetching activities for current user...');
    const response = await axios.get(`${BASE_URL}/profile/activities/me`, {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    console.log('✅ Response Status:', response.status);
    console.log('📊 Total Activities:', response.data.activities?.length || 0);
    console.log('📄 Pagination:', response.data.pagination);
    
    if (response.data.activities && response.data.activities.length > 0) {
      console.log('\n📝 Recent Activities:');
      response.data.activities.slice(0, 5).forEach((activity, index) => {
        console.log(`\n   ${index + 1}. Action: ${activity.action}`);
        console.log(`      Description: ${activity.description || activity.actionDescription || 'N/A'}`);
        console.log(`      Time: ${new Date(activity.timestamp).toLocaleString()}`);
        console.log(`      Target: ${activity.targetType} (${activity.targetId})`);
      });
    } else {
      console.log('\n⚠️  No activities found for this user');
      console.log('   This could mean:');
      console.log('   1. User hasn\'t performed any logged actions yet');
      console.log('   2. Audit logs aren\'t being created with correct userId');
      console.log('   3. Database connection issue');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
    
    if (error.response?.status === 401) {
      console.log('\n💡 Token is invalid or expired!');
      console.log('   To get a valid token:');
      console.log('   1. Log in to the admin dashboard');
      console.log('   2. Open browser console (F12)');
      console.log('   3. Run: JSON.parse(sessionStorage.getItem("authData")).token');
      console.log('   4. Copy the token and replace AUTH_TOKEN in this script');
    }
  }

  console.log('\n' + '='.repeat(60));
}

// Instructions
console.log('\n⚠️  IMPORTANT: Update AUTH_TOKEN before running!');
console.log('To get your token:');
console.log('1. Log in to admin dashboard');
console.log('2. Open browser console (F12)');
console.log('3. Run: JSON.parse(sessionStorage.getItem("authData")).token');
console.log('4. Copy the token and update line 9 of this script\n');

if (AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
  console.log('❌ Please update AUTH_TOKEN first!\n');
  process.exit(1);
}

testActivitiesEndpoint();
