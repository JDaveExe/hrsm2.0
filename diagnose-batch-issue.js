/**
 * BATCH DIAGNOSTIC SCRIPT
 * 
 * Purpose: Analyze medications and vaccines to see which ones have:
 * - Stock quantities
 * - Number of batches
 * - Legacy batchNumber field
 * - Batch data structure
 * 
 * This helps identify why "Legacy data" message still appears
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  data: (msg) => console.log(`   ${msg}`)
};

async function analyzeMedications() {
  log.header();
  log.title('📦 ANALYZING MEDICATIONS');
  log.header();

  try {
    // Fetch all medications
    const medsResponse = await axios.get(`${BASE_URL}/api/inventory/medications`);
    const medications = medsResponse.data;

    log.info(`Found ${medications.length} medications in inventory\n`);

    let medsWithStock = 0;
    let medsWithBatches = 0;
    let medsWithLegacyField = 0;
    let medsWithStockButNoBatches = 0;

    // Analyze each medication
    for (const med of medications) {
      const hasStock = (med.quantityInStock || med.unitsInStock || 0) > 0;
      const hasLegacyBatchNumber = !!med.batchNumber;

      if (hasStock) medsWithStock++;
      if (hasLegacyBatchNumber) medsWithLegacyField++;

      // Fetch batch data for this medication
      let batches = [];
      try {
        const batchResponse = await axios.get(`${BASE_URL}/api/medication-batches/${med.id}/batches`);
        batches = batchResponse.data || [];
      } catch (err) {
        // No batches endpoint or error
        batches = [];
      }

      if (batches.length > 0) medsWithBatches++;

      // Calculate total batch stock
      const totalBatchStock = batches.reduce((sum, batch) => sum + (batch.quantityRemaining || 0), 0);

      // Determine status
      let status = '';
      let statusColor = colors.reset;

      if (batches.length > 0 && hasStock) {
        status = 'HAS BATCHES ✅';
        statusColor = colors.green;
      } else if (batches.length === 0 && hasStock && hasLegacyBatchNumber) {
        status = 'LEGACY DATA ⚠️';
        statusColor = colors.yellow;
        medsWithStockButNoBatches++;
      } else if (batches.length === 0 && hasStock) {
        status = 'NO BATCHES ❌';
        statusColor = colors.red;
        medsWithStockButNoBatches++;
      } else {
        status = 'NO STOCK';
        statusColor = colors.reset;
      }

      // Only show medications with stock
      if (hasStock || batches.length > 0) {
        console.log(`\n${colors.bright}${med.name}${colors.reset} (ID: ${med.id})`);
        log.data(`${statusColor}Status: ${status}${colors.reset}`);
        log.data(`Stock (JSON): ${med.quantityInStock || med.unitsInStock || 0} units`);
        log.data(`Batches: ${batches.length} batch${batches.length !== 1 ? 'es' : ''}`);
        
        if (batches.length > 0) {
          log.data(`Total Batch Stock: ${totalBatchStock} units`);
          log.data(`Batch Details:`);
          batches.forEach((batch, idx) => {
            const expired = new Date(batch.expiryDate) < new Date();
            const expiredTag = expired ? `${colors.red}[EXPIRED]${colors.reset}` : '';
            log.data(`   ${idx + 1}. ${batch.batchNumber} - ${batch.quantityRemaining} units (Exp: ${new Date(batch.expiryDate).toLocaleDateString()}) ${expiredTag}`);
          });
        }
        
        if (hasLegacyBatchNumber) {
          log.data(`${colors.yellow}Legacy Field: batchNumber="${med.batchNumber}"${colors.reset}`);
        }

        // Flag discrepancies
        if (batches.length > 0 && Math.abs(totalBatchStock - (med.quantityInStock || med.unitsInStock || 0)) > 0) {
          log.warning(`Stock mismatch! JSON shows ${med.quantityInStock || med.unitsInStock}, batches total ${totalBatchStock}`);
        }
      }
    }

    // Summary
    log.header();
    log.title('📊 MEDICATION SUMMARY');
    log.header();
    console.log(`Total Medications: ${medications.length}`);
    console.log(`${colors.green}With Stock: ${medsWithStock}${colors.reset}`);
    console.log(`${colors.green}With Batches: ${medsWithBatches}${colors.reset}`);
    console.log(`${colors.yellow}With Legacy Field: ${medsWithLegacyField}${colors.reset}`);
    console.log(`${colors.red}With Stock BUT No Batches: ${medsWithStockButNoBatches}${colors.reset}`);

  } catch (error) {
    log.error(`Failed to analyze medications: ${error.message}`);
    if (error.response) {
      log.error(`Response: ${JSON.stringify(error.response.data)}`);
    }
  }
}

async function analyzeVaccines() {
  log.header();
  log.title('💉 ANALYZING VACCINES');
  log.header();

  try {
    // Fetch all vaccines
    const vaccinesResponse = await axios.get(`${BASE_URL}/api/inventory/vaccines`);
    const vaccines = vaccinesResponse.data;

    log.info(`Found ${vaccines.length} vaccines in inventory\n`);

    let vaccinesWithStock = 0;
    let vaccinesWithBatches = 0;
    let vaccinesWithLegacyField = 0;
    let vaccinesWithStockButNoBatches = 0;

    // Analyze each vaccine
    for (const vaccine of vaccines) {
      const hasStock = (vaccine.quantityInStock || vaccine.dosesInStock || 0) > 0;
      const hasLegacyBatchNumber = !!vaccine.batchNumber;

      if (hasStock) vaccinesWithStock++;
      if (hasLegacyBatchNumber) vaccinesWithLegacyField++;

      // Fetch batch data for this vaccine
      let batches = [];
      try {
        const batchResponse = await axios.get(`${BASE_URL}/api/vaccine-batches/${vaccine.id}/batches`);
        batches = batchResponse.data || [];
      } catch (err) {
        // No batches endpoint or error
        batches = [];
      }

      if (batches.length > 0) vaccinesWithBatches++;

      // Calculate total batch stock
      const totalBatchStock = batches.reduce((sum, batch) => sum + (batch.dosesRemaining || 0), 0);

      // Determine status
      let status = '';
      let statusColor = colors.reset;

      if (batches.length > 0 && hasStock) {
        status = 'HAS BATCHES ✅';
        statusColor = colors.green;
      } else if (batches.length === 0 && hasStock && hasLegacyBatchNumber) {
        status = 'LEGACY DATA ⚠️';
        statusColor = colors.yellow;
        vaccinesWithStockButNoBatches++;
      } else if (batches.length === 0 && hasStock) {
        status = 'NO BATCHES ❌';
        statusColor = colors.red;
        vaccinesWithStockButNoBatches++;
      } else {
        status = 'NO STOCK';
        statusColor = colors.reset;
      }

      // Only show vaccines with stock
      if (hasStock || batches.length > 0) {
        console.log(`\n${colors.bright}${vaccine.name}${colors.reset} (ID: ${vaccine.id})`);
        log.data(`${statusColor}Status: ${status}${colors.reset}`);
        log.data(`Stock (JSON): ${vaccine.quantityInStock || vaccine.dosesInStock || 0} doses`);
        log.data(`Batches: ${batches.length} batch${batches.length !== 1 ? 'es' : ''}`);
        
        if (batches.length > 0) {
          log.data(`Total Batch Stock: ${totalBatchStock} doses`);
          log.data(`Batch Details:`);
          batches.forEach((batch, idx) => {
            const expired = new Date(batch.expiryDate) < new Date();
            const expiredTag = expired ? `${colors.red}[EXPIRED]${colors.reset}` : '';
            log.data(`   ${idx + 1}. ${batch.batchNumber} - ${batch.dosesRemaining} doses (Exp: ${new Date(batch.expiryDate).toLocaleDateString()}) ${expiredTag}`);
          });
        }
        
        if (hasLegacyBatchNumber) {
          log.data(`${colors.yellow}Legacy Field: batchNumber="${vaccine.batchNumber}"${colors.reset}`);
        }

        // Flag discrepancies
        if (batches.length > 0 && Math.abs(totalBatchStock - (vaccine.quantityInStock || vaccine.dosesInStock || 0)) > 0) {
          log.warning(`Stock mismatch! JSON shows ${vaccine.quantityInStock || vaccine.dosesInStock}, batches total ${totalBatchStock}`);
        }
      }
    }

    // Summary
    log.header();
    log.title('📊 VACCINE SUMMARY');
    log.header();
    console.log(`Total Vaccines: ${vaccines.length}`);
    console.log(`${colors.green}With Stock: ${vaccinesWithStock}${colors.reset}`);
    console.log(`${colors.green}With Batches: ${vaccinesWithBatches}${colors.reset}`);
    console.log(`${colors.yellow}With Legacy Field: ${vaccinesWithLegacyField}${colors.reset}`);
    console.log(`${colors.red}With Stock BUT No Batches: ${vaccinesWithStockButNoBatches}${colors.reset}`);

  } catch (error) {
    log.error(`Failed to analyze vaccines: ${error.message}`);
    if (error.response) {
      log.error(`Response: ${JSON.stringify(error.response.data)}`);
    }
  }
}

async function checkSpecificMedication(medId) {
  log.header();
  log.title(`🔍 DETAILED CHECK: Medication ID ${medId}`);
  log.header();

  try {
    // Get medication details
    const medResponse = await axios.get(`${BASE_URL}/api/inventory/medications/${medId}`);
    const med = medResponse.data;

    console.log(`\n${colors.bright}Medication: ${med.name}${colors.reset}`);
    console.log(`\n${colors.cyan}JSON Fields:${colors.reset}`);
    console.log(JSON.stringify({
      id: med.id,
      name: med.name,
      quantityInStock: med.quantityInStock,
      unitsInStock: med.unitsInStock,
      batchNumber: med.batchNumber,
      expiryDate: med.expiryDate
    }, null, 2));

    // Get batches
    const batchResponse = await axios.get(`${BASE_URL}/api/medication-batches/${medId}/batches`);
    const batches = batchResponse.data || [];

    console.log(`\n${colors.cyan}Batches from API:${colors.reset}`);
    console.log(`Count: ${batches.length}`);
    console.log(JSON.stringify(batches, null, 2));

    // Check condition logic
    console.log(`\n${colors.cyan}Condition Logic Check:${colors.reset}`);
    console.log(`medicationBatches.length: ${batches.length}`);
    console.log(`medicationBatches.length === 0: ${batches.length === 0}`);
    console.log(`selectedMedication.batchNumber: "${med.batchNumber}"`);
    console.log(`!!selectedMedication.batchNumber: ${!!med.batchNumber}`);
    console.log(`\nOLD Condition (selectedMedication.batchNumber): ${!!med.batchNumber}`);
    console.log(`NEW Condition (medicationBatches.length === 0 && selectedMedication.batchNumber): ${batches.length === 0 && !!med.batchNumber}`);
    
    if (batches.length > 0) {
      log.success('Should show batch list, NOT legacy warning');
    } else if (batches.length === 0 && !!med.batchNumber) {
      log.warning('Should show legacy warning');
    } else {
      log.info('Should show "No batches available" message');
    }

  } catch (error) {
    log.error(`Failed to check medication: ${error.message}`);
  }
}

async function main() {
  console.log(`
${colors.bright}${colors.magenta}
╔═══════════════════════════════════════════════════════════════════════════╗
║                      BATCH DIAGNOSTIC TOOL                                ║
║                   Medications & Vaccines Analysis                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
${colors.reset}
  `);

  log.info('Starting diagnostic checks...');
  log.info('Make sure the backend server is running on http://localhost:5000\n');

  // Run diagnostics
  await analyzeMedications();
  await analyzeVaccines();

  // If you want to check a specific medication, uncomment and provide ID:
  // await checkSpecificMedication(1); // Replace 1 with actual medication ID

  log.header();
  log.title('🎯 DIAGNOSTIC COMPLETE');
  log.header();
  console.log('\nRecommendations:');
  console.log('1. Items marked "HAS BATCHES ✅" should NOT show legacy warning');
  console.log('2. Items marked "LEGACY DATA ⚠️" should show legacy warning');
  console.log('3. Items marked "NO BATCHES ❌" need batch migration\n');
}

// Run the diagnostic
main().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
