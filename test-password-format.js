// Test password generation format
const testPasswordGeneration = () => {
  console.log('🧪 Testing Password Generation Format...\n');
  
  const dateOfBirth = new Date('1990-05-15');
  const day = String(dateOfBirth.getDate()).padStart(2, '0');
  const month = String(dateOfBirth.getMonth() + 1).padStart(2, '0');
  const year = dateOfBirth.getFullYear();
  const generatedPassword = `${day}-${month}-${year}`;
  
  console.log('Date of Birth:', '1990-05-15');
  console.log('Day:', day);
  console.log('Month:', month);
  console.log('Year:', year);
  console.log('Generated Password:', `"${generatedPassword}"`);
  console.log('Password Length:', generatedPassword.length);
  console.log('Has Spaces:', generatedPassword.includes(' '));
  
  // Test different dates
  const testDates = [
    '1990-05-15',
    '2000-12-31', 
    '1985-01-01',
    '1995-09-04'
  ];
  
  console.log('\n📋 Testing Multiple Dates:');
  testDates.forEach(date => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const password = `${day}-${month}-${year}`;
    console.log(`${date} → "${password}" (length: ${password.length}, spaces: ${password.includes(' ')})`);
  });
};

testPasswordGeneration();
