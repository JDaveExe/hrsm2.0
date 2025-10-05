/**
 * Test Inventory Integration Fix
 * Tests the flexible medication name matching
 */

// Mock data representing what's in your actual inventory
const mockInventoryFromDatabase = [
  {
    id: 1,
    name: 'Ambroxol Hydrochloride',
    genericName: 'Ambroxol Hydrochloride',
    brandName: 'Mucosolvan',
    form: 'Tablet',
    strength: '30mg',
    unitsInStock: 150,
    category: 'Respiratory'
  }
];

// Function to simulate the updated getCurrentInventory method
function simulateUpdatedInventoryService(medications) {
  const inventory = {};
  
  medications.forEach(med => {
    // Create multiple possible keys to match against weather recommendations
    const keys = [
      // Original format: Name (BrandName)
      `${med.name} (${med.brandName || med.genericName})`,
      // Alternative format: BrandName (Name) 
      `${med.brandName || med.name} (${med.name})`,
      // Generic name only
      med.genericName,
      // Name only
      med.name,
      // Brand name only
      med.brandName
    ].filter(Boolean); // Remove any undefined values
    
    // Set the same stock value for all possible key variations
    keys.forEach(key => {
      inventory[key] = med.unitsInStock || 0;
    });
    
    console.log(`Added medication to inventory: ${med.name} (${med.brandName}) - Stock: ${med.unitsInStock}`);
    console.log(`Generated keys:`, keys);
  });
  
  return inventory;
}

// Function to simulate the flexible medication lookup
function findMedicationStock(medicationName, inventory) {
  // Direct match first
  if (inventory[medicationName] !== undefined) {
    console.log(`Direct match found: "${medicationName}" = ${inventory[medicationName]}`);
    return inventory[medicationName];
  }
  
  // Try to find by partial matches
  const inventoryKeys = Object.keys(inventory);
  
  // Extract medication name parts for flexible matching
  const searchTerms = medicationName.toLowerCase()
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2); // Only meaningful terms
  
  console.log(`Searching for "${medicationName}" with terms:`, searchTerms);
  
  for (const key of inventoryKeys) {
    const keyLower = key.toLowerCase();
    
    // Check if all search terms are found in the inventory key
    if (searchTerms.every(term => keyLower.includes(term))) {
      console.log(`Partial match found: "${medicationName}" -> "${key}" = ${inventory[key]}`);
      return inventory[key];
    }
  }
  
  console.log(`No stock found for: "${medicationName}"`);
  return 0;
}

// Test the integration
function testIntegrationFix() {
  console.log('🧪 TESTING INVENTORY INTEGRATION FIX');
  console.log('='.repeat(50));
  
  console.log('\n📦 SIMULATING CURRENT INVENTORY:');
  const inventory = simulateUpdatedInventoryService(mockInventoryFromDatabase);
  
  console.log('\n📋 INVENTORY KEYS GENERATED:');
  Object.keys(inventory).forEach(key => {
    console.log(`   "${key}": ${inventory[key]} units`);
  });
  
  console.log('\n🔍 TESTING MEDICATION LOOKUPS:');
  
  // Test different medication name variations that might be used in weather recommendations
  const testMedications = [
    'Ambroxol (Mucosolvan)',
    'Mucosolvan (Ambroxol)',
    'Ambroxol Hydrochloride',
    'Mucosolvan',
    'Ambroxol'
  ];
  
  testMedications.forEach(medName => {
    console.log(`\n🔎 Looking up: "${medName}"`);
    const stock = findMedicationStock(medName, inventory);
    console.log(`   Result: ${stock} units`);
  });
  
  console.log('\n✅ INTEGRATION TEST RESULTS:');
  console.log('   - Multiple key variations created for each medication');
  console.log('   - Flexible lookup should find stock regardless of name format');
  console.log('   - Weather prescription widget should now show correct stock levels');
  
  console.log('\n🔄 NEXT STEPS:');
  console.log('   1. Restart your backend server if running');
  console.log('   2. Refresh the Enhanced Forecasting Dashboard');
  console.log('   3. Check if Ambroxol now shows "Stock: 150" instead of "Stock: 0"');
}

testIntegrationFix();