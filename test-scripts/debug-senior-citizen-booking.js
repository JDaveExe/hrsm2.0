// Debug Script - Test Senior Citizen Appointment Logic
// Run this in browser console while logged in as patient

// Check user data
console.log('=== USER DATA ===');
console.log('User object:', window.user || 'Not found in window');

// Check if user context is available
const userContext = document.querySelector('[data-user]');
if (userContext) {
  console.log('User from DOM:', userContext.dataset.user);
}

// Test age detection
const testAge = (age) => {
  const isSenior = age && parseInt(age) >= 60;
  console.log(`Age ${age}: ${isSenior ? 'SENIOR CITIZEN ✅' : 'Regular Patient'}`);
  return isSenior;
};

console.log('\n=== AGE TESTS ===');
testAge(66);  // Should be true
testAge(60);  // Should be true
testAge(59);  // Should be false
testAge(50);  // Should be false

// Test date calculations
console.log('\n=== DATE CALCULATIONS ===');
const today = new Date();
console.log('Today:', today.toISOString().split('T')[0]);

const twoDaysAhead = new Date(today);
twoDaysAhead.setDate(today.getDate() + 2);
console.log('2 Days Ahead:', twoDaysAhead.toISOString().split('T')[0]);

// Test isWeekend function
const isWeekend = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
};

console.log('\n=== WEEKEND TESTS ===');
const testDates = [];
for (let i = 0; i < 7; i++) {
  const testDate = new Date(today);
  testDate.setDate(today.getDate() + i);
  const dateStr = testDate.toISOString().split('T')[0];
  const dayName = testDate.toLocaleDateString('en-US', { weekday: 'long' });
  const weekend = isWeekend(dateStr);
  testDates.push({ dateStr, dayName, weekend });
  console.log(`${dateStr} (${dayName}): ${weekend ? '❌ Weekend' : '✅ Weekday'}`);
}

// Test getMinBookableDate logic
console.log('\n=== MIN BOOKABLE DATE ===');

const getMinBookableDate = (userAge) => {
  const today = new Date();
  let minDate = new Date(today);
  
  const isSenior = userAge && parseInt(userAge) >= 60;
  
  if (isSenior) {
    console.log('Senior Citizen: Starting from today');
    while (isWeekend(minDate.toISOString().split('T')[0])) {
      minDate.setDate(minDate.getDate() + 1);
    }
  } else {
    console.log('Regular Patient: Adding 2 days');
    minDate.setDate(today.getDate() + 2);
    while (isWeekend(minDate.toISOString().split('T')[0])) {
      minDate.setDate(minDate.getDate() + 1);
    }
  }
  
  return minDate.toISOString().split('T')[0];
};

console.log('Min Date (Age 66):', getMinBookableDate(66));
console.log('Min Date (Age 50):', getMinBookableDate(50));

// Test isValidBookingDate logic
console.log('\n=== VALID BOOKING DATE TESTS ===');

const isValidBookingDate = (date, userAge) => {
  const today = new Date();
  const selectedDate = new Date(date);
  const daysDiff = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
  
  const isSenior = userAge && parseInt(userAge) >= 60;
  
  if (isSenior) {
    return daysDiff >= 0 && !isWeekend(date);
  } else {
    return daysDiff >= 2 && !isWeekend(date);
  }
};

testDates.forEach(({ dateStr, dayName, weekend }) => {
  const validForSenior = isValidBookingDate(dateStr, 66);
  const validForRegular = isValidBookingDate(dateStr, 50);
  
  console.log(`${dateStr} (${dayName}):`);
  console.log(`  Senior (66): ${validForSenior ? '✅ Valid' : '❌ Invalid'}`);
  console.log(`  Regular (50): ${validForRegular ? '✅ Valid' : '❌ Invalid'}`);
});

console.log('\n=== SUMMARY ===');
console.log('✅ If you are logged in as a 66-year-old patient:');
console.log('   - You should see "Senior Citizen: No 2-day advance booking required" in calendar legend');
console.log('   - You should be able to select today (if weekday)');
console.log('   - You should be able to select tomorrow (if weekday)');
console.log('   - Weekends should still be disabled');
console.log('');
console.log('⚠️  If restrictions still appear:');
console.log('   1. Check browser console for "User Age:" log');
console.log('   2. Verify age is correctly saved in database');
console.log('   3. Try logging out and logging back in');
console.log('   4. Clear browser cache and reload');
