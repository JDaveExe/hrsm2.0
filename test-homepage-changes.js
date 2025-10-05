// Test script to verify homepage improvements
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Homepage Improvements...\n');

// Test 1: Check if social media icons are removed from Homepage.js
function testSocialMediaIconsRemoved() {
  const homepageFile = path.join(__dirname, 'src', 'components', 'Homepage.js');
  const content = fs.readFileSync(homepageFile, 'utf8');
  
  const hasSocialIcons = content.includes('social-icons') || 
                        content.includes('social-icon') ||
                        content.includes('aria-label="X (Twitter)"') ||
                        content.includes('aria-label="GitHub"') ||
                        content.includes('aria-label="LinkedIn"');
  
  if (!hasSocialIcons) {
    console.log('✅ Test 1 PASSED: Social media icons removed from footer');
    return true;
  } else {
    console.log('❌ Test 1 FAILED: Social media icons still present in footer');
    return false;
  }
}

// Test 2: Check if contact form section is removed from ContactUs.js
function testContactFormRemoved() {
  const contactFile = path.join(__dirname, 'src', 'components', 'ContactUs.js');
  const content = fs.readFileSync(contactFile, 'utf8');
  
  const hasContactForm = content.includes('Send Us a Message') || 
                        content.includes('contact-form-section') ||
                        content.includes('<ContactForm />');
  
  if (!hasContactForm) {
    console.log('✅ Test 2 PASSED: "Send us a message" section removed');
    return true;
  } else {
    console.log('❌ Test 2 FAILED: "Send us a message" section still present');
    return false;
  }
}

// Test 3: Check if operating hours section is removed from ContactUs.js
function testOperatingHoursRemoved() {
  const contactFile = path.join(__dirname, 'src', 'components', 'ContactUs.js');
  const content = fs.readFileSync(contactFile, 'utf8');
  
  const hasOperatingHours = content.includes('Operating Hours') || 
                           content.includes('Monday - Friday:') ||
                           content.includes('8:00 AM - 5:00 PM');
  
  if (!hasOperatingHours) {
    console.log('✅ Test 3 PASSED: Operating hours section removed');
    return true;
  } else {
    console.log('❌ Test 3 FAILED: Operating hours section still present');
    return false;
  }
}

// Test 4: Check if email is updated to maybungafloodwayhc@gmail.com
function testEmailUpdated() {
  const contactFile = path.join(__dirname, 'src', 'components', 'ContactUs.js');
  const content = fs.readFileSync(contactFile, 'utf8');
  
  const hasNewEmail = content.includes('maybungafloodwayhc@gmail.com');
  const hasOldEmail = content.includes('info@barangayhealth.com') ||
                     content.includes('appointments@barangayhealth.com') ||
                     content.includes('records@barangayhealth.com');
  
  if (hasNewEmail && !hasOldEmail) {
    console.log('✅ Test 4 PASSED: Email updated to maybungafloodwayhc@gmail.com');
    return true;
  } else {
    console.log('❌ Test 4 FAILED: Email not properly updated');
    return false;
  }
}

// Test 5: Check if phone number is updated to +63 026428645
function testPhoneUpdated() {
  const contactFile = path.join(__dirname, 'src', 'components', 'ContactUs.js');
  const content = fs.readFileSync(contactFile, 'utf8');
  
  const hasNewPhone = content.includes('+63 026428645') || content.includes('026428645');
  const hasOldPhone = content.includes('(0912) 345-6789') || content.includes('(0912) 345-6790');
  
  if (hasNewPhone && !hasOldPhone) {
    console.log('✅ Test 5 PASSED: Phone number updated to +63 026428645');
    return true;
  } else {
    console.log('❌ Test 5 FAILED: Phone number not properly updated');
    return false;
  }
}

// Test 6: Check if quick service links section is removed
function testQuickServiceLinksRemoved() {
  const contactFile = path.join(__dirname, 'src', 'components', 'ContactUs.js');
  const content = fs.readFileSync(contactFile, 'utf8');
  
  const hasQuickLinks = content.includes('Quick Service Links') || 
                       content.includes('quick-links-section') ||
                       content.includes('quick-link-card');
  
  if (!hasQuickLinks) {
    console.log('✅ Test 6 PASSED: Quick service links section removed');
    return true;
  } else {
    console.log('❌ Test 6 FAILED: Quick service links section still present');
    return false;
  }
}

// Run all tests
function runTests() {
  const tests = [
    testSocialMediaIconsRemoved,
    testContactFormRemoved,
    testOperatingHoursRemoved,
    testEmailUpdated,
    testPhoneUpdated,
    testQuickServiceLinksRemoved
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
    console.log('🎉 All homepage improvements implemented successfully!');
  } else {
    console.log('⚠️  Some tests failed. Please review the changes.');
  }
  
  return passedTests === totalTests;
}

// Execute tests
runTests();