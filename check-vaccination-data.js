const {sequelize} = require('./backend/config/database');

async function checkVaccinationData() {
  try {
    await sequelize.authenticate();
    
    // Check vaccinations table
    const [vaccTable] = await sequelize.query('SELECT COUNT(*) as count FROM vaccinations');
    console.log('Vaccinations table:', vaccTable[0].count, 'records');
    
    // Check check_in_sessions with vaccination data
    const [sessionTable] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM check_in_sessions 
      WHERE vaccination IS NOT NULL 
        AND vaccination != '' 
        AND vaccination != '[]'
        AND vaccination != 'null'
    `);
    console.log('Check-in sessions with vaccination:', sessionTable[0].count, 'records');
    
    // Sample vaccination data from sessions
    const [sampleData] = await sequelize.query(`
      SELECT vaccination 
      FROM check_in_sessions 
      WHERE vaccination IS NOT NULL 
        AND vaccination != '' 
        AND vaccination != '[]'
        AND vaccination != 'null'
      LIMIT 3
    `);
    
    console.log('\nSample vaccination data from sessions:');
    sampleData.forEach((row, i) => {
      console.log(`${i + 1}:`, row.vaccination.substring(0, 100) + '...');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkVaccinationData();