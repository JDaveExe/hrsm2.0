// Comprehensive Inventory Data Analysis Script
// This will show all discrepancies between what's displayed and what's in the data

console.log('🔍 COMPREHENSIVE INVENTORY ANALYSIS');
console.log('==================================');

async function analyzeInventoryData() {
  try {
    console.log('📅 Current Date:', new Date().toLocaleDateString());
    
    // Fetch all data
    const [vaccineRes, medRes] = await Promise.all([
      fetch('/api/inventory/vaccines'),
      fetch('/api/inventory/medications')
    ]);

    if (!vaccineRes.ok || !medRes.ok) {
      console.error('❌ API calls failed');
      return;
    }

    const vaccines = await vaccineRes.json();
    const medications = await medRes.json();

    console.log(`\n📊 RAW DATA SUMMARY:`);
    console.log(`   Total Vaccines: ${vaccines.length}`);
    console.log(`   Total Medications: ${medications.length}`);

    // ANALYZE VACCINES
    console.log(`\n🧬 VACCINES ANALYSIS (${vaccines.length} items):`);
    console.log('=' .repeat(50));
    
    let vLowStock = 0, vEmpty = 0, vExpiring = 0;
    const today = new Date();
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    vaccines.forEach((vaccine, index) => {
      const stock = vaccine.dosesInStock || 0;
      const minStock = vaccine.minimumStock || 0;
      const expiry = vaccine.expiryDate ? new Date(vaccine.expiryDate) : null;
      const isExpiring = expiry && expiry <= thirtyDays;
      
      let status = 'Good';
      if (stock === 0) {
        status = 'EMPTY';
        vEmpty++;
      } else if (stock <= minStock) {
        status = 'LOW STOCK';
        vLowStock++;
      }
      
      if (isExpiring) vExpiring++;

      console.log(`${index + 1}. ${vaccine.name}`);
      console.log(`   Stock: ${stock}/${minStock} (${status})`);
      console.log(`   Expiry: ${expiry ? expiry.toLocaleDateString() : 'No date'} ${isExpiring ? '⚠️ EXPIRING' : '✅'}`);
      console.log(`   Batch: ${vaccine.batchNumber || 'N/A'}`);
      console.log('');
    });

    // ANALYZE MEDICATIONS
    console.log(`\n💊 MEDICATIONS ANALYSIS (${medications.length} items):`);
    console.log('=' .repeat(50));
    
    let mLowStock = 0, mEmpty = 0, mExpiring = 0;

    medications.forEach((med, index) => {
      const stock = med.unitsInStock || 0;
      const minStock = med.minimumStock || 0;
      const expiry = med.expiryDate ? new Date(med.expiryDate) : null;
      const isExpiring = expiry && expiry <= thirtyDays;
      
      let status = 'Good';
      if (stock === 0) {
        status = 'EMPTY';
        mEmpty++;
      } else if (stock <= minStock) {
        status = 'LOW STOCK';
        mLowStock++;
      }
      
      if (isExpiring) mExpiring++;

      console.log(`${index + 1}. ${med.name}`);
      console.log(`   Stock: ${stock}/${minStock} (${status})`);
      console.log(`   Expiry: ${expiry ? expiry.toLocaleDateString() : 'No date'} ${isExpiring ? '⚠️ EXPIRING' : '✅'}`);
      console.log(`   Batch: ${med.batchNumber || 'N/A'}`);
      console.log('');
    });

    // SUMMARY CALCULATIONS
    console.log(`\n📈 CALCULATED TOTALS:`);
    console.log('=' .repeat(30));
    console.log(`VACCINES:`);
    console.log(`   Empty Stock: ${vEmpty}`);
    console.log(`   Low Stock: ${vLowStock}`);
    console.log(`   Expiring (30d): ${vExpiring}`);
    console.log(`MEDICATIONS:`);
    console.log(`   Empty Stock: ${mEmpty}`);
    console.log(`   Low Stock: ${mLowStock}`);
    console.log(`   Expiring (30d): ${mExpiring}`);
    console.log(`TOTALS:`);
    console.log(`   Critical Stock: ${vEmpty + vLowStock + mEmpty + mLowStock}`);
    console.log(`   Expiring Soon: ${vExpiring + mExpiring}`);

    // COMPARE WITH UI
    console.log(`\n🎯 COMPARISON WITH UI:`);
    console.log('=' .repeat(25));
    
    // Get current badge values
    const badges = document.querySelectorAll('.alert-badge .alert-count');
    const criticalBadge = badges[0]?.textContent || 'Not found';
    const expiringBadge = badges[1]?.textContent || 'Not found';
    
    // Get sidebar values
    const sidebarStats = document.querySelectorAll('.card .h4, .card .h3');
    
    console.log(`Current Badges:`);
    console.log(`   Critical Stock: ${criticalBadge} (calculated: ${vEmpty + vLowStock + mEmpty + mLowStock})`);
    console.log(`   Expiring Soon: ${expiringBadge} (calculated: ${vExpiring + mExpiring})`);
    
    console.log(`\n🔍 DISCREPANCY CHECK:`);
    const criticalMatch = parseInt(criticalBadge) === (vEmpty + vLowStock + mEmpty + mLowStock);
    const expiringMatch = parseInt(expiringBadge) === (vExpiring + mExpiring);
    
    console.log(`   Critical Stock: ${criticalMatch ? '✅ ACCURATE' : '❌ MISMATCH'}`);
    console.log(`   Expiring Soon: ${expiringMatch ? '✅ ACCURATE' : '❌ MISMATCH'}`);
    
    if (!criticalMatch || !expiringMatch) {
      console.log(`\n🔧 ISSUES FOUND:`);
      if (!criticalMatch) {
        console.log(`   - Critical stock badge shows ${criticalBadge} but should be ${vEmpty + vLowStock + mEmpty + mLowStock}`);
      }
      if (!expiringMatch) {
        console.log(`   - Expiring badge shows ${expiringBadge} but should be ${vExpiring + mExpiring}`);
      }
    }

    // SPECIFIC ITEMS TO CHECK
    console.log(`\n🔎 SPECIFIC ITEMS OF INTEREST:`);
    console.log('=' .repeat(35));
    
    // Find the "sample" item mentioned in critical stock
    const sampleItems = [...vaccines, ...medications].filter(item => 
      item.name.toLowerCase().includes('sample')
    );
    
    if (sampleItems.length > 0) {
      console.log(`Found items with 'sample' in name:`);
      sampleItems.forEach(item => {
        const stock = item.dosesInStock || item.unitsInStock || 0;
        const minStock = item.minimumStock || 0;
        console.log(`   - ${item.name}: ${stock}/${minStock} ${stock <= minStock ? '⚠️ LOW/EMPTY' : '✅ OK'}`);
      });
    } else {
      console.log(`No items with 'sample' in name found`);
    }

  } catch (error) {
    console.error('❌ Analysis Error:', error);
  }
}

analyzeInventoryData();
