require('dotenv').config();
const { Sequelize } = require('sequelize');

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

async function checkMedicationBatchStructure() {
  try {
    await sequelize.authenticate();
    console.log('=== MEDICATION BATCH TABLE STRUCTURE ===\n');
    
    const [columns] = await sequelize.query('DESCRIBE medication_batches');
    
    console.log('📋 MEDICATION_BATCHES COLUMNS:');
    columns.forEach(col => {
      console.log(`   ${col.Field} - ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    console.log('\n✅ Now I can create the correct batch data structure');
    
    await sequelize.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (sequelize) {
      await sequelize.close();
    }
  }
}

checkMedicationBatchStructure();