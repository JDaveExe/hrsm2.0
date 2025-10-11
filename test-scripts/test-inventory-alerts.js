// Test inventory alerts connection
console.log('🧪 Testing Inventory Alerts Connection');
console.log('====================================');

async function testInventoryAPI() {
  try {
    // Test the inventory endpoints
    console.log('1. Testing vaccines endpoint...');
    
    const vaccineResponse = await fetch('http://localhost:5000/api/inventory/vaccines', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if needed
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    console.log(`Vaccines API Status: ${vaccineResponse.status}`);
    
    if (vaccineResponse.ok) {
      const vaccines = await vaccineResponse.json();
      console.log(`✅ Found ${vaccines.length} vaccines`);
      
      // Calculate alerts manually to verify
      const lowStockVaccines = vaccines.filter(v => v.dosesInStock > 0 && v.dosesInStock <= (v.minimumStock || 0));
      const emptyStockVaccines = vaccines.filter(v => v.dosesInStock === 0);
      
      // Check expiring vaccines (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringVaccines = vaccines.filter(v => {
        if (!v.expiryDate) return false;
        return new Date(v.expiryDate) <= thirtyDaysFromNow;
      });

      console.log(`📊 Vaccine Alerts:`);
      console.log(`   - Empty Stock: ${emptyStockVaccines.length}`);
      console.log(`   - Low Stock: ${lowStockVaccines.length}`);
      console.log(`   - Expiring: ${expiringVaccines.length}`);

      if (emptyStockVaccines.length > 0) {
        console.log(`   Empty vaccines:`, emptyStockVaccines.map(v => v.name));
      }
      if (lowStockVaccines.length > 0) {
        console.log(`   Low stock vaccines:`, lowStockVaccines.map(v => `${v.name} (${v.dosesInStock}/${v.minimumStock})`));
      }
      if (expiringVaccines.length > 0) {
        console.log(`   Expiring vaccines:`, expiringVaccines.map(v => `${v.name} (${v.expiryDate})`));
      }
    } else {
      console.log('❌ Failed to fetch vaccines');
    }

    console.log('\n2. Testing medications endpoint...');
    
    const medicationResponse = await fetch('http://localhost:5000/api/inventory/medications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });

    console.log(`Medications API Status: ${medicationResponse.status}`);
    
    if (medicationResponse.ok) {
      const medications = await medicationResponse.json();
      console.log(`✅ Found ${medications.length} medications`);
      
      // Calculate alerts manually
      const lowStockMeds = medications.filter(m => m.unitsInStock > 0 && m.unitsInStock <= (m.minimumStock || 0));
      const emptyStockMeds = medications.filter(m => m.unitsInStock === 0);
      
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringMeds = medications.filter(m => {
        if (!m.expiryDate) return false;
        return new Date(m.expiryDate) <= thirtyDaysFromNow;
      });

      console.log(`📊 Medication Alerts:`);
      console.log(`   - Empty Stock: ${emptyStockMeds.length}`);
      console.log(`   - Low Stock: ${lowStockMeds.length}`);
      console.log(`   - Expiring: ${expiringMeds.length}`);

      if (emptyStockMeds.length > 0) {
        console.log(`   Empty medications:`, emptyStockMeds.map(m => m.name));
      }
      if (lowStockMeds.length > 0) {
        console.log(`   Low stock medications:`, lowStockMeds.map(m => `${m.name} (${m.unitsInStock}/${m.minimumStock})`));
      }

      // Calculate total alerts
      const totalCritical = emptyStockVaccines.length + lowStockVaccines.length + emptyStockMeds.length + lowStockMeds.length;
      const totalExpiring = expiringVaccines.length + expiringMeds.length;

      console.log(`\n📈 TOTAL ALERTS CALCULATION:`);
      console.log(`   Critical Stock: ${totalCritical}`);
      console.log(`   Expiring Soon: ${totalExpiring}`);
      console.log(`\nThis should match what you see in the badges!`);
    } else {
      console.log('❌ Failed to fetch medications');
    }

  } catch (error) {
    console.log('❌ Error testing inventory API:', error.message);
    console.log('💡 Make sure the backend is running on port 5000');
  }
}

// Check if we're in browser environment
if (typeof fetch !== 'undefined') {
  testInventoryAPI();
} else {
  console.log('❌ This test needs to run in a browser console');
  console.log('💡 Copy and paste this into the browser console while on the admin page');
}
