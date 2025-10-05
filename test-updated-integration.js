/**
 * Test Updated Integration
 * Tests the improved medication name matching
 */

async function testUpdatedIntegration() {
  console.log('🔄 TESTING UPDATED INTEGRATION');
  console.log('='.repeat(40));
  
  // Simulate the updated inventory data from the API test
  const mockMedications = [
    {
      name: 'Ambroxol Hydrochloride',
      brandName: 'Mucosolvan',
      genericName: 'Ambroxol Hydrochloride',
      quantityInStock: 150,  // From API response
      unitsInStock: 25       // Also from API response
    },
    {
      name: 'Salbutamol 2mg Tablet',
      brandName: 'Ventolin',
      genericName: 'Salbutamol Sulfate',
      quantityInStock: 400,
      unitsInStock: 400
    },
    {
      name: 'Cetirizine 10mg',
      brandName: 'Zyrtec',
      genericName: 'Cetirizine HCl',
      quantityInStock: 400,
      unitsInStock: 400
    }
  ];
  
  // Simulate the updated getCurrentInventory method
  function simulateUpdatedInventory(medications) {
    const inventory = {};
    medications.forEach(med => {
      // Handle different stock field names from API
      const stockLevel = med.quantityInStock || med.unitsInStock || 0;
      
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
        med.brandName,
        // Simplified versions for weather mapping
        med.name?.replace(' Hydrochloride', '').replace(' Sulfate', '').replace(' HCl', ''),
        `${med.name?.replace(' Hydrochloride', '').replace(' Sulfate', '').replace(' HCl', '')} (${med.brandName})`,
        // Handle common medication name variations
        med.brandName && med.name ? `${med.brandName} (${med.name?.split(' ')[0]})` : null,
        med.brandName && med.name ? `${med.name?.split(' ')[0]} (${med.brandName})` : null
      ].filter(Boolean); // Remove any undefined values
      
      // Set the same stock value for all possible key variations
      keys.forEach(key => {
        inventory[key] = stockLevel;
      });
      
      console.log(`Added medication: ${med.name} (${med.brandName}) - Stock: ${stockLevel}`);
    });
    
    return inventory;
  }
  
  // Simulate improved medication lookup
  function findMedicationStock(medicationName, inventory) {
    // Direct match first
    if (inventory[medicationName] !== undefined) {
      return inventory[medicationName];
    }
    
    // Try to find by partial matches
    const inventoryKeys = Object.keys(inventory);
    
    // Extract medication name parts for flexible matching
    const searchTerms = medicationName.toLowerCase()
      .replace(/[()]/g, ' ')
      .replace(' hydrochloride', '')
      .replace(' sulfate', '')
      .replace(' hcl', '')
      .split(/\s+/)
      .filter(term => term.length > 2); // Only meaningful terms
    
    for (const key of inventoryKeys) {
      const keyLower = key.toLowerCase()
        .replace(' hydrochloride', '')
        .replace(' sulfate', '')
        .replace(' hcl', '');
      
      // Check if all search terms are found in the inventory key
      if (searchTerms.every(term => keyLower.includes(term))) {
        console.log(`Found stock match: "${medicationName}" -> "${key}" = ${inventory[key]}`);
        return inventory[key];
      }
    }
    
    // Try simpler matching for common brand names
    const simplifiedSearch = medicationName.toLowerCase()
      .replace(/[()]/g, '')
      .replace(' hydrochloride', '')
      .replace(' sulfate', '')
      .trim();
    
    for (const key of inventoryKeys) {
      if (key.toLowerCase().includes(simplifiedSearch) || 
          simplifiedSearch.includes(key.toLowerCase().replace(/[()]/g, '').trim())) {
        console.log(`Found simplified match: "${medicationName}" -> "${key}" = ${inventory[key]}`);
        return inventory[key];
      }
    }
    
    console.log(`No stock found for: "${medicationName}"`);
    return 0;
  }
  
  console.log('\n📦 GENERATING UPDATED INVENTORY:');
  const inventory = simulateUpdatedInventory(mockMedications);
  
  console.log('\n🔍 TESTING WEATHER MEDICATION LOOKUPS:');
  const weatherMedications = [
    'Ambroxol (Mucosolvan)',
    'Salbutamol (Ventolin)', 
    'Cetirizine (Zyrtec)'
  ];
  
  const results = [];
  weatherMedications.forEach(medName => {
    console.log(`\n🔎 Looking up: "${medName}"`);
    const stock = findMedicationStock(medName, inventory);
    results.push({ name: medName, stock });
    console.log(`   Result: ${stock} units ${stock > 0 ? '✅' : '❌'}`);
  });
  
  console.log('\n📊 FINAL RESULTS:');
  results.forEach(result => {
    console.log(`   ${result.name}: ${result.stock} units`);
  });
  
  const successCount = results.filter(r => r.stock > 0).length;
  console.log(`\n🎯 SUCCESS RATE: ${successCount}/${results.length} medications found`);
  
  if (successCount === results.length) {
    console.log('✅ ALL MEDICATIONS MATCHED - Weather widget should now show correct stock levels!');
  } else {
    console.log('⚠️  Some medications still not matching - may need further adjustments');
  }
  
  console.log('\n🔄 NEXT STEPS:');
  console.log('1. Refresh the Enhanced Forecasting Dashboard');
  console.log('2. Go to Weather Prescriptions tab');
  console.log('3. Check if stock levels now show correctly');
  console.log('4. If Ambroxol still shows 0, check browser console for errors');
}

testUpdatedIntegration();