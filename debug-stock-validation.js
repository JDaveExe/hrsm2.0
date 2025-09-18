/**
 * Debug test to see exactly what's happening with stock validation
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

async function debugStockValidation() {
  try {
    console.log('🔍 Debugging stock validation...\n');
    
    // Step 1: Authenticate
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: 'admin', password: 'admin123' })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Authenticated');
    
    // Step 2: Set a vaccine to exactly 0 stock
    const vaccinesDataPath = path.join(__dirname, 'backend/data/vaccines.json');
    const vaccinesData = JSON.parse(await fs.readFile(vaccinesDataPath, 'utf8'));
    
    // Use the last vaccine for testing
    const testVaccineIndex = vaccinesData.length - 1;
    const originalStock = vaccinesData[testVaccineIndex].dosesInStock;
    
    // Set to exactly 0
    vaccinesData[testVaccineIndex].dosesInStock = 0;
    await fs.writeFile(vaccinesDataPath, JSON.stringify(vaccinesData, null, 2));
    
    console.log(`📋 Set ${vaccinesData[testVaccineIndex].name} stock to 0`);
    console.log(`   Vaccine ID: ${vaccinesData[testVaccineIndex].id}`);
    
    // Step 3: Attempt vaccination with full response logging
    const vaccinationData = {
      patientId: 104,
      vaccineId: vaccinesData[testVaccineIndex].id,
      vaccineName: vaccinesData[testVaccineIndex].name,
      batchNumber: 'TEST-001',
      administrationSite: 'left-arm',
      dose: '1',
      administeredBy: 'Debug Test',
      notes: 'Debug test for stock validation',
      adverseReactions: 'none',
      category: 'Test',
      administrationRoute: 'Intramuscular'
    };
    
    console.log('\n🧪 Attempting vaccination...');
    console.log('Request data:', JSON.stringify(vaccinationData, null, 2));
    
    const response = await fetch('http://localhost:5000/api/vaccinations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(vaccinationData)
    });
    
    console.log('\n📊 Response status:', response.status);
    
    const responseData = await response.json();
    console.log('Response data:', JSON.stringify(responseData, null, 2));
    
    // Step 4: Check if vaccination was actually created
    if (!response.ok) {
      console.log('✅ Vaccination was properly rejected');
      
      // Verify no vaccination record was created
      const checkResponse = await fetch(`http://localhost:5000/api/vaccinations/patient/104`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (checkResponse.ok) {
        const existingVaccinations = await checkResponse.json();
        const debugVaccination = existingVaccinations.find(v => v.notes === 'Debug test for stock validation');
        
        if (debugVaccination) {
          console.log('❌ PROBLEM: Vaccination record was created despite stock check!');
        } else {
          console.log('✅ GOOD: No vaccination record was created');
        }
      }
    } else {
      console.log('❌ Vaccination was incorrectly allowed!');
    }
    
    // Step 5: Restore stock
    vaccinesData[testVaccineIndex].dosesInStock = originalStock;
    await fs.writeFile(vaccinesDataPath, JSON.stringify(vaccinesData, null, 2));
    console.log(`\n🔧 Restored stock to ${originalStock}`);
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugStockValidation();