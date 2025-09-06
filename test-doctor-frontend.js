/**
 * Browser Test Script: Doctor Dashboard Frontend Testing
 * Run this in the browser console to test the frontend functionality
 */

// Test Functions for Browser Console
const DoctorDashboardTests = {
  
  // Test 1: Check if user is logged in and data is correct
  testUserAuthentication() {
    console.log('🔍 Testing user authentication...');
    
    const authData = JSON.parse(localStorage.getItem('auth'));
    if (!authData) {
      console.error('❌ No auth data found in localStorage');
      return false;
    }
    
    if (!authData.user) {
      console.error('❌ No user data in auth object');
      return false;
    }
    
    console.log('✅ Auth data found:', authData.user);
    console.log(`👤 User: ${authData.user.firstName} ${authData.user.lastName}`);
    console.log(`🏷️ Role: ${authData.user.role}`);
    console.log(`🆔 Username: ${authData.user.username}`);
    
    return true;
  },
  
  // Test 2: Check if doctor header is displaying correctly
  testDoctorHeader() {
    console.log('🔍 Testing doctor header display...');
    
    const userNameElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');
    
    if (!userNameElement) {
      console.error('❌ User name element not found in header');
      return false;
    }
    
    if (!userRoleElement) {
      console.error('❌ User role element not found in header');
      return false;
    }
    
    const displayedName = userNameElement.textContent;
    const displayedRole = userRoleElement.textContent;
    
    console.log(`✅ Header name: "${displayedName}"`);
    console.log(`✅ Header role: "${displayedRole}"`);
    
    // Check if it's showing actual user data instead of defaults
    if (displayedName === 'Dr. Doctor' || displayedRole === 'Doctor') {
      console.warn('⚠️ Header might be showing default values instead of actual user data');
      return false;
    }
    
    return true;
  },
  
  // Test 3: Test doctor list loading
  async testDoctorListLoading() {
    console.log('🔍 Testing doctor list loading...');
    
    try {
      // Get auth token
      const authData = JSON.parse(localStorage.getItem('auth'));
      if (!authData || !authData.token) {
        console.error('❌ No auth token found');
        return false;
      }
      
      // Test the API call
      const response = await fetch('/api/users/doctors', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authData.token
        }
      });
      
      if (!response.ok) {
        console.error(`❌ API call failed: ${response.status} ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      
      if (!data.users || !Array.isArray(data.users)) {
        console.error('❌ Invalid response format');
        return false;
      }
      
      console.log(`✅ Doctor list loaded successfully: ${data.users.length} doctors found`);
      data.users.forEach((doctor, index) => {
        console.log(`   ${index + 1}. Dr. ${doctor.firstName} ${doctor.lastName}`);
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error testing doctor list:', error);
      return false;
    }
  },
  
  // Test 4: Check for console errors
  testConsoleErrors() {
    console.log('🔍 Checking for console errors...');
    
    // This is a simplified check - in a real scenario you'd monitor console.error
    const errorMessages = [
      'Failed to load doctors',
      'getAllUsers is not a function',
      'Cannot read properties of undefined',
      '404',
      'Unauthorized'
    ];
    
    // Check if any error elements are visible on the page
    const errorElements = document.querySelectorAll('[class*="error"], [class*="failed"]');
    
    if (errorElements.length > 0) {
      console.warn('⚠️ Error elements found on page:');
      errorElements.forEach(el => {
        console.warn(`   - ${el.textContent}`);
      });
      return false;
    }
    
    console.log('✅ No visible error elements found');
    return true;
  },
  
  // Test 5: Run all tests
  async runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🩺 DOCTOR DASHBOARD FRONTEND TESTS');
    console.log('='.repeat(60));
    
    const results = {};
    
    console.log('\n📋 Test 1: User Authentication');
    results.auth = this.testUserAuthentication();
    
    console.log('\n📋 Test 2: Doctor Header Display');
    results.header = this.testDoctorHeader();
    
    console.log('\n📋 Test 3: Doctor List Loading');
    results.doctorList = await this.testDoctorListLoading();
    
    console.log('\n📋 Test 4: Console Errors Check');
    results.errors = this.testConsoleErrors();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${test.toUpperCase()}: ${status}`);
    });
    
    const passedCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n📈 Overall Score: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All frontend tests passed!');
    } else {
      console.log('⚠️ Some tests failed. Check the issues above.');
    }
    
    return results;
  }
};

// Instructions for use
console.log('🔧 Doctor Dashboard Frontend Test Suite Loaded');
console.log('📝 Usage Instructions:');
console.log('1. Make sure you are logged in as a doctor');
console.log('2. Navigate to the doctor dashboard');
console.log('3. Run: DoctorDashboardTests.runAllTests()');
console.log('4. Or run individual tests:');
console.log('   - DoctorDashboardTests.testUserAuthentication()');
console.log('   - DoctorDashboardTests.testDoctorHeader()');
console.log('   - DoctorDashboardTests.testDoctorListLoading()');
console.log('   - DoctorDashboardTests.testConsoleErrors()');

// Make it globally available
window.DoctorDashboardTests = DoctorDashboardTests;
