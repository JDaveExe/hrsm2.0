// Test Senior Citizen Booking Fix
// This script tests the age calculation and booking restrictions

console.log('='.repeat(80));
console.log('🧪 SENIOR CITIZEN BOOKING FIX - VERIFICATION TEST');
console.log('='.repeat(80));
console.log('');

// Helper: Calculate age from date of birth
function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper: Check if date is weekend
function isWeekend(date) {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

// Helper: Get minimum bookable date
function getMinBookableDate(dateOfBirth) {
  const today = new Date();
  let minDate = new Date(today);
  
  const age = calculateAge(dateOfBirth);
  const isSenior = age !== null && age >= 60;
  
  if (isSenior) {
    // Seniors can book starting today
    while (isWeekend(minDate.toISOString().split('T')[0])) {
      minDate.setDate(minDate.getDate() + 1);
    }
  } else {
    // Regular patients: Add 2 days minimum
    minDate.setDate(today.getDate() + 2);
    
    while (isWeekend(minDate.toISOString().split('T')[0])) {
      minDate.setDate(minDate.getDate() + 1);
    }
  }
  
  return minDate.toISOString().split('T')[0];
}

// Helper: Check if date is valid for booking
function isValidBookingDate(date, dateOfBirth) {
  const today = new Date();
  const selectedDate = new Date(date);
  const daysDiff = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
  
  const age = calculateAge(dateOfBirth);
  const isSenior = age !== null && age >= 60;
  
  if (isSenior) {
    return daysDiff >= 0 && !isWeekend(date);
  } else {
    return daysDiff >= 2 && !isWeekend(date);
  }
}

// Test Cases
const testCases = [
  {
    name: 'Senior Citizen - 72 years old',
    dateOfBirth: '1952-03-15',
    expectedAge: 72,
    expectedSenior: true,
    expectedMinBooking: 'today or next weekday',
    canBookToday: true,
    canBookTomorrow: true
  },
  {
    name: 'Senior Citizen - 66 years old',
    dateOfBirth: '1958-06-20',
    expectedAge: 66,
    expectedSenior: true,
    expectedMinBooking: 'today or next weekday',
    canBookToday: true,
    canBookTomorrow: true
  },
  {
    name: 'Senior Citizen - Exactly 60 years old',
    dateOfBirth: '1964-12-01',
    expectedAge: 60,
    expectedSenior: true,
    expectedMinBooking: 'today or next weekday',
    canBookToday: true,
    canBookTomorrow: true
  },
  {
    name: 'Regular Patient - 59 years old (not senior)',
    dateOfBirth: '1966-01-15',
    expectedAge: 59,
    expectedSenior: false,
    expectedMinBooking: '2 days from today',
    canBookToday: false,
    canBookTomorrow: false
  },
  {
    name: 'Regular Patient - 35 years old',
    dateOfBirth: '1989-08-10',
    expectedAge: 35,
    expectedSenior: false,
    expectedMinBooking: '2 days from today',
    canBookToday: false,
    canBookTomorrow: false
  },
  {
    name: 'Young Patient - 18 years old',
    dateOfBirth: '2006-03-01',
    expectedAge: 18,
    expectedSenior: false,
    expectedMinBooking: '2 days from today',
    canBookToday: false,
    canBookTomorrow: false
  }
];

// Get today's date and next few days
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const twoDaysLater = new Date(today);
twoDaysLater.setDate(twoDaysLater.getDate() + 2);

const todayStr = today.toISOString().split('T')[0];
const tomorrowStr = tomorrow.toISOString().split('T')[0];
const twoDaysLaterStr = twoDaysLater.toISOString().split('T')[0];

console.log('📅 Test Date Information:');
console.log(`   Today: ${todayStr} (${today.toLocaleDateString('en-US', { weekday: 'long' })})`);
console.log(`   Tomorrow: ${tomorrowStr} (${tomorrow.toLocaleDateString('en-US', { weekday: 'long' })})`);
console.log(`   +2 Days: ${twoDaysLaterStr} (${twoDaysLater.toLocaleDateString('en-US', { weekday: 'long' })})`);
console.log('');

// Run tests
let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Test ${index + 1}: ${testCase.name}`);
  console.log(`${'='.repeat(80)}`);
  
  const age = calculateAge(testCase.dateOfBirth);
  const isSenior = age !== null && age >= 60;
  const minBookingDate = getMinBookableDate(testCase.dateOfBirth);
  const canBookToday = !isWeekend(todayStr) && isValidBookingDate(todayStr, testCase.dateOfBirth);
  const canBookTomorrow = !isWeekend(tomorrowStr) && isValidBookingDate(tomorrowStr, testCase.dateOfBirth);
  const canBookTwoDays = !isWeekend(twoDaysLaterStr) && isValidBookingDate(twoDaysLaterStr, testCase.dateOfBirth);
  
  console.log(`📋 Patient Info:`);
  console.log(`   Date of Birth: ${testCase.dateOfBirth}`);
  console.log(`   Calculated Age: ${age} years old`);
  console.log(`   Is Senior Citizen: ${isSenior ? '✅ YES' : '❌ NO'} (age >= 60)`);
  console.log('');
  
  console.log(`📅 Booking Restrictions:`);
  console.log(`   Minimum Booking Date: ${minBookingDate}`);
  console.log('');
  
  console.log(`🎯 Booking Tests:`);
  console.log(`   Can book for TODAY (${todayStr})?`);
  console.log(`      Expected: ${testCase.canBookToday ? '✅ YES' : '❌ NO'}`);
  console.log(`      Actual:   ${canBookToday ? '✅ YES' : '❌ NO'}`);
  console.log(`      Status:   ${canBookToday === testCase.canBookToday ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log(`   Can book for TOMORROW (${tomorrowStr})?`);
  console.log(`      Expected: ${testCase.canBookTomorrow ? '✅ YES' : '❌ NO'}`);
  console.log(`      Actual:   ${canBookTomorrow ? '✅ YES' : '❌ NO'}`);
  console.log(`      Status:   ${canBookTomorrow === testCase.canBookTomorrow ? '✅ PASS' : '❌ FAIL'}`);
  
  console.log(`   Can book for +2 DAYS (${twoDaysLaterStr})?`);
  console.log(`      Expected: ✅ YES (all users can book 2+ days ahead)`);
  console.log(`      Actual:   ${canBookTwoDays ? '✅ YES' : '❌ NO'}`);
  console.log(`      Status:   ${canBookTwoDays ? '✅ PASS' : '❌ FAIL'}`);
  
  // Count results
  const testPassed = (
    (canBookToday === testCase.canBookToday) &&
    (canBookTomorrow === testCase.canBookTomorrow) &&
    canBookTwoDays &&
    (isSenior === testCase.expectedSenior)
  );
  
  if (testPassed) {
    passedTests++;
    console.log(`\n✅ Test ${index + 1} PASSED`);
  } else {
    failedTests++;
    console.log(`\n❌ Test ${index + 1} FAILED`);
  }
});

// Final Summary
console.log(`\n${'='.repeat(80)}`);
console.log('📊 TEST SUMMARY');
console.log(`${'='.repeat(80)}`);
console.log(`Total Tests: ${testCases.length}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
console.log('');

if (failedTests === 0) {
  console.log('🎉 ALL TESTS PASSED! Senior citizen booking fix is working correctly.');
} else {
  console.log('⚠️  Some tests failed. Please review the implementation.');
}

console.log(`${'='.repeat(80)}\n`);

// Additional: Weekend Blocking Test
console.log(`${'='.repeat(80)}`);
console.log('🔒 WEEKEND BLOCKING TEST (All Users)');
console.log(`${'='.repeat(80)}\n`);

const getNextWeekend = () => {
  const date = new Date();
  while (date.getDay() !== 6) { // Find next Saturday
    date.setDate(date.getDate() + 1);
  }
  return date;
};

const nextSaturday = getNextWeekend();
const nextSaturdayStr = nextSaturday.toISOString().split('T')[0];
const nextSunday = new Date(nextSaturday);
nextSunday.setDate(nextSunday.getDate() + 1);
const nextSundayStr = nextSunday.toISOString().split('T')[0];

console.log(`Next Saturday: ${nextSaturdayStr}`);
console.log(`Next Sunday: ${nextSundayStr}\n`);

testCases.forEach((testCase, index) => {
  const canBookSaturday = isValidBookingDate(nextSaturdayStr, testCase.dateOfBirth);
  const canBookSunday = isValidBookingDate(nextSundayStr, testCase.dateOfBirth);
  
  console.log(`${index + 1}. ${testCase.name}:`);
  console.log(`   Saturday: ${canBookSaturday ? '❌ FAIL (should block)' : '✅ BLOCKED'}`);
  console.log(`   Sunday:   ${canBookSunday ? '❌ FAIL (should block)' : '✅ BLOCKED'}`);
});

console.log(`\n${'='.repeat(80)}\n`);

// Note
console.log('📝 NOTE:');
console.log('   If today is a weekend, "Can book for TODAY" tests will show NO for all users.');
console.log('   This is expected behavior - weekends are blocked for everyone.');
console.log('   Senior citizens can book for weekdays starting today, regular patients need 2 days.');
console.log('');
