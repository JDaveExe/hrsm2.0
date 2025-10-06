const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixVaccineBatchIndexes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrsm2'
  });

  try {
    console.log('🔍 Checking vaccine_batches table indexes...');
    
    // Get all indexes
    const [indexes] = await connection.query(`
      SHOW INDEXES FROM vaccine_batches
    `);
    
    console.log(`\n📊 Found ${indexes.length} index entries`);
    
    // Group by index name
    const indexGroups = {};
    indexes.forEach(idx => {
      if (!indexGroups[idx.Key_name]) {
        indexGroups[idx.Key_name] = [];
      }
      indexGroups[idx.Key_name].push(idx);
    });
    
    console.log(`\n📋 Unique indexes: ${Object.keys(indexGroups).length}`);
    Object.keys(indexGroups).forEach(name => {
      console.log(`  - ${name} (${indexGroups[name].length} column${indexGroups[name].length > 1 ? 's' : ''})`);
    });
    
    // Drop all non-PRIMARY indexes
    console.log('\n🗑️  Dropping all non-PRIMARY indexes...');
    for (const indexName of Object.keys(indexGroups)) {
      if (indexName !== 'PRIMARY') {
        try {
          await connection.query(`DROP INDEX \`${indexName}\` ON vaccine_batches`);
          console.log(`  ✅ Dropped index: ${indexName}`);
        } catch (error) {
          console.log(`  ⚠️  Could not drop ${indexName}: ${error.message}`);
        }
      }
    }
    
    // Re-create only essential indexes
    console.log('\n🔧 Creating essential indexes...');
    
    try {
      await connection.query(`
        CREATE UNIQUE INDEX vaccine_batches_batchNumber_unique 
        ON vaccine_batches (batchNumber)
      `);
      console.log('  ✅ Created unique index on batchNumber');
    } catch (error) {
      console.log(`  ℹ️  batchNumber index: ${error.message}`);
    }
    
    try {
      await connection.query(`
        CREATE INDEX vaccine_batches_vaccineType 
        ON vaccine_batches (vaccineType)
      `);
      console.log('  ✅ Created index on vaccineType');
    } catch (error) {
      console.log(`  ℹ️  vaccineType index: ${error.message}`);
    }
    
    try {
      await connection.query(`
        CREATE INDEX vaccine_batches_expiryDate 
        ON vaccine_batches (expiryDate)
      `);
      console.log('  ✅ Created index on expiryDate');
    } catch (error) {
      console.log(`  ℹ️  expiryDate index: ${error.message}`);
    }
    
    // Verify final state
    const [finalIndexes] = await connection.query(`SHOW INDEXES FROM vaccine_batches`);
    const finalIndexGroups = {};
    finalIndexes.forEach(idx => {
      if (!finalIndexGroups[idx.Key_name]) {
        finalIndexGroups[idx.Key_name] = [];
      }
      finalIndexGroups[idx.Key_name].push(idx);
    });
    
    console.log(`\n✅ Final state: ${Object.keys(finalIndexGroups).length} indexes`);
    Object.keys(finalIndexGroups).forEach(name => {
      console.log(`  - ${name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixVaccineBatchIndexes();
