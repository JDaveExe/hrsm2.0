const { Vaccination } = require('./models');
const { Sequelize } = require('sequelize');

async function checkVaccinations() {
  try {
    console.log('Checking vaccination records in database...');
    
    const vaccinations = await Vaccination.findAll({
      where: {
        deletedAt: null
      },
      attributes: ['id', 'vaccineName', 'patientId', 'createdAt'],
      raw: true
    });
    
    console.log('Found vaccination records:', vaccinations.length);
    vaccinations.forEach((vacc, i) => {
      console.log(`${i+1}. Patient ${vacc.patientId}: ${vacc.vaccineName} (ID: ${vacc.id})`);
    });
    
    // Also check the usage count query
    console.log('\nTesting usage query...');
    const usageResults = await Vaccination.findAll({
      attributes: [
        ['vaccineName', 'vaccine_name'],
        [Sequelize.fn('COUNT', '*'), 'usage_count']
      ],
      where: {
        deletedAt: null
      },
      group: ['vaccineName'],
      order: [[Sequelize.fn('COUNT', '*'), 'DESC']],
      raw: true
    });
    
    console.log('Usage query results:', usageResults);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkVaccinations();