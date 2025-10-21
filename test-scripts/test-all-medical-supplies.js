// Master Test Runner
// Runs all medical supplies tests in sequence

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  { name: 'Add Supply', file: 'test-add-supply.js' },
  { name: 'Log Usage', file: 'test-log-usage.js' },
  { name: 'Edit Supply', file: 'test-edit-supply.js' },
  { name: 'Add Stock', file: 'test-add-stock.js' },
  { name: 'Remove Supplies', file: 'test-remove-supplies.js' }
];

async function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🚀 Running: ${testFile}`);
    console.log('='.repeat(70));
    
    const testProcess = spawn('node', [testFile], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test ${testFile} failed with code ${code}`));
      }
    });
    
    testProcess.on('error', (error) => {
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log('\n' + '█'.repeat(70));
  console.log('🧪 MEDICAL SUPPLIES INVENTORY - COMPREHENSIVE TEST SUITE');
  console.log('█'.repeat(70));
  console.log('\n📋 Tests to run:');
  tests.forEach((test, index) => {
    console.log(`   ${index + 1}. ${test.name} (${test.file})`);
  });
  console.log('\n⏱️  Starting tests...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  const results = [];
  
  for (const test of tests) {
    try {
      await runTest(test.file);
      passedTests++;
      results.push({ name: test.name, status: '✅ PASSED' });
      console.log(`\n✅ ${test.name} - PASSED\n`);
    } catch (error) {
      failedTests++;
      results.push({ name: test.name, status: '❌ FAILED' });
      console.error(`\n❌ ${test.name} - FAILED`);
      console.error(`Error: ${error.message}\n`);
      
      // Ask if we should continue
      console.log('⚠️  Test failed. Stopping test suite.\n');
      break;
    }
  }
  
  // Final Summary
  console.log('\n' + '█'.repeat(70));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('█'.repeat(70));
  console.log('\n📋 Results:');
  results.forEach((result, index) => {
    console.log(`   ${index + 1}. ${result.name}: ${result.status}`);
  });
  console.log('\n📈 Statistics:');
  console.log(`   Total Tests: ${passedTests + failedTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('\n✅ Medical Supplies Inventory is fully functional:');
    console.log('   ✅ Add Supply - Working & Persists');
    console.log('   ✅ Log Usage - Working & Persists (Auto-deducts stock)');
    console.log('   ✅ Edit Supply - Working & Persists');
    console.log('   ✅ Add Stock - Working & Persists');
    console.log('   ✅ Remove Supplies - Working & Persists');
    console.log('\n💡 All functionality is ready for production use!');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('Please check the error messages above and fix the issues.');
  }
  
  console.log('\n' + '█'.repeat(70) + '\n');
}

// Run all tests
runAllTests()
  .then(() => {
    console.log('Test suite completed.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
