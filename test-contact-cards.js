// Test script to verify contact card rearrangement changes
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Contact Cards Rearrangement...\n');

// Test 1: Check if emergency 911 line is removed
function testEmergencyRemoved() {
  const contactFile = path.join(__dirname, 'src', 'components', 'ContactUs.js');
  const content = fs.readFileSync(contactFile, 'utf8');
  
  const hasEmergency = content.includes('Emergency') && content.includes('911');
  
  if (!hasEmergency) {
    console.log('✅ Test 1 PASSED: Emergency 911 line removed');
    return true;
  } else {
    console.log('❌ Test 1 FAILED: Emergency 911 line still present');
    return false;
  }
}

// Test 2: Check if contact-cards-grid class is used instead of contact-grid
function testNewGridStructure() {
  const contactFile = path.join(__dirname, 'src', 'components', 'ContactUs.js');
  const content = fs.readFileSync(contactFile, 'utf8');
  
  const hasNewGrid = content.includes('contact-cards-grid');
  const hasOldSection = content.includes('contact-info-section');
  
  if (hasNewGrid && !hasOldSection) {
    console.log('✅ Test 2 PASSED: New grid structure implemented');
    return true;
  } else {
    console.log('❌ Test 2 FAILED: Grid structure not properly updated');
    return false;
  }
}

// Test 3: Check if CSS has 3-column grid
function testCSSGrid() {
  const cssFile = path.join(__dirname, 'src', 'styles', 'ContactUs.css');
  const content = fs.readFileSync(cssFile, 'utf8');
  
  const hasThreeColumns = content.includes('grid-template-columns: repeat(3, 1fr)');
  const hasEqualHeight = content.includes('align-items: stretch');
  
  if (hasThreeColumns && hasEqualHeight) {
    console.log('✅ Test 3 PASSED: CSS 3-column grid with equal heights implemented');
    return true;
  } else {
    console.log('❌ Test 3 FAILED: CSS grid not properly configured');
    return false;
  }
}

// Test 4: Check if flexbox height is set for equal card heights
function testEqualHeights() {
  const cssFile = path.join(__dirname, 'src', 'styles', 'ContactUs.css');
  const content = fs.readFileSync(cssFile, 'utf8');
  
  const hasFlexbox = content.includes('display: flex') && 
                    content.includes('flex-direction: column') && 
                    content.includes('height: 100%');
  
  if (hasFlexbox) {
    console.log('✅ Test 4 PASSED: Equal height cards configured');
    return true;
  } else {
    console.log('❌ Test 4 FAILED: Equal height configuration missing');
    return false;
  }
}

// Test 5: Check responsive design
function testResponsiveDesign() {
  const cssFile = path.join(__dirname, 'src', 'styles', 'ContactUs.css');
  const content = fs.readFileSync(cssFile, 'utf8');
  
  const hasResponsive = content.includes('contact-cards-grid {') && 
                       content.includes('grid-template-columns: 1fr');
  
  if (hasResponsive) {
    console.log('✅ Test 5 PASSED: Responsive design for mobile implemented');
    return true;
  } else {
    console.log('❌ Test 5 FAILED: Responsive design missing');
    return false;
  }
}

// Run all tests
function runTests() {
  const tests = [
    testEmergencyRemoved,
    testNewGridStructure,
    testCSSGrid,
    testEqualHeights,
    testResponsiveDesign
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  tests.forEach(test => {
    if (test()) {
      passedTests++;
    }
  });
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Contact cards rearrangement completed successfully!');
    console.log('📱 Cards now display 3 in a row with equal heights');
    console.log('📞 911 emergency line removed as requested');
  } else {
    console.log('⚠️  Some tests failed. Please review the changes.');
  }
  
  return passedTests === totalTests;
}

// Execute tests
runTests();