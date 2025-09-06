const express = require('express');
const app = express();
app.use(express.json());

// Test the exact cleaning logic
const testData = {
  email: 'N/A',
  contactNumber: '09123456789',
  firstName: 'Test',
  lastName: 'Patient'
};

console.log('Original data:', testData);

// Convert empty strings and "N/A" to null for optional fields
const fieldsToClean = ['email', 'contactNumber', 'philHealthNumber', 'middleName', 'suffix', 'civilStatus', 'houseNo', 'street', 'barangay', 'city', 'region'];

fieldsToClean.forEach(field => {
  if (testData[field] === '' || 
      (typeof testData[field] === 'string' && 
       (testData[field].toLowerCase() === 'n/a' || testData[field].toLowerCase() === 'na'))) {
    testData[field] = null;
  }
});

console.log('Cleaned data:', testData);
console.log('Will create user account?', testData.email || testData.contactNumber);
console.log('Email is null?', testData.email === null);
console.log('Contact is provided?', testData.contactNumber !== null);
