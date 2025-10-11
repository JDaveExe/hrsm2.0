// Test to verify assigned doctor display after queue fix
// Run this in browser console after the fixes are deployed

function testAssignedDoctorFix() {
  console.log('🔧 Testing Assigned Doctor Display Fix...');
  
  // Check if we have access to React DevTools or can inspect the state
  const checkupRows = document.querySelectorAll('.checkup-table-container tbody tr');
  
  console.log(`Found ${checkupRows.length} patient rows`);
  
  let fixedCount = 0;
  let stillBrokenCount = 0;
  
  checkupRows.forEach((row, index) => {
    const statusCell = row.cells[7]; // Status column
    const doctorCell = row.cells[6]; // Available Doctor column
    
    if (statusCell && statusCell.textContent.includes('Ready for Queue')) {
      console.log(`\n🔍 Checking Row ${index + 1} (In Queue):`);
      
      // Check if showing assigned doctor info
      const assignedDoctor = doctorCell.querySelector('.doctor-picker-assigned');
      const doctorButton = doctorCell.querySelector('.doctor-picker-button');
      
      if (assignedDoctor) {
        const doctorName = assignedDoctor.querySelector('.fw-medium');
        const assistedByText = assignedDoctor.querySelector('small');
        
        console.log('  ✅ Shows assigned doctor display');
        console.log(`  👨‍⚕️ Doctor name: ${doctorName ? doctorName.textContent : 'Not found'}`);
        console.log(`  🏷️ "Assisted By" text: ${assistedByText ? assistedByText.textContent : 'Not found'}`);
        
        if (doctorName && !doctorName.textContent.includes('Unknown')) {
          fixedCount++;
          console.log('  🎉 FIXED: Proper doctor name displayed!');
        } else {
          stillBrokenCount++;
          console.log('  ⚠️ ISSUE: Shows "Unknown Doctor" - data not synced yet');
        }
      } else if (doctorButton && doctorButton.textContent.includes('Available Doctors')) {
        stillBrokenCount++;
        console.log('  ❌ BROKEN: Still showing "Available Doctors" button');
      } else {
        console.log('  ❓ UNKNOWN: Cannot determine doctor display state');
      }
    }
  });
  
  console.log('\n=== FIX VERIFICATION RESULTS ===');
  console.log(`✅ Properly fixed patients: ${fixedCount}`);
  console.log(`❌ Still broken patients: ${stillBrokenCount}`);
  
  if (fixedCount > 0) {
    console.log('🎉 SUCCESS: The assigned doctor fix is working!');
  } else if (stillBrokenCount > 0) {
    console.log('⚠️ Try refreshing the page to load updated data from the server.');
  } else {
    console.log('ℹ️ No patients in queue to test. Add a patient to queue first.');
  }
}

// Run the test
testAssignedDoctorFix();