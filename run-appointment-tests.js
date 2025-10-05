#!/usr/bin/env node

/**
 * Test Runner for Appointment System
 * Runs comprehensive tests for appointment booking validation
 */

const AppointmentTester = require('./test-appointment-conflicts');

console.log('🧪 APPOINTMENT SYSTEM TEST SUITE');
console.log('=' .repeat(60));
console.log('Testing appointment booking validation, conflicts, and limits');
console.log('Make sure your backend server is running on http://localhost:5000');
console.log('=' .repeat(60));
console.log('');

async function runTests() {
  const tester = new AppointmentTester();
  
  try {
    await tester.runAllTests();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test suite failed with error:', error.message);
    process.exit(1);
  }
}

// Check if Node.js is available and has required modules
try {
  require('axios');
  console.log('✅ Dependencies check passed');
  runTests();
} catch (error) {
  console.error('❌ Missing dependencies. Please run: npm install axios');
  console.error('   Or install globally: npm install -g axios');
  process.exit(1);
}