// Test Script for Admin-Doctor Simulation Integration
// Run this in browser console to test shared state functionality

console.log("=== Testing Admin-Doctor Simulation Integration ===");

// Test 1: Check if DataContext is available
if (typeof window !== 'undefined' && window.localStorage) {
  console.log("✓ LocalStorage available for shared state");
  
  // Check existing shared data
  const doctorQueue = localStorage.getItem('doctorQueueData');
  const sharedCheckups = localStorage.getItem('sharedCheckupsData');
  
  console.log("Current doctor queue data:", doctorQueue ? JSON.parse(doctorQueue) : "Empty");
  console.log("Current shared checkups:", sharedCheckups ? JSON.parse(sharedCheckups) : "Empty");
  
} else {
  console.log("✗ LocalStorage not available");
}

// Test 2: Simulate admin adding patient to doctor queue
function testAdminSimulation() {
  console.log("\n=== Testing Admin Simulation ===");
  
  const testPatient = {
    id: 'TEST-' + Date.now(),
    name: 'Test Patient ' + Math.floor(Math.random() * 100),
    type: 'Check-up',
    status: 'Waiting',
    source: 'admin_simulation',
    queuedAt: new Date().toISOString(),
    patientId: 'PT-TEST'
  };
  
  // Add to doctor queue
  let doctorQueue = JSON.parse(localStorage.getItem('doctorQueueData') || '[]');
  doctorQueue.push(testPatient);
  localStorage.setItem('doctorQueueData', JSON.stringify(doctorQueue));
  
  console.log("✓ Added test patient to doctor queue:", testPatient);
  return testPatient.id;
}

// Test 3: Simulate doctor updating status
function testDoctorUpdate(patientId) {
  console.log("\n=== Testing Doctor Status Update ===");
  
  let doctorQueue = JSON.parse(localStorage.getItem('doctorQueueData') || '[]');
  const patient = doctorQueue.find(p => p.id === patientId);
  
  if (patient) {
    patient.status = 'In Progress';
    patient.startedAt = new Date().toISOString();
    localStorage.setItem('doctorQueueData', JSON.stringify(doctorQueue));
    console.log("✓ Updated patient status to 'In Progress'");
  } else {
    console.log("✗ Patient not found in queue");
  }
}

// Run tests
console.log("\nTo run tests manually:");
console.log("1. testPatientId = testAdminSimulation()");
console.log("2. testDoctorUpdate(testPatientId)");
console.log("3. Refresh both admin and doctor dashboards to see changes");

// Auto-run basic test
if (confirm("Run automatic simulation test? This will add a test patient to the doctor queue.")) {
  const testId = testAdminSimulation();
  setTimeout(() => testDoctorUpdate(testId), 2000);
  console.log("✓ Auto-test completed. Refresh dashboards to see results.");
}
