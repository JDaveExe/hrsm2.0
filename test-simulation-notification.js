// Quick Test Script for Simulation Notification
// Paste this in browser console on doctor dashboard to test notification

console.log("=== Testing Simulation Notification ===");

// Test 1: Activate simulation mode
function activateSimulationMode() {
  const simulationStatus = {
    enabled: true,
    currentSimulatedDate: new Date().toISOString(),
    activatedBy: 'Test Admin',
    activatedAt: new Date().toISOString(),
    smsSimulation: true,
    emailSimulation: true,
    dataSimulation: false
  };
  
  localStorage.setItem('simulationModeStatus', JSON.stringify(simulationStatus));
  console.log("✓ Simulation mode activated");
  console.log("Refresh the doctor dashboard to see the notification bar");
  
  return simulationStatus;
}

// Test 2: Deactivate simulation mode
function deactivateSimulationMode() {
  const simulationStatus = {
    enabled: false,
    currentSimulatedDate: null,
    activatedBy: null,
    activatedAt: null,
    smsSimulation: false,
    emailSimulation: false,
    dataSimulation: false
  };
  
  localStorage.setItem('simulationModeStatus', JSON.stringify(simulationStatus));
  console.log("✓ Simulation mode deactivated");
  console.log("Refresh the doctor dashboard - notification should disappear");
  
  return simulationStatus;
}

// Test 3: Check current simulation status
function checkSimulationStatus() {
  const status = JSON.parse(localStorage.getItem('simulationModeStatus') || '{}');
  console.log("Current simulation status:", status);
  
  if (status.enabled) {
    console.log("🟢 Simulation mode is ACTIVE");
    console.log("- Activated by:", status.activatedBy);
    console.log("- Activated at:", status.activatedAt);
    console.log("- Simulated date:", status.currentSimulatedDate);
  } else {
    console.log("🔴 Simulation mode is INACTIVE");
  }
  
  return status;
}

// Auto-run status check
console.log("\nCurrent Status:");
checkSimulationStatus();

console.log("\n=== Available Test Functions ===");
console.log("1. activateSimulationMode() - Turn on simulation and refresh to see notification");
console.log("2. deactivateSimulationMode() - Turn off simulation and refresh");
console.log("3. checkSimulationStatus() - Check current simulation state");

console.log("\n=== Quick Test ===");
console.log("Run: activateSimulationMode() then refresh the page to see notification");
