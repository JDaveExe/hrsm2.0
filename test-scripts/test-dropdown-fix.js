// Test script to verify DoctorPicker dropdown positioning
// Run this in browser console after opening admin dashboard

function testDoctorPickerDropdown() {
  console.log('🧪 Testing DoctorPicker dropdown positioning and width...');
  
  // Find doctor picker dropdowns
  const dropdowns = document.querySelectorAll('.doctor-picker-toggle');
  console.log(`Found ${dropdowns.length} doctor picker dropdowns`);
  
  if (dropdowns.length === 0) {
    console.log('❌ No doctor picker dropdowns found. Make sure you\'re on the Today\'s Checkup tab.');
    return;
  }
  
  // Check for table container
  const tableContainer = document.querySelector('.checkup-table-container');
  if (!tableContainer) {
    console.log('❌ Table container not found');
    return;
  }
  
  console.log('✅ Table container found');
  
  // Get current overflow setting
  const currentOverflow = window.getComputedStyle(tableContainer).overflow;
  console.log(`Current table container overflow: ${currentOverflow}`);
  
  // Test clicking the first dropdown
  const firstDropdown = dropdowns[0];
  console.log('🖱️ Clicking first dropdown to test...');
  
  // Simulate click
  firstDropdown.click();
  
  // Check if overflow class was added
  setTimeout(() => {
    const hasOverflowClass = tableContainer.classList.contains('table-dropdown-open');
    const newOverflow = window.getComputedStyle(tableContainer).overflow;
    
    console.log(`Dropdown open - Has overflow class: ${hasOverflowClass}`);
    console.log(`New overflow setting: ${newOverflow}`);
    
    if (hasOverflowClass && newOverflow === 'visible') {
      console.log('✅ Dropdown overflow fix is working!');
    } else {
      console.log('❌ Dropdown overflow fix may need adjustment');
    }
    
    // Close dropdown by clicking outside
    document.body.click();
    
    setTimeout(() => {
      const stillHasClass = tableContainer.classList.contains('table-dropdown-open');
      console.log(`After closing - Still has overflow class: ${stillHasClass}`);
      
      if (!stillHasClass) {
        console.log('✅ Cleanup working correctly');
      } else {
        console.log('❌ Cleanup may need adjustment');
      }
    }, 100);
  }, 100);
}

// Export for browser console use
window.testDoctorPickerDropdown = testDoctorPickerDropdown;

console.log('🔧 DoctorPicker test loaded. Run testDoctorPickerDropdown() in console to test.');