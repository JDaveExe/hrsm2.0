/**
 * TEST SPECIFIC MEDICATION
 * 
 * This script tests the exact condition logic for medications with batches
 * to verify if the fix should work
 */

const axios = require('axios');

async function testMedication(medId) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing Medication ID: ${medId}`);
  console.log(`${'='.repeat(80)}\n`);

  try {
    // Get medication details
    const medResponse = await axios.get(`http://localhost:5000/api/inventory/medications/${medId}`);
    const medication = medResponse.data;

    console.log(`📦 Medication: ${medication.name}`);
    console.log(`\n🔍 JSON Fields:`);
    console.log(`   - quantityInStock: ${medication.quantityInStock}`);
    console.log(`   - unitsInStock: ${medication.unitsInStock}`);
    console.log(`   - batchNumber: "${medication.batchNumber}"`);
    console.log(`   - expiryDate: ${medication.expiryDate}`);

    // Get batches
    const batchResponse = await axios.get(`http://localhost:5000/api/medication-batches/${medId}/batches`);
    const batches = batchResponse.data || [];

    console.log(`\n📊 Batch Data:`);
    console.log(`   - Number of batches: ${batches.length}`);
    if (batches.length > 0) {
      batches.forEach((batch, idx) => {
        console.log(`   - Batch ${idx + 1}: ${batch.batchNumber} (${batch.quantityRemaining} units)`);
      });
    }

    // Test the condition
    console.log(`\n🧪 Condition Logic Test:`);
    console.log(`   medicationBatches.length = ${batches.length}`);
    console.log(`   medicationBatches.length === 0 = ${batches.length === 0}`);
    console.log(`   selectedMedication.batchNumber = "${medication.batchNumber}"`);
    console.log(`   !!selectedMedication.batchNumber = ${!!medication.batchNumber}`);
    
    console.log(`\n📝 OLD Condition Result:`);
    console.log(`   if (selectedMedication.batchNumber) = ${!!medication.batchNumber}`);
    if (!!medication.batchNumber) {
      console.log(`   ❌ Would show LEGACY WARNING (WRONG for medications with batches!)`);
    } else {
      console.log(`   ✅ Would NOT show legacy warning`);
    }

    console.log(`\n📝 NEW Condition Result:`);
    console.log(`   if (medicationBatches.length === 0 && selectedMedication.batchNumber) = ${batches.length === 0 && !!medication.batchNumber}`);
    if (batches.length === 0 && !!medication.batchNumber) {
      console.log(`   ⚠️  Should show LEGACY WARNING (Correct - no batches but has legacy field)`);
    } else if (batches.length > 0) {
      console.log(`   ✅ Should show BATCH LIST (Correct - has batches, ignore legacy field)`);
    } else {
      console.log(`   ℹ️  Should show "No batches available" (Correct - no batches, no legacy field)`);
    }

    // Expected behavior
    console.log(`\n✨ Expected UI Behavior:`);
    if (batches.length > 0) {
      console.log(`   Should display: Batch list with ${batches.length} batch${batches.length > 1 ? 'es' : ''}`);
      console.log(`   Should NOT display: "Legacy data" warning`);
    } else if (batches.length === 0 && !!medication.batchNumber) {
      console.log(`   Should display: Legacy batch info (batchNumber, expiryDate)`);
      console.log(`   Should display: "⚠️ Legacy data - add new stock to create proper batches"`);
    } else {
      console.log(`   Should display: "ℹ️ No batches available. Add stock to create batches."`);
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║              MEDICATION CONDITION LOGIC VERIFICATION                      ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `);

  // Test medications with different scenarios
  console.log('\n🧪 Testing medications with BATCHES (should NOT show legacy warning):');
  await testMedication(1);  // Paracetamol - HAS BATCHES
  await testMedication(9);  // Mefenamic Acid - HAS BATCHES
  await testMedication(10); // Mefenamic Acid Capsule - HAS BATCHES

  console.log('\n\n🧪 Testing medications WITHOUT batches (should SHOW legacy warning):');
  await testMedication(2);  // Paracetamol Syrup - LEGACY DATA
  await testMedication(5);  // Ibuprofen - LEGACY DATA

  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ Verification Complete!');
  console.log(`${'='.repeat(80)}\n`);
  console.log('If the NEW condition logic shows correct behavior above,');
  console.log('then the fix is working. If the UI still shows the wrong message,');
  console.log('try clearing browser cache or doing a hard refresh (Ctrl+Shift+R).\n');
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
