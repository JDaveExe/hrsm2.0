// Script to verify real expiry dates from vaccine and prescription inventories
const http = require('http');

console.log('🧪 Verifying Real Expiry Data from Inventories\n');

// Test vaccines inventory for expiry dates
const testVaccineInventory = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inventory/vaccines',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const vaccines = JSON.parse(data);
          console.log('💉 VACCINE INVENTORY EXPIRY ANALYSIS:');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Total Vaccines: ${vaccines.length}`);
          
          // Analyze expiry dates
          const today = new Date();
          const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          
          const withExpiry = vaccines.filter(v => v.expiryDate);
          const expiringSoon = vaccines.filter(v => {
            if (!v.expiryDate) return false;
            const expiryDate = new Date(v.expiryDate);
            return expiryDate <= next30Days && expiryDate >= today;
          });
          
          const expired = vaccines.filter(v => {
            if (!v.expiryDate) return false;
            const expiryDate = new Date(v.expiryDate);
            return expiryDate < today;
          });
          
          if (vaccines.length > 0) {
            
            console.log(`   Vaccines with Expiry Dates: ${withExpiry.length}`);
            console.log(`   Expiring in Next 30 Days: ${expiringSoon.length}`);
            console.log(`   Already Expired: ${expired.length}`);
            
            if (expiringSoon.length > 0) {
              console.log('   🟠 Vaccines Expiring Soon:');
              expiringSoon.slice(0, 5).forEach((vaccine, index) => {
                console.log(`     ${index + 1}. ${vaccine.name} - expires ${vaccine.expiryDate} (${vaccine.dosesInStock || 0} doses)`);
              });
            }
            
            if (expired.length > 0) {
              console.log('   🔴 Expired Vaccines:');
              expired.slice(0, 5).forEach((vaccine, index) => {
                console.log(`     ${index + 1}. ${vaccine.name} - expired ${vaccine.expiryDate} (${vaccine.dosesInStock || 0} doses)`);
              });
            }
          }
          
          console.log('');
          resolve({ vaccines: vaccines.length, expiringSoon: expiringSoon.length, expired: expired.length });
        } catch (error) {
          console.log('❌ Failed to parse vaccine inventory:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Vaccine inventory request failed:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Test medications inventory for expiry dates  
const testMedicationInventory = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/inventory/medications',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const medications = JSON.parse(data);
          console.log('💊 MEDICATION INVENTORY EXPIRY ANALYSIS:');
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Total Medications: ${medications.length}`);
          
          // Analyze expiry dates
          const today = new Date();
          const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          
          const withExpiry = medications.filter(m => m.expiryDate);
          const expiringSoon = medications.filter(m => {
            if (!m.expiryDate) return false;
            const expiryDate = new Date(m.expiryDate);
            return expiryDate <= next30Days && expiryDate >= today;
          });
          
          const expired = medications.filter(m => {
            if (!m.expiryDate) return false;
            const expiryDate = new Date(m.expiryDate);
            return expiryDate < today;
          });
          
          if (medications.length > 0) {
            
            console.log(`   Medications with Expiry Dates: ${withExpiry.length}`);
            console.log(`   Expiring in Next 30 Days: ${expiringSoon.length}`);
            console.log(`   Already Expired: ${expired.length}`);
            
            if (expiringSoon.length > 0) {
              console.log('   🟠 Medications Expiring Soon:');
              expiringSoon.slice(0, 5).forEach((medication, index) => {
                console.log(`     ${index + 1}. ${medication.name} - expires ${medication.expiryDate} (${medication.quantity || 0} units)`);
              });
            }
            
            if (expired.length > 0) {
              console.log('   🔴 Expired Medications:');
              expired.slice(0, 5).forEach((medication, index) => {
                console.log(`     ${index + 1}. ${medication.name} - expired ${medication.expiryDate} (${medication.quantity || 0} units)`);
              });
            }
          }
          
          console.log('');
          resolve({ medications: medications.length, expiringSoon: expiringSoon.length, expired: expired.length });
        } catch (error) {
          console.log('❌ Failed to parse medication inventory:', error.message);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Medication inventory request failed:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Run the verification
const runExpiryVerification = async () => {
  try {
    console.log('🔍 Checking Real Expiry Data in Inventories...\n');
    
    const vaccineData = await testVaccineInventory();
    const medicationData = await testMedicationInventory();
    
    console.log('📊 EXPIRY SUMMARY:');
    console.log('==================');
    console.log(`Total Inventory Items: ${vaccineData.vaccines + medicationData.medications}`);
    console.log(`Items Expiring Soon (30 days): ${vaccineData.expiringSoon + medicationData.expiringSoon}`);
    console.log(`Already Expired Items: ${vaccineData.expired + medicationData.expired}`);
    
    console.log('\n🎯 EXPECTED EXPIRY DATE MANAGEMENT CHART:');
    if (vaccineData.expiringSoon > 0 || medicationData.expiringSoon > 0 || vaccineData.expired > 0 || medicationData.expired > 0) {
      console.log('✅ Should show REAL expiry data with categories like:');
      console.log(`   - Medications Expiring Soon: ${medicationData.expiringSoon} items`);
      console.log(`   - Vaccines Expiring Soon: ${vaccineData.expiringSoon} items`);
      console.log(`   - Medications Expired: ${medicationData.expired} items`);
      console.log(`   - Vaccines Expired: ${vaccineData.expired} items`);
    } else {
      console.log('✅ Should show "No expiry issues detected" (real empty state)');
    }
    
    console.log('\n❌ CURRENT PROBLEM:');
    console.log('- Management Dashboard showing "Sample Data" with Category A, B, C, D');
    console.log('- Not using real expiry dates from inventory APIs');
    
    console.log('\n🛠️  SOLUTION NEEDED:');
    console.log('- Update Management ReportsManager to use real inventory expiry data');
    console.log('- Replace sample data with actual expiry analysis from API responses');
    
  } catch (error) {
    console.log('💥 Verification failed:', error.message);
    process.exit(1);
  }
};

runExpiryVerification();