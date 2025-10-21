// Browser console test to debug inventory alerts
// Copy and paste this into your browser console while on the admin dashboard

console.log('🔍 Debugging Inventory Alerts');
console.log('============================');

// Check if the InventoryAlerts component is loaded
const alertsContainer = document.querySelector('.inventory-alerts');
console.log('Alerts container found:', !!alertsContainer);

if (alertsContainer) {
  const badges = alertsContainer.querySelectorAll('.alert-badge');
  console.log(`Found ${badges.length} alert badges`);
  
  badges.forEach((badge, index) => {
    const countElement = badge.querySelector('.alert-count');
    const textElement = badge.querySelector('.alert-text');
    const count = countElement ? countElement.textContent : 'No count';
    const text = textElement ? textElement.textContent : 'No text';
    console.log(`Badge ${index + 1}: ${count} ${text}`);
  });
}

// Check localStorage for auth token
const token = localStorage.getItem('token');
console.log('Auth token present:', !!token);

// Test the API endpoints directly
console.log('\n🌐 Testing API endpoints...');

async function testAPIs() {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    // Test vaccines endpoint
    console.log('Testing /api/inventory/vaccines...');
    const vaccineRes = await fetch('/api/inventory/vaccines', { headers });
    console.log(`Vaccines response: ${vaccineRes.status} ${vaccineRes.statusText}`);
    
    if (vaccineRes.ok) {
      const vaccines = await vaccineRes.json();
      console.log(`✅ Vaccines loaded: ${vaccines.length} items`);
      
      // Check for low stock
      const lowStock = vaccines.filter(v => v.dosesInStock <= (v.minimumStock || 0) && v.dosesInStock > 0);
      const empty = vaccines.filter(v => v.dosesInStock === 0);
      console.log(`   Low stock vaccines: ${lowStock.length}`);
      console.log(`   Empty vaccines: ${empty.length}`);
    }

    // Test medications endpoint  
    console.log('Testing /api/inventory/medications...');
    const medRes = await fetch('/api/inventory/medications', { headers });
    console.log(`Medications response: ${medRes.status} ${medRes.statusText}`);
    
    if (medRes.ok) {
      const medications = await medRes.json();
      console.log(`✅ Medications loaded: ${medications.length} items`);
      
      const lowStock = medications.filter(m => m.unitsInStock <= (m.minimumStock || 0) && m.unitsInStock > 0);
      const empty = medications.filter(m => m.unitsInStock === 0);
      console.log(`   Low stock medications: ${lowStock.length}`);
      console.log(`   Empty medications: ${empty.length}`);
    }
    
  } catch (error) {
    console.error('API Test Error:', error);
  }
}

testAPIs();

// Also check if there are any console errors
console.log('\n📋 Check the Network tab in DevTools for any failed API calls');
console.log('📋 Check the Console tab for any JavaScript errors');
console.log('📋 The badges should update automatically when the API calls complete');
