const { sequelize } = require('./backend/config/database');

async function checkBarangayColumns() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    // Query for all tables with 'barangay' column
    const [results] = await sequelize.query(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE COLUMN_NAME = 'barangay' 
      AND TABLE_SCHEMA = 'hrsm2'
      ORDER BY TABLE_NAME
    `);
    
    console.log('📊 Tables with "barangay" column:\n');
    if (results.length === 0) {
      console.log('No tables found with "barangay" column');
    } else {
      results.forEach((row, index) => {
        console.log(`${index + 1}. Table: ${row.TABLE_NAME}`);
        console.log(`   Column: ${row.COLUMN_NAME}`);
        console.log(`   Type: ${row.DATA_TYPE}`);
        console.log(`   Column Type: ${row.COLUMN_TYPE}\n`);
      });
    }
    
    await sequelize.close();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBarangayColumns();
