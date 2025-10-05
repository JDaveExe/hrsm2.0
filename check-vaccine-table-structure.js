require('dotenv').config();
const { Sequelize } = require('sequelize');

// Create database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'hrsm2',
  process.env.DB_USER || 'root', 
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

async function checkTableStructure() {
  try {
    console.log('=== VACCINE BATCH TABLE STRUCTURE ANALYSIS ===\n');
    
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Check if vaccine_batches table exists
    const [tableExists] = await sequelize.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'vaccine_batches'",
      { 
        replacements: [process.env.DB_NAME || 'hrsm2'],
        type: sequelize.QueryTypes.SELECT 
      }
    );
    
    if (tableExists.count === 0) {
      console.log('❌ vaccine_batches table does not exist');
      console.log('💡 Need to create the table first');
      await sequelize.close();
      return;
    }
    
    console.log('✅ vaccine_batches table exists\n');
    
    // Get table structure
    const [columns] = await sequelize.query('DESCRIBE vaccine_batches');
    
    console.log('📋 TABLE COLUMNS:');
    columns.forEach(col => {
      console.log(`   ${col.Field} - ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Get existing data count
    const [countResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM vaccine_batches',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log(`\n📊 EXISTING RECORDS: ${countResult.count}`);
    
    if (countResult.count > 0) {
      console.log('\n📋 SAMPLE RECORDS:');
      const [sampleRecords] = await sequelize.query(
        'SELECT * FROM vaccine_batches LIMIT 3',
        { type: sequelize.QueryTypes.SELECT }
      );
      
      sampleRecords.forEach((record, index) => {
        console.log(`\n${index + 1}. Vaccine ID: ${record.vaccineId} | ${record.vaccineName || 'Unknown'}`);
        console.log(`   Batch: ${record.batchNumber} | Remaining: ${record.dosesRemaining} | Status: ${record.status}`);
        console.log(`   Expiry: ${record.expiryDate} | Created: ${record.createdAt}`);
      });
    }
    
    // Generate valid batch data structure
    console.log('\n🔧 VALID BATCH DATA STRUCTURE:');
    const validColumns = columns.map(col => col.Field);
    console.log('Available columns:', validColumns.join(', '));
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
    if (sequelize) {
      await sequelize.close();
    }
  }
}

checkTableStructure()
  .then(() => {
    console.log('\n✅ Analysis complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  });