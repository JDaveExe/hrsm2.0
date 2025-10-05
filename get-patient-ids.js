require('dotenv').config({ path: './backend/.env' });
const { Patient } = require('./backend/models');

async function getPatientIds() {
  try {
    const patients = await Patient.findAll({
      attributes: ['id', 'firstName', 'lastName'],
      limit: 5
    });
    
    console.log('Available Patient IDs:');
    patients.forEach(patient => {
      console.log(`  ID: ${patient.id} - ${patient.firstName} ${patient.lastName}`);
    });
    
    return patients.map(p => p.id);
  } catch (error) {
    console.error('Error fetching patients:', error.message);
    return [];
  }
}

if (require.main === module) {
  getPatientIds().then(ids => {
    console.log('\nPatient IDs array:', ids);
    process.exit(0);
  });
}

module.exports = { getPatientIds };