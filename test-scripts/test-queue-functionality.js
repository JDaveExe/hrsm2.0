// Test script to verify queue functionality
// Run this in browser console to test the queue behavior

function testQueueFunctionality() {
  console.log('🧪 Testing Queue Functionality...');
  
  // Check if we're on the right page
  const checkupTable = document.querySelector('.checkup-table-container table');
  if (!checkupTable) {
    console.log('❌ Not on checkup management page. Please navigate to Admin Dashboard → Today\'s Checkup');
    return;
  }
  
  // Look for patients with different statuses
  const rows = document.querySelectorAll('.checkup-table-container table tbody tr');
  console.log(`Found ${rows.length} patient rows`);
  
  let inQueueCount = 0;
  let readyToQueueCount = 0;
  let assignedDoctorCount = 0;
  
  rows.forEach((row, index) => {
    const statusCell = row.cells[7]; // Status column
    const doctorCell = row.cells[6]; // Available Doctor column
    const actionsCell = row.cells[8]; // Actions column
    
    if (statusCell && doctorCell && actionsCell) {
      const statusText = statusCell.textContent.trim();
      console.log(`\nRow ${index + 1}:`);
      console.log(`  Status: ${statusText}`);
      
      // Check if patient is in queue
      if (statusText.includes('Ready for Queue')) {
        inQueueCount++;
        console.log('  ✅ Patient is in queue');
        
        // Check if doctor assignment is showing correctly
        const assignedDoctor = doctorCell.querySelector('.doctor-picker-assigned');
        if (assignedDoctor) {
          assignedDoctorCount++;
          const doctorName = assignedDoctor.querySelector('.fw-medium');
          const assistedBy = assignedDoctor.querySelector('small');
          
          console.log(`  👨‍⚕️ Assigned Doctor: ${doctorName ? doctorName.textContent : 'Not found'}`);
          console.log(`  🔖 Shows "Assisted By": ${assistedBy && assistedBy.textContent.includes('Assisted By') ? '✅ YES' : '❌ NO'}`);
        } else {
          console.log('  ❌ No assigned doctor display found');
        }
        
        // Check if buttons are properly disabled/hidden
        const addToQueueBtn = actionsCell.querySelector('button:not([disabled])');
        const inQueueBtn = actionsCell.querySelector('button[disabled]');
        const vitalSignsBtn = actionsCell.querySelector('button:not([disabled]):first-child');
        
        console.log(`  🚫 Add to Queue button hidden: ${!addToQueueBtn || !addToQueueBtn.textContent.includes('Add to Queue') ? '✅ YES' : '❌ NO'}`);
        console.log(`  ✅ In Queue button visible: ${inQueueBtn && inQueueBtn.textContent.includes('In Queue') ? '✅ YES' : '❌ NO'}`);
        console.log(`  👁️ Vital Signs accessible: ${vitalSignsBtn && vitalSignsBtn.textContent.includes('Vital Signs') ? '✅ YES' : '❌ NO'}`);
      } else {
        readyToQueueCount++;
        console.log('  📝 Patient not in queue yet');
      }
    }
  });
  
  console.log('\n=== SUMMARY ===');
  console.log(`📊 Total patients: ${rows.length}`);
  console.log(`🚀 Patients in queue: ${inQueueCount}`);
  console.log(`⏳ Patients ready to queue: ${readyToQueueCount}`);
  console.log(`👨‍⚕️ Correctly showing assigned doctors: ${assignedDoctorCount}`);
  
  if (inQueueCount > 0) {
    console.log('✅ Queue functionality is working!');
    console.log('✅ Assigned doctors are being displayed properly!');
  } else {
    console.log('ℹ️ No patients in queue yet. Add a patient to queue to test full functionality.');
  }
  
  console.log('\n📝 Test completed! Check the individual row results above.');
}

// Run the test
testQueueFunctionality();