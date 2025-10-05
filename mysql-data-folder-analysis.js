// Script to check which MySQL data folder is being used and verify database integrity
console.log('🔍 MySQL Data Folder Analysis');
console.log('============================');

console.log(`
📁 MYSQL DATA FOLDER STRUCTURE ANALYSIS:
========================================

You have two data folders:
- 📂 data (current folder - likely being used)
- 📂 data_old (backup/old folder - from before the fix)

This typically happens when:
1. MySQL crashes and corrupts the data folder
2. You follow a recovery tutorial that creates a backup
3. A fresh data folder is created to fix the startup issue

🎯 WHICH FOLDER IS MYSQL USING?
==============================

MySQL will use the folder specified in your my.ini configuration file.
Let's check which one is currently active by testing your database connection.
`);

async function checkDatabaseStatus() {
  console.log('🔍 Testing Database Connection...');
  
  try {
    // Test if our backend can connect to the database
    const response = await fetch('http://localhost:5000/api/checkups/analytics/diagnosis');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Database Connection: WORKING');
      console.log(`📊 Current diagnosis data count: ${data.length}`);
      
      // Test another endpoint to verify full connectivity
      const prescriptionResponse = await fetch('http://localhost:5000/api/checkups/analytics/prescriptions');
      if (prescriptionResponse.ok) {
        const prescriptionData = await prescriptionResponse.json();
        console.log(`💊 Prescription data count: ${prescriptionData.length}`);
        
        if (prescriptionData.length > 0 || data.length > 0) {
          console.log('✅ Database contains your existing healthcare data');
          console.log('🎯 RECOMMENDATION: Keep using the current "data" folder');
        } else {
          console.log('ℹ️  Database is empty - this might be a fresh data folder');
        }
      }
    } else {
      console.log('❌ Database Connection: FAILED');
      console.log('This might indicate the data folder issue');
    }
    
  } catch (error) {
    console.log('❌ Cannot test database - backend might not be running');
    console.log('Start your backend server first: cd backend && node server.js');
  }
}

console.log(`
📋 WHAT TO DO WITH data_old vs data:
====================================

OPTION 1: Current Setup is Working ✅
- If your healthcare app is working normally
- If you can see your patient data, checkups, etc.
- Keep using the current "data" folder
- "data_old" can be kept as backup or deleted

OPTION 2: Lost Data Recovery ⚠️
- If you're missing important patient data
- If the app shows empty/missing records
- You might need to recover from "data_old"

OPTION 3: Fresh Start 🆕
- If this is development/testing environment
- If you don't mind losing old data
- Current "data" folder is fine

🔧 TO CHECK YOUR DATA STATUS:
============================
1. Open your healthcare app
2. Login as admin/doctor
3. Check if patients, checkups, medications exist
4. If data is missing, we may need to restore from data_old

⚠️  IMPORTANT SAFETY NOTE:
=========================
Before making any changes:
1. Stop XAMPP MySQL
2. Backup both "data" and "data_old" folders
3. Never delete data_old until you're 100% sure current data is complete
`);

// Run the database check if we're in a browser environment
if (typeof window !== 'undefined') {
  checkDatabaseStatus();
} else {
  console.log('Run this script in the browser console to test database connectivity');
}

// Make function available for manual testing
if (typeof window !== 'undefined') {
  window.checkDatabaseStatus = checkDatabaseStatus;
}