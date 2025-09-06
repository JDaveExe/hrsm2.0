const bcrypt = require('bcryptjs');

const testHashReverse = async () => {
  console.log('🔍 Testing what password creates the stored hash...\n');
  
  const storedHash = '$2b$10$DIDvMplJK0bQsF/EJOVGAuEFmL/2O8GfWpOUO.7e9EIhB1U8yqbni';
  
  // Test various possible passwords that might have been used
  const testPasswords = [
    '15-05-1990',
    '14-05-1990', 
    '16-05-1990',
    '15051990',
    '1990-05-15',
    '05-15-1990',
    'undefined-undefined-1990',
    'NaN-NaN-1990',
    '00-00-1990',
    '01-01-1990',
    'testpatient238787@example.com', // Maybe username was used?
    '09238787890', // Maybe contact number?
    'Test Patient', // Maybe name?
    'TestPatient',
    '',
    ' ',
    'null',
    'undefined',
    'Test', // firstName
    'Patient', // lastName
    '15-5-1990', // Without zero padding
    '15-05-90', // 2-digit year
    // Test if there was an error in date parsing
    '31-12-1969', // Unix epoch
    '01-01-1970',
    // Test current date (maybe it used current date instead)
    '04-09-2025', // Today's date
    '03-09-2025', // Yesterday
    '05-09-2025', // Tomorrow
  ];
  
  console.log('🧪 Testing potential passwords against the stored hash:');
  
  for (const password of testPasswords) {
    try {
      const isMatch = await bcrypt.compare(password, storedHash);
      if (isMatch) {
        console.log(`🎯 FOUND IT! Password: "${password}"`);
        return password;
      } else {
        console.log(`❌ "${password}"`);
      }
    } catch (error) {
      console.log(`❌ "${password}" - Error: ${error.message}`);
    }
  }
  
  console.log('\n❌ No matching password found from test list');
  
  // Let's also test creating a new hash with the expected password to compare
  console.log('\n🔐 Creating new hash for "15-05-1990" to compare:');
  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash('15-05-1990', salt);
  console.log('New hash:', newHash);
  console.log('Original:', storedHash);
  console.log('Different:', newHash !== storedHash);
};

testHashReverse();
