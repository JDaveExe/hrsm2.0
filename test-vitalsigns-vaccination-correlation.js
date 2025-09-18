/**
 * Test script to check vital signs and vaccination correlation for patient 104
 */

const fetch = require('node-fetch');

async function testVitalSignsVaccinationCorrelation() {
  try {
    console.log('🧪 Testing vital signs and vaccination correlation...');
    
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
    
    // Step 2: Get vaccination records for patient 104
    console.log('2. Fetching vaccination records for patient 104...');
    const vaccinationResponse = await fetch('http://localhost:5000/api/vaccinations/patient/104', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!vaccinationResponse.ok) {
      throw new Error(`Failed to fetch vaccinations: ${vaccinationResponse.statusText}`);
    }
    
    const vaccinationData = await vaccinationResponse.json();
    console.log(`✅ Found ${vaccinationData?.length || 0} vaccination records`);
    
    if (vaccinationData && vaccinationData.length > 0) {
      vaccinationData.forEach((vax, index) => {
        console.log(`  Vaccination ${index + 1}: ${vax.vaccineName} on ${new Date(vax.administeredAt).toDateString()}`);
      });
    }
    
    // Step 3: Get vital signs history for patient 104  
    console.log('3. Fetching vital signs history for patient 104...');
    const vitalSignsResponse = await fetch('http://localhost:5000/api/checkups/vital-signs/history/104', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!vitalSignsResponse.ok) {
      throw new Error(`Failed to fetch vital signs: ${vitalSignsResponse.statusText}`);
    }
    
    const vitalSignsData = await vitalSignsResponse.json();
    console.log(`✅ Found ${vitalSignsData.length || 0} vital signs records`);
    
    if (vitalSignsData && vitalSignsData.length > 0) {
      vitalSignsData.forEach((vs, index) => {
        console.log(`  Vital Signs ${index + 1}: ${new Date(vs.recordedAt).toDateString()} - ${vs.temperature || 'N/A'}°C`);
      });
    }
    
    // Step 4: Check for date correlation
    console.log('4. Checking for date correlations...');
    if (vaccinationData && vitalSignsData) {
      let correlations = 0;
      
      vaccinationData.forEach(vax => {
        const vaxDate = new Date(vax.administeredAt).toDateString();
        const matchingVitalSigns = vitalSignsData.filter(vs => {
          return new Date(vs.recordedAt).toDateString() === vaxDate;
        });
        
        if (matchingVitalSigns.length > 0) {
          correlations++;
          console.log(`  ✅ Correlation found: ${vax.vaccineName} and ${matchingVitalSigns.length} vital signs record(s) on ${vaxDate}`);
        } else {
          console.log(`  ❌ No vital signs correlation for ${vax.vaccineName} on ${vaxDate}`);
        }
      });
      
      console.log(`📊 Total correlations found: ${correlations}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testVitalSignsVaccinationCorrelation();