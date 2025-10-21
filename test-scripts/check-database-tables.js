const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'backend', 'database.sqlite'),
  logging: false
});

async function checkTables() {
  try {
    const [results] = await sequelize.query('SELECT name FROM sqlite_master WHERE type="table" ORDER BY name');
    console.log('Tables in database:');
    results.forEach(r => console.log(`  - ${r.name}`));
    
    // Check if batch tables exist
    const hasMedBatches = results.some(r => r.name === 'medication_batches');
    const hasVacBatches = results.some(r => r.name === 'vaccine_batches');
    
    console.log(`\nBatch tables:`);
    console.log(`  medication_batches: ${hasMedBatches ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  vaccine_batches: ${hasVacBatches ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (!hasMedBatches || !hasVacBatches) {
      console.log(`\n⚠️  Batch tables are missing. They need to be created by the backend on startup.`);
      console.log(`   Make sure the backend server has been started at least once.`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTables();
