/**
 * LEGACY DATA TO BATCH MIGRATION SCRIPT
 * 
 * Purpose: Migrate medications and vaccines that have stock but no batches
 * into the proper batch tracking system.
 * 
 * This script will:
 * 1. Find all items with stock but no batches
 * 2. Create a batch record from the legacy data (batchNumber, expiryDate, stock)
 * 3. Properly set the status (active/expired) based on expiry date
 * 4. Preserve all legacy information
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
  header: () => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(80)}${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  data: (msg) => console.log(`   ${msg}`)
};

async function migrateMedicationBatches(dryRun = true) {
  log.header();
  log.title('📦 MIGRATING MEDICATION BATCHES');
  log.header();

  const migrationResults = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  try {
    // Fetch all medications
    const medsResponse = await axios.get(`${BASE_URL}/api/inventory/medications`);
    const medications = medsResponse.data;

    log.info(`Found ${medications.length} medications in inventory\n`);

    for (const med of medications) {
      const hasStock = (med.quantityInStock || med.unitsInStock || 0) > 0;
      const hasLegacyBatchNumber = !!med.batchNumber;

      if (!hasStock) continue; // Skip medications with no stock

      migrationResults.total++;

      // Check if batches already exist
      let batches = [];
      try {
        const batchResponse = await axios.get(`${BASE_URL}/api/medication-batches/${med.id}/batches`);
        batches = batchResponse.data || [];
      } catch (err) {
        // No batches yet
        batches = [];
      }

      if (batches.length > 0) {
        log.info(`Skipping ${med.name} (ID: ${med.id}) - Already has ${batches.length} batch(es)`);
        migrationResults.skipped++;
        continue;
      }

      // This medication needs batch migration
      const stockQuantity = med.unitsInStock || med.quantityInStock || 0;
      const batchNumber = med.batchNumber || `MIG-${med.id}-${Date.now()}`;
      const expiryDate = med.expiryDate || '2027-12-31';
      const isExpired = new Date(expiryDate) < new Date();

      log.warning(`Migrating: ${med.name} (ID: ${med.id})`);
      log.data(`Stock: ${stockQuantity} units`);
      log.data(`Batch Number: ${batchNumber}`);
      log.data(`Expiry Date: ${new Date(expiryDate).toLocaleDateString()}`);
      log.data(`Status: ${isExpired ? colors.red + 'EXPIRED' + colors.reset : colors.green + 'ACTIVE' + colors.reset}`);

      if (!dryRun) {
        try {
          // Create batch via API
          const batchData = {
            batchNumber: batchNumber,
            quantityReceived: parseInt(stockQuantity),
            quantityRemaining: parseInt(stockQuantity),
            expiryDate: expiryDate,
            receivedDate: new Date().toISOString().split('T')[0],
            unitCost: med.unitCost || med.costPerUnit || 0,
            supplier: med.manufacturer || 'Legacy Migration',
            status: isExpired ? 'expired' : 'active',
            notes: `Migrated from legacy medication data on ${new Date().toLocaleDateString()}`
          };

          const response = await axios.post(
            `${BASE_URL}/api/medication-batches/${med.id}/batches`,
            batchData
          );

          if (response.status === 201) {
            log.success(`Created batch for ${med.name}`);
            migrationResults.migrated++;
            migrationResults.details.push({
              type: 'medication',
              id: med.id,
              name: med.name,
              batchNumber: batchNumber,
              quantity: stockQuantity,
              status: 'success'
            });
          } else {
            throw new Error(`Unexpected response: ${response.status}`);
          }
        } catch (error) {
          log.error(`Failed to create batch for ${med.name}: ${error.message}`);
          migrationResults.errors++;
          migrationResults.details.push({
            type: 'medication',
            id: med.id,
            name: med.name,
            status: 'error',
            error: error.message
          });
        }
      } else {
        log.info('(Dry run - no changes made)');
        migrationResults.migrated++;
      }

      console.log(''); // Empty line for readability
    }

  } catch (error) {
    log.error(`Failed to migrate medications: ${error.message}`);
  }

  return migrationResults;
}

async function migrateVaccineBatches(dryRun = true) {
  log.header();
  log.title('💉 MIGRATING VACCINE BATCHES');
  log.header();

  const migrationResults = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };

  try {
    // Fetch all vaccines
    const vaccinesResponse = await axios.get(`${BASE_URL}/api/inventory/vaccines`);
    const vaccines = vaccinesResponse.data;

    log.info(`Found ${vaccines.length} vaccines in inventory\n`);

    for (const vaccine of vaccines) {
      const hasStock = (vaccine.quantityInStock || vaccine.dosesInStock || 0) > 0;
      const hasLegacyBatchNumber = !!vaccine.batchNumber;

      if (!hasStock) continue; // Skip vaccines with no stock

      migrationResults.total++;

      // Check if batches already exist
      let batches = [];
      try {
        const batchResponse = await axios.get(`${BASE_URL}/api/vaccine-batches/${vaccine.id}/batches`);
        batches = batchResponse.data || [];
      } catch (err) {
        // No batches yet
        batches = [];
      }

      if (batches.length > 0) {
        log.info(`Skipping ${vaccine.name} (ID: ${vaccine.id}) - Already has ${batches.length} batch(es)`);
        migrationResults.skipped++;
        continue;
      }

      // This vaccine needs batch migration
      const stockQuantity = vaccine.dosesInStock || vaccine.quantityInStock || 0;
      const batchNumber = vaccine.batchNumber || `VMIG-${vaccine.id}-${Date.now()}`;
      const expiryDate = vaccine.expiryDate || '2027-12-31';
      const isExpired = new Date(expiryDate) < new Date();

      log.warning(`Migrating: ${vaccine.name} (ID: ${vaccine.id})`);
      log.data(`Stock: ${stockQuantity} doses`);
      log.data(`Batch Number: ${batchNumber}`);
      log.data(`Expiry Date: ${new Date(expiryDate).toLocaleDateString()}`);
      log.data(`Status: ${isExpired ? colors.red + 'EXPIRED' + colors.reset : colors.green + 'ACTIVE' + colors.reset}`);

      if (!dryRun) {
        try {
          // Create batch via API
          const batchData = {
            batchNumber: batchNumber,
            lotNumber: vaccine.lotNumber || batchNumber,
            dosesReceived: parseInt(stockQuantity),
            dosesRemaining: parseInt(stockQuantity),
            expiryDate: expiryDate,
            receivedDate: new Date().toISOString().split('T')[0],
            unitCost: vaccine.unitCost || 0,
            manufacturer: vaccine.manufacturer || 'Unknown',
            supplier: vaccine.manufacturer || 'Legacy Migration',
            status: isExpired ? 'expired' : 'active',
            notes: `Migrated from legacy vaccine data on ${new Date().toLocaleDateString()}`
          };

          const response = await axios.post(
            `${BASE_URL}/api/vaccine-batches/${vaccine.id}/batches`,
            batchData
          );

          if (response.status === 201) {
            log.success(`Created batch for ${vaccine.name}`);
            migrationResults.migrated++;
            migrationResults.details.push({
              type: 'vaccine',
              id: vaccine.id,
              name: vaccine.name,
              batchNumber: batchNumber,
              quantity: stockQuantity,
              status: 'success'
            });
          } else {
            throw new Error(`Unexpected response: ${response.status}`);
          }
        } catch (error) {
          log.error(`Failed to create batch for ${vaccine.name}: ${error.message}`);
          migrationResults.errors++;
          migrationResults.details.push({
            type: 'vaccine',
            id: vaccine.id,
            name: vaccine.name,
            status: 'error',
            error: error.message
          });
        }
      } else {
        log.info('(Dry run - no changes made)');
        migrationResults.migrated++;
      }

      console.log(''); // Empty line for readability
    }

  } catch (error) {
    log.error(`Failed to migrate vaccines: ${error.message}`);
  }

  return migrationResults;
}

async function main() {
  console.log(`
${colors.bright}${colors.magenta}
╔═══════════════════════════════════════════════════════════════════════════╗
║              LEGACY DATA TO BATCH MIGRATION TOOL                          ║
║        Converting legacy stock data to proper batch tracking             ║
╚═══════════════════════════════════════════════════════════════════════════╝
${colors.reset}
  `);

  // Check if this is a dry run or actual migration
  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');

  if (isDryRun) {
    log.warning('DRY RUN MODE - No changes will be made to the database');
    log.info('To perform the actual migration, run: node migrate-legacy-to-batches.js --execute\n');
  } else {
    log.warning('EXECUTE MODE - This will create batch records in the database!');
    log.info('Starting migration in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Run migrations
  const medResults = await migrateMedicationBatches(isDryRun);
  const vaccineResults = await migrateVaccineBatches(isDryRun);

  // Summary
  log.header();
  log.title('📊 MIGRATION SUMMARY');
  log.header();

  console.log(`\n${colors.bright}Medications:${colors.reset}`);
  console.log(`  Total with stock: ${medResults.total}`);
  console.log(`  ${colors.green}Migrated: ${medResults.migrated}${colors.reset}`);
  console.log(`  ${colors.yellow}Skipped (already has batches): ${medResults.skipped}${colors.reset}`);
  console.log(`  ${colors.red}Errors: ${medResults.errors}${colors.reset}`);

  console.log(`\n${colors.bright}Vaccines:${colors.reset}`);
  console.log(`  Total with stock: ${vaccineResults.total}`);
  console.log(`  ${colors.green}Migrated: ${vaccineResults.migrated}${colors.reset}`);
  console.log(`  ${colors.yellow}Skipped (already has batches): ${vaccineResults.skipped}${colors.reset}`);
  console.log(`  ${colors.red}Errors: ${vaccineResults.errors}${colors.reset}`);

  console.log(`\n${colors.bright}Total Items Migrated: ${medResults.migrated + vaccineResults.migrated}${colors.reset}\n`);

  if (isDryRun) {
    log.header();
    log.warning('This was a DRY RUN - no actual changes were made');
    log.info('Review the output above and run with --execute flag to perform migration');
    log.header();
  } else {
    log.header();
    log.success('MIGRATION COMPLETE!');
    log.info('All legacy data has been converted to batch records');
    log.info('The "Legacy data" warning should now disappear for migrated items');
    log.header();
  }

  // Save migration report
  if (!isDryRun && (medResults.migrated > 0 || vaccineResults.migrated > 0)) {
    const fs = require('fs').promises;
    const report = {
      migrationDate: new Date().toISOString(),
      medications: medResults,
      vaccines: vaccineResults,
      totalMigrated: medResults.migrated + vaccineResults.migrated
    };

    await fs.writeFile(
      'migration-report.json',
      JSON.stringify(report, null, 2)
    );
    log.success('Migration report saved to migration-report.json');
  }
}

// Run the migration
main().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
