const { sequelize } = require('./backend/config/database');
const fs = require('fs');

async function backupDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `hrsm2_backup_before_purok_${timestamp}.json`;
    
    console.log('📊 Fetching all patient data...');
    
    // Get all patient records
    const [patients] = await sequelize.query(`
      SELECT * FROM Patients ORDER BY id
    `);
    
    console.log(`Found ${patients.length} patient records`);
    
    // Save to JSON file
    fs.writeFileSync(
      backupFile,
      JSON.stringify(patients, null, 2),
      'utf8'
    );
    
    console.log(`\n✅ Backup saved to: ${backupFile}`);
    console.log(`📦 Backup size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);
    console.log('\n⚠️  This is a JSON backup of patient data.');
    console.log('For full database backup, use: mysqldump -u root -p hrsm2 > backup.sql\n');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

backupDatabase();
