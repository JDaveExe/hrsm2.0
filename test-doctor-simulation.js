// Test Script for Doctor Dashboard Simulation Mode Integration
// Run this in browser console to test simulation mode banner and time sync

console.log("=== Testing Doctor Dashboard Simulation Mode Integration ===");

// Test 1: Activate simulation mode with specific date/time
function activateSimulationMode() {
  console.log("\n=== Test 1: Activating Simulation Mode ===");
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 1 week in future
  futureDate.setHours(14, 30, 0, 0); // 2:30 PM
  
  const simulationStatus = {
    enabled: true,
    currentSimulatedDate: futureDate.toISOString(),
    activatedBy: 'Test Admin',
    activatedAt: new Date().toISOString(),
    smsSimulation: true,
    emailSimulation: true,
    dataSimulation: true,
    chartSimulation: false
  };
  
  localStorage.setItem('simulationModeStatus', JSON.stringify(simulationStatus));
  console.log("✓ Simulation mode activated with future date:", futureDate.toLocaleString());
  console.log("✓ Refresh the doctor dashboard to see:");
  console.log("  - Blue simulation banner at top");
  console.log("  - 'Simulated' indicator in topbar");
  console.log("  - Date/time showing simulated time");
  
  return simulationStatus;
}

// Test 2: Add simulation patients to doctor queue
function addSimulationPatients() {
  console.log("\n=== Test 2: Adding Simulation Patients ===");
  
  const testPatients = [
    {
      id: 'SIM-DOC-001',
      name: 'Simulation Patient Alpha',
      patientId: 'PT-SIM-001', 
      type: 'Emergency Checkup',
      status: 'Waiting',
      source: 'admin_simulation',
      queuedAt: new Date().toISOString(),
      priority: 'urgent',
      age: 45,
      gender: 'Male',
      time: '2:45 PM',
      notes: 'Urgent simulation case - test patient'
    },
    {
      id: 'SIM-DOC-002', 
      name: 'Simulation Patient Beta',
      patientId: 'PT-SIM-002',
      type: 'Follow-up',
      status: 'Waiting', 
      source: 'admin_simulation',
      queuedAt: new Date().toISOString(),
      priority: 'normal',
      age: 32,
      gender: 'Female', 
      time: '3:00 PM',
      notes: 'Routine follow-up simulation'
    }
  ];
  
  // Add to doctor queue
  let doctorQueue = JSON.parse(localStorage.getItem('doctorQueueData') || '[]');
  doctorQueue.push(...testPatients);
  localStorage.setItem('doctorQueueData', JSON.stringify(doctorQueue));
  
  // Add to shared checkups for Today's Checkups section
  let sharedCheckups = JSON.parse(localStorage.getItem('sharedCheckupsData') || '[]');
  const checkupEntries = testPatients.map(patient => ({
    ...patient,
    patientName: patient.name,
    duration: '30 min',
    contactNumber: '+1-555-SIM-' + patient.id.slice(-3)
  }));
  sharedCheckups.push(...checkupEntries);
  localStorage.setItem('sharedCheckupsData', JSON.stringify(sharedCheckups));
  
  console.log("✓ Added", testPatients.length, "simulation patients");
  console.log("✓ Refresh doctor dashboard to see:");
  console.log("  - Blue-styled rows in Patient Queue");
  console.log("  - CPU icons in row numbers"); 
  console.log("  - 'From Admin' badges");
  console.log("  - Patients appear in Today's Checkups section");
  
  return testPatients;
}

// Test 3: Test simulation mode deactivation
function deactivateSimulationMode() {
  console.log("\n=== Test 3: Deactivating Simulation Mode ===");
  
  const simulationStatus = {
    enabled: false,
    currentSimulatedDate: null,
    activatedBy: null,
    activatedAt: null,
    smsSimulation: false,
    emailSimulation: false,
    dataSimulation: false,
    chartSimulation: false
  };
  
  localStorage.setItem('simulationModeStatus', JSON.stringify(simulationStatus));
  console.log("✓ Simulation mode deactivated");
  console.log("✓ Refresh doctor dashboard to see:");
  console.log("  - Simulation banner disappears");
  console.log("  - Time returns to real time");
  console.log("  - Simulation patients remain but styled normally");
  
  return simulationStatus;
}

// Test 4: Test time synchronization
function testTimeSynchronization() {
  console.log("\n=== Test 4: Testing Time Synchronization ===");
  
  const testDates = [
    { desc: "Christmas 2024", date: new Date('2024-12-25T10:30:00') },
    { desc: "New Year 2025", date: new Date('2025-01-01T00:00:00') },
    { desc: "Future date", date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } // 30 days ahead
  ];
  
  testDates.forEach((test, index) => {
    setTimeout(() => {
      const simulationStatus = {
        enabled: true,
        currentSimulatedDate: test.date.toISOString(),
        activatedBy: 'Time Test Admin',
        activatedAt: new Date().toISOString(),
        smsSimulation: true,
        emailSimulation: true,
        dataSimulation: false
      };
      
      localStorage.setItem('simulationModeStatus', JSON.stringify(simulationStatus));
      console.log(`✓ Set simulation time to ${test.desc}: ${test.date.toLocaleString()}`);
      
      if (index === testDates.length - 1) {
        console.log("✓ Refresh doctor dashboard between each test to see time changes");
      }
    }, index * 1000);
  });
}

// Test 5: Check current simulation state
function checkSimulationState() {
  console.log("\n=== Test 5: Current Simulation State ===");
  
  const simulationMode = JSON.parse(localStorage.getItem('simulationModeStatus') || '{}');
  const doctorQueue = JSON.parse(localStorage.getItem('doctorQueueData') || '[]');
  const sharedCheckups = JSON.parse(localStorage.getItem('sharedCheckupsData') || '[]');
  
  console.log("Simulation Mode:", simulationMode.enabled ? "ACTIVE" : "INACTIVE");
  if (simulationMode.enabled) {
    console.log("  - Activated by:", simulationMode.activatedBy);
    console.log("  - Simulated date:", simulationMode.currentSimulatedDate ? 
      new Date(simulationMode.currentSimulatedDate).toLocaleString() : 'Real-time');
    console.log("  - Services:", {
      SMS: simulationMode.smsSimulation,
      Email: simulationMode.emailSimulation,
      Data: simulationMode.dataSimulation
    });
  }
  
  const simulationPatients = doctorQueue.filter(p => p.source === 'admin_simulation');
  console.log(`Doctor Queue: ${doctorQueue.length} total, ${simulationPatients.length} simulation patients`);
  
  const simulationCheckups = sharedCheckups.filter(c => c.source === 'admin_simulation');
  console.log(`Shared Checkups: ${sharedCheckups.length} total, ${simulationCheckups.length} simulation checkups`);
  
  return {
    simulationMode,
    doctorQueue,
    sharedCheckups,
    simulationPatients,
    simulationCheckups
  };
}

// Test 6: Clear all simulation data
function clearSimulationData() {
  console.log("\n=== Test 6: Clearing Simulation Data ===");
  
  localStorage.removeItem('simulationModeStatus');
  localStorage.removeItem('doctorQueueData');
  localStorage.removeItem('sharedCheckupsData');
  
  console.log("✓ Cleared all simulation data");
  console.log("✓ Refresh doctor dashboard to see clean state");
}

// Auto-run basic test
console.log("\n=== Available Test Commands ===");
console.log("1. activateSimulationMode() - Enable simulation with future date");
console.log("2. addSimulationPatients() - Add test patients to queue");
console.log("3. deactivateSimulationMode() - Disable simulation mode");
console.log("4. testTimeSynchronization() - Test different simulated times");
console.log("5. checkSimulationState() - View current state");
console.log("6. clearSimulationData() - Clear all test data");

// Check if user wants to run auto test
if (confirm("Run automatic doctor dashboard simulation test?\n\nThis will:\n1. Activate simulation mode\n2. Add test patients\n3. Show current state\n\nRefresh the page between steps to see changes.")) {
  console.log("\n=== Running Automatic Test ===");
  
  // Step 1: Activate simulation
  activateSimulationMode();
  
  // Step 2: Add patients after delay
  setTimeout(() => {
    addSimulationPatients();
    
    // Step 3: Show state after another delay
    setTimeout(() => {
      checkSimulationState();
      console.log("\n✅ Automatic test completed!");
      console.log("🔄 Refresh the doctor dashboard to see all changes");
      console.log("⚡ Try different test commands above for more testing");
    }, 1000);
  }, 1000);
}
