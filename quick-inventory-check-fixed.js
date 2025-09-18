// Quick Inventory Discrepancy Finder (FIXED VERSION)
// Paste this in console after typing "allow pasting"

console.log('🕵️ Quick Inventory Discrepancy Check (Fixed)');
console.log('==========================================');

async function quickCheckFixed() {
  const [vRes, mRes] = await Promise.all([
    fetch('/api/inventory/vaccines'),
    fetch('/api/inventory/medications')
  ]);
  
  const vaccines = await vRes.json();
  const medications = await mRes.json();
  
  // Calculate expected values (FIXED: stock < minStock, not <=)
  const vLow = vaccines.filter(v => v.dosesInStock > 0 && v.dosesInStock < (v.minimumStock || 0)).length;
  const vEmpty = vaccines.filter(v => v.dosesInStock === 0).length;
  const mLow = medications.filter(m => m.unitsInStock > 0 && m.unitsInStock < (m.minimumStock || 0)).length;
  const mEmpty = medications.filter(m => m.unitsInStock === 0).length;
  
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  
  const vExpiring = vaccines.filter(v => v.expiryDate && new Date(v.expiryDate) <= thirtyDays).length;
  const mExpiring = medications.filter(m => m.expiryDate && new Date(m.expiryDate) <= thirtyDays).length;
  
  const expectedCritical = vEmpty + vLow + mEmpty + mLow;
  const expectedExpiring = vExpiring + mExpiring;
  
  // Get actual badge values
  const criticalBadge = document.querySelector('.alert-badge.critical .alert-count')?.textContent || '?';
  const expiringBadge = document.querySelector('.alert-badge.warning .alert-count')?.textContent || '?';
  
  console.log(`FIXED CALCULATION:`);
  console.log(`Expected: Critical=${expectedCritical}, Expiring=${expectedExpiring}`);
  console.log(`Current:  Critical=${criticalBadge}, Expiring=${expiringBadge}`);
  console.log(`Match:    Critical=${criticalBadge == expectedCritical ? '✅' : '❌'}, Expiring=${expiringBadge == expectedExpiring ? '✅' : '❌'}`);
  
  console.log(`\nBREAKDOWN:`);
  console.log(`  Vaccines: Empty=${vEmpty}, Low=${vLow}, Expiring=${vExpiring}`);
  console.log(`  Medications: Empty=${mEmpty}, Low=${mLow}, Expiring=${mExpiring}`);
  
  // Show problematic items with FIXED logic
  if (vEmpty > 0) console.log(`Empty vaccines: ${vaccines.filter(v => v.dosesInStock === 0).map(v => v.name)}`);
  if (vLow > 0) console.log(`Low vaccines: ${vaccines.filter(v => v.dosesInStock > 0 && v.dosesInStock < (v.minimumStock || 0)).map(v => `${v.name} (${v.dosesInStock}/${v.minimumStock})`)}`);
  if (mEmpty > 0) console.log(`Empty meds: ${medications.filter(m => m.unitsInStock === 0).map(m => m.name)}`);
  if (mLow > 0) console.log(`Low meds: ${medications.filter(m => m.unitsInStock > 0 && m.unitsInStock < (m.minimumStock || 0)).map(m => `${m.name} (${m.unitsInStock}/${m.minimumStock})`)}`);
  
  // Special check for the "sample" item that was causing issues
  const sampleItem = medications.find(m => m.name.toLowerCase().includes('sample'));
  if (sampleItem) {
    console.log(`\nSAMPLE ITEM CHECK:`);
    console.log(`  Name: ${sampleItem.name}`);
    console.log(`  Stock: ${sampleItem.unitsInStock}/${sampleItem.minimumStock}`);
    console.log(`  Should be low stock? ${sampleItem.unitsInStock < sampleItem.minimumStock ? 'YES' : 'NO'}`);
  }
}

quickCheckFixed();
