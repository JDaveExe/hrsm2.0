// Simple expiring items test - paste in console after typing "allow pasting"
console.log('🧪 Testing Expiring Items Calculation');

async function testExpiringItems() {
  try {
    // Get current date
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    console.log(`Today: ${today.toLocaleDateString()}`);
    console.log(`30 days from now: ${thirtyDaysFromNow.toLocaleDateString()}`);
    
    // Test vaccines
    const vaccineRes = await fetch('/api/inventory/vaccines');
    if (vaccineRes.ok) {
      const vaccines = await vaccineRes.json();
      const expiringVaccines = vaccines.filter(v => {
        if (!v.expiryDate) return false;
        const expiryDate = new Date(v.expiryDate);
        return expiryDate <= thirtyDaysFromNow;
      });
      
      console.log(`\n📊 VACCINES (${vaccines.length} total):`);
      console.log(`   Expiring within 30 days: ${expiringVaccines.length}`);
      expiringVaccines.forEach(v => {
        console.log(`   - ${v.name}: ${new Date(v.expiryDate).toLocaleDateString()}`);
      });
    }
    
    // Test medications  
    const medRes = await fetch('/api/inventory/medications');
    if (medRes.ok) {
      const medications = await medRes.json();
      const expiringMeds = medications.filter(m => {
        if (!m.expiryDate) return false;
        const expiryDate = new Date(m.expiryDate);
        return expiryDate <= thirtyDaysFromNow;
      });
      
      console.log(`\n📊 MEDICATIONS (${medications.length} total):`);
      console.log(`   Expiring within 30 days: ${expiringMeds.length}`);
      expiringMeds.forEach(m => {
        console.log(`   - ${m.name}: ${new Date(m.expiryDate).toLocaleDateString()}`);
      });
      
      const totalExpiring = expiringVaccines.length + expiringMeds.length;
      console.log(`\n🎯 TOTAL EXPIRING: ${totalExpiring}`);
      console.log(`Current badge shows: 37`);
      console.log(`Should show: ${totalExpiring}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testExpiringItems();
