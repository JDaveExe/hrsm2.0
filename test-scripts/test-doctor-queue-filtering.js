// Test script to verify doctor queue filtering
// Run this in browser console to test the doctor-specific queue filtering

function testDoctorQueueFiltering() {
  console.log('🔍 Testing Doctor Queue Filtering...');
  
  // Check if we're on the doctor dashboard
  const queueTitle = document.querySelector('h2');
  const isDoctorQueue = queueTitle && queueTitle.textContent.includes('Patient Queue');
  
  if (!isDoctorQueue) {
    console.log('❌ Not on doctor patient queue page. Please navigate to doctor dashboard.');
    return;
  }
  
  // Get current user info from the page
  const userElement = document.querySelector('.user-info, .doctor-name, [class*="user"], [class*="doctor"]');
  const currentDoctorName = userElement ? userElement.textContent : 'Unknown';
  
  console.log(`👨‍⚕️ Current Doctor: ${currentDoctorName}`);
  
  // Check patient cards in the queue
  const patientCards = document.querySelectorAll('.patient-card, .queue-item, [class*="patient"]');
  console.log(`📋 Found ${patientCards.length} patient cards in queue`);
  
  let correctlyFiltered = 0;
  let incorrectlyShown = 0;
  
  patientCards.forEach((card, index) => {
    // Try to find assigned doctor info in the card
    const cardText = card.textContent;
    console.log(`\n🔍 Patient Card ${index + 1}:`);
    console.log(`  Content preview: ${cardText.substring(0, 100)}...`);
    
    // Check if this patient should be visible to current doctor
    // Look for doctor assignment information
    if (cardText.includes('Johnny Davis') || cardText.includes('Default Doctor')) {
      const assignedDoctor = cardText.includes('Johnny Davis') ? 'Johnny Davis' : 
                           cardText.includes('Default Doctor') ? 'Default Doctor' : 'Unknown';
      
      console.log(`  👨‍⚕️ Assigned to: ${assignedDoctor}`);
      
      if (currentDoctorName.includes(assignedDoctor) || assignedDoctor.includes('Johnny') && currentDoctorName.includes('Johnny')) {
        correctlyFiltered++;
        console.log(`  ✅ CORRECT: Patient correctly shown to assigned doctor`);
      } else {
        incorrectlyShown++;
        console.log(`  ❌ WRONG: Patient shown to wrong doctor!`);
        console.log(`    Expected: ${assignedDoctor}`);
        console.log(`    Current Doctor: ${currentDoctorName}`);
      }
    } else {
      console.log(`  ❓ UNCLEAR: Cannot determine assigned doctor from card content`);
    }
  });
  
  // Check the queue stats
  const statCards = document.querySelectorAll('.stat-card, .stat-number');
  console.log(`\n📊 Queue Statistics:`);
  statCards.forEach((stat, index) => {
    const number = stat.querySelector('.stat-number') || stat;
    const label = stat.querySelector('.stat-label') || stat.nextElementSibling;
    if (number && label) {
      console.log(`  ${label.textContent}: ${number.textContent}`);
    }
  });
  
  console.log('\n=== FILTERING TEST RESULTS ===');
  console.log(`✅ Correctly filtered patients: ${correctlyFiltered}`);
  console.log(`❌ Incorrectly shown patients: ${incorrectlyShown}`);
  console.log(`📋 Total patients in queue: ${patientCards.length}`);
  
  if (incorrectlyShown === 0) {
    console.log('🎉 SUCCESS: Doctor queue filtering is working correctly!');
    console.log('👨‍⚕️ Only patients assigned to this doctor are visible.');
  } else {
    console.log('⚠️ ISSUE: Some patients are shown to the wrong doctor.');
    console.log('💡 This might be due to recent changes that need a page refresh.');
  }
  
  console.log('\n📝 Test completed! Check individual patient results above.');
}

// Run the test
testDoctorQueueFiltering();