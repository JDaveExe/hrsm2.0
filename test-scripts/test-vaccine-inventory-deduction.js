/**
 * Test script to verify vaccine inventory deduction when completing vaccination
 */

const fetch = require('node-fetch');

async function testVaccineInventoryDeduction() {
  try {
    console.log('🧪 Testing vaccine inventory deduction on vaccination completion...\n');
    
    // Step 1: Authenticate
    console.log('1. Authenticating...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        login: 'admin', 
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.statusText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Authentication successful');
    
    // Step 2: Get current vaccine inventory 
    console.log('\n2. Checking current vaccine inventory...');
    const inventoryResponse = await fetch('http://localhost:5000/api/inventory/vaccines', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!inventoryResponse.ok) {
      throw new Error(`Failed to fetch inventory: ${inventoryResponse.statusText}`);
    }
    
    const vaccines = await inventoryResponse.json();
    console.log(`✅ Found ${vaccines.length} vaccines in inventory`);
    
    // Pick the first vaccine with stock > 0 for testing
    const testVaccine = vaccines.find(v => v.dosesInStock > 0);
    
    if (!testVaccine) {
      console.log('❌ No vaccines with stock available for testing');
      return;
    }
    
    console.log(`📋 Testing with vaccine: ${testVaccine.name}`);
    console.log(`   Current stock: ${testVaccine.dosesInStock} doses`);
    console.log(`   Vaccine ID: ${testVaccine.id}`);
    
    // Step 3: Create a test vaccination record (simulating "Complete Vaccination" button)
    console.log('\n3. Creating vaccination record (simulating Complete Vaccination)...');
    
    const vaccinationData = {
      patientId: 104, // Sofia Gonzales (existing test patient)
      vaccineId: testVaccine.id,
      vaccineName: testVaccine.name,
      batchNumber: testVaccine.batchNumber || 'TEST-BATCH-001',
      administrationSite: 'left-arm',
      dose: '1',
      administeredBy: 'Test Administrator',
      notes: 'Test vaccination for inventory deduction verification',
      adverseReactions: 'none',
      category: testVaccine.category || 'Test',
      administrationRoute: testVaccine.administrationRoute || 'Intramuscular'
    };
    
    const vaccinationResponse = await fetch('http://localhost:5000/api/vaccinations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(vaccinationData)
    });
    
    if (!vaccinationResponse.ok) {
      const errorData = await vaccinationResponse.json();
      throw new Error(`Vaccination creation failed: ${vaccinationResponse.status} - ${errorData.message}`);
    }
    
    const vaccinationResult = await vaccinationResponse.json();
    console.log('✅ Vaccination record created successfully');
    console.log(`   Vaccination ID: ${vaccinationResult.vaccination.id}`);
    
    // Step 4: Verify inventory was reduced
    console.log('\n4. Verifying inventory reduction...');
    
    const updatedInventoryResponse = await fetch('http://localhost:5000/api/inventory/vaccines', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!updatedInventoryResponse.ok) {
      throw new Error(`Failed to fetch updated inventory: ${updatedInventoryResponse.statusText}`);
    }
    
    const updatedVaccines = await updatedInventoryResponse.json();
    const updatedVaccine = updatedVaccines.find(v => v.id === testVaccine.id);
    
    if (!updatedVaccine) {
      throw new Error('Updated vaccine not found in inventory');
    }
    
    const expectedStock = testVaccine.dosesInStock - 1;
    const actualStock = updatedVaccine.dosesInStock;
    
    console.log(`📊 Stock verification:`);
    console.log(`   Original stock: ${testVaccine.dosesInStock}`);
    console.log(`   Expected stock: ${expectedStock}`);
    console.log(`   Actual stock: ${actualStock}`);
    
    if (actualStock === expectedStock) {
      console.log('✅ SUCCESS: Inventory correctly reduced by 1 dose!');
    } else {
      console.log('❌ FAILED: Inventory was not properly reduced');
    }
    
    // Step 5: Test stock depletion scenario
    console.log('\n5. Testing stock depletion scenario...');
    
    // Find a vaccine with very low stock or create a scenario
    const lowStockVaccine = vaccines.find(v => v.dosesInStock <= 2);
    
    if (lowStockVaccine) {
      console.log(`📋 Testing depletion with: ${lowStockVaccine.name} (${lowStockVaccine.dosesInStock} doses)`);
      
      // Try to create multiple vaccinations to deplete stock
      for (let i = 0; i < lowStockVaccine.dosesInStock + 1; i++) {
        const testVaccinationData = {
          ...vaccinationData,
          vaccineId: lowStockVaccine.id,
          vaccineName: lowStockVaccine.name,
          notes: `Test vaccination ${i + 1} - stock depletion test`
        };
        
        const testResponse = await fetch('http://localhost:5000/api/vaccinations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(testVaccinationData)
        });
        
        if (testResponse.ok) {
          console.log(`   ✅ Vaccination ${i + 1} completed`);
        } else {
          const errorData = await testResponse.json();
          console.log(`   ❌ Vaccination ${i + 1} failed: ${errorData.message}`);
          
          if (errorData.message.includes('No stock available')) {
            console.log('   ✅ SUCCESS: Stock depletion properly prevented further vaccinations');
            break;
          }
        }
      }
    } else {
      console.log('   ℹ️  No low-stock vaccines available for depletion testing');
    }
    
    console.log('\n🎉 Vaccine inventory deduction test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVaccineInventoryDeduction();