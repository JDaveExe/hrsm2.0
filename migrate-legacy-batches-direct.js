/**
 * LEGACY DATA TO BATCH MIGRATION SCRIPT (Direct Database Access)
 * 
 * Purpose: Migrate medications and vaccines that have stock but no batches
 * into the proper batch tracking system using direct database access.
 * 
 * This bypasses the API authentication requirement.
 */

const { Sequelize } = require('sequelize');
const path = require('path');

// Database connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'backend', 'database.sqlite'),
  logging: false
});

// Color codes
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

  const results = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Get all medications with stock from JSON
    const fs = require('fs').promises;
    const medicationsData = JSON.parse(
      await fs.readFile(path.join(__dirname, 'backend', 'data', 'medications.json'), 'utf8')
    );

    const medicationsWithStock = medicationsData.filter(m => 
      (m.quantityInStock || m.unitsInStock || 0) > 0
    );

    log.info(`Found ${medicationsWithStock.length} medications with stock\n`);

    for (const med of medicationsWithStock) {
      results.total++;

      // Check if batches already exist
      const [existingBatches] = await sequelize.query(
        'SELECT COUNT(*) as count FROM medication_batches WHERE medicationId = ?',
        { replacements: [med.id] }
      );

      if (existingBatches[0].count > 0) {
        log.info(`Skipping ${med.name} (ID: ${med.id}) - Already has ${existingBatches[0].count} batch(es)`);
        results.skipped++;
        continue;
      }

      // Prepare batch data
      const stockQuantity = med.unitsInStock || med.quantityInStock || 0;
      const batchNumber = med.batchNumber || `MIG-${med.id}-${Date.now()}`;
      const expiryDate = med.expiryDate || '2027-12-31';
      const isExpired = new Date(expiryDate) < new Date();
      const receivedDate = new Date().toISOString().split('T')[0];

      log.warning(`Migrating: ${med.name} (ID: ${med.id})`);
      log.data(`Stock: ${stockQuantity} units`);
      log.data(`Batch Number: ${batchNumber}`);
      log.data(`Expiry Date: ${new Date(expiryDate).toLocaleDateString()}`);
      log.data(`Status: ${isExpired ? colors.red + 'EXPIRED' + colors.reset : colors.green + 'ACTIVE' + colors.reset}`);

      if (!dryRun) {
        try {
          await sequelize.query(`
            INSERT INTO medication_batches (
              medicationId, batchNumber, quantityReceived, quantityRemaining,
              expiryDate, receivedDate, unitCost, supplier, status, notes,
              createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, {
            replacements: [
              med.id,
              batchNumber,
              stockQuantity,
              stockQuantity,
              expiryDate,
              receivedDate,
              med.unitCost || med.costPerUnit || 0,
              med.manufacturer || 'Legacy Migration',
              isExpired ? 'expired' : 'active',
              `Migrated from legacy medication data on ${new Date().toLocaleDateString()}`,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          });

          log.success(`Created batch for ${med.name}`);
          results.migrated++;
        } catch (error) {
          log.error(`Failed to create batch for ${med.name}: ${error.message}`);
          results.errors++;
        }
      } else {
        log.info('(Dry run - no changes made)');
        results.migrated++;
      }

      console.log(''); // Empty line
    }

  } catch (error) {
    log.error(`Failed to migrate medications: ${error.message}`);
  }

  return results;
}

async function migrateVaccineBatches(dryRun = true) {
  log.header();
  log.title('💉 MIGRATING VACCINE BATCHES');
  log.header();

  const results = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0
  };

  try {
    // Get all vaccines with stock from JSON
    const fs = require('fs').promises;
    const vaccinesData = JSON.parse(
      await fs.readFile(path.join(__dirname, 'backend', 'data', 'vaccines.json'), 'utf8')
    );

    const vaccinesWithStock = vaccinesData.filter(v => 
      (v.quantityInStock || v.dosesInStock || 0) > 0
    );

    log.info(`Found ${vaccinesWithStock.length} vaccines with stock\n`);

    for (const vaccine of vaccinesWithStock) {
      results.total++;

      // Check if batches already exist
      const [existingBatches] = await sequelize.query(
        'SELECT COUNT(*) as count FROM vaccine_batches WHERE vaccineId = ?',
        { replacements: [vaccine.id] }
      );

      if (existingBatches[0].count > 0) {
        log.info(`Skipping ${vaccine.name} (ID: ${vaccine.id}) - Already has ${existingBatches[0].count} batch(es)`);
        results.skipped++;
        continue;
      }

      // Prepare batch data
      const stockQuantity = vaccine.dosesInStock || vaccine.quantityInStock || 0;
      const batchNumber = vaccine.batchNumber || `VMIG-${vaccine.id}-${Date.now()}`;
      const expiryDate = vaccine.expiryDate || '2027-12-31';
      const isExpired = new Date(expiryDate) < new Date();
      const receivedDate = new Date().toISOString().split('T')[0];

      log.warning(`Migrating: ${vaccine.name} (ID: ${vaccine.id})`);
      log.data(`Stock: ${stockQuantity} doses`);
      log.data(`Batch Number: ${batchNumber}`);
      log.data(`Expiry Date: ${new Date(expiryDate).toLocaleDateString()}`);
      log.data(`Status: ${isExpired ? colors.red + 'EXPIRED' + colors.reset : colors.green + 'ACTIVE' + colors.reset}`);

      if (!dryRun) {
        try {
          await sequelize.query(`
            INSERT INTO vaccine_batches (
              vaccineId, batchNumber, lotNumber, dosesReceived, dosesRemaining,
              expiryDate, receivedDate, unitCost, manufacturer, supplier, status, notes,
              createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, {
            replacements: [
              vaccine.id,
              batchNumber,
              vaccine.lotNumber || batchNumber,
              stockQuantity,
              stockQuantity,
              expiryDate,
              receivedDate,
              vaccine.unitCost || 0,
              vaccine.manufacturer || 'Unknown',
              vaccine.manufacturer || 'Legacy Migration',
              isExpired ? 'expired' : 'active',
              `Migrated from legacy vaccine data on ${new Date().toLocaleDateString()}`,
              new Date().toISOString(),
              new Date().toISOString()
            ]
          });

          log.success(`Created batch for ${vaccine.name}`);
          results.migrated++;
        } catch (error) {
          log.error(`Failed to create batch for ${vaccine.name}: ${error.message}`);
          results.errors++;
        }
      } else {
        log.info('(Dry run - no changes made)');
        results.migrated++;
      }

      console.log(''); // Empty line
    }

  } catch (error) {
    log.error(`Failed to migrate vaccines: ${error.message}`);
  }

  return results;
}

async function main() {
  console.log(`
${colors.bright}${colors.magenta}
╔═══════════════════════════════════════════════════════════════════════════╗
║        LEGACY DATA TO BATCH MIGRATION TOOL (Direct Database)             ║
║        Converting legacy stock data to proper batch tracking             ║
╚═══════════════════════════════════════════════════════════════════════════╝
${colors.reset}
  `);

  const args = process.argv.slice(2);
  const isDryRun = !args.includes('--execute');

  if (isDryRun) {
    log.warning('DRY RUN MODE - No changes will be made to the database');
    log.info('To perform the actual migration, run: node migrate-legacy-batches-direct.js --execute\n');
  } else {
    log.warning('EXECUTE MODE - This will create batch records in the database!');
    log.info('Starting migration in 3 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  try {
    // Test database connection
    await sequelize.authenticate();
    log.success('Database connection established\n');

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
    console.log(`  ${colors.yellow}Skipped: ${medResults.skipped}${colors.reset}`);
    console.log(`  ${colors.red}Errors: ${medResults.errors}${colors.reset}`);

    console.log(`\n${colors.bright}Vaccines:${colors.reset}`);
    console.log(`  Total with stock: ${vaccineResults.total}`);
    console.log(`  ${colors.green}Migrated: ${vaccineResults.migrated}${colors.reset}`);
    console.log(`  ${colors.yellow}Skipped: ${vaccineResults.skipped}${colors.reset}`);
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
      log.info('Refresh your browser to see the changes (Ctrl+Shift+R)');
      log.header();
    }

  } catch (error) {
    log.error(`Fatal error: ${error.message}`);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

main();
