const { User } = require('./backend/models');
const { Op } = require('sequelize');

// Load database connection
require('./backend/config/database');

async function checkDoctorAccounts() {
  try {
    console.log('🔍 Checking for doctor accounts...');
    
    // Check for Johnny Davis
    const johnnyDavis = await User.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { firstName: 'Johnny', lastName: 'Davis' },
              { firstName: 'John', lastName: 'Davis' }
            ]
          },
          { role: 'doctor' }
        ]
      }
    });
    
    // Check for Alison Shore
    const alisonShore = await User.findOne({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { firstName: 'Alison', lastName: 'Shore' },
              { firstName: 'Allison', lastName: 'Shore' }
            ]
          },
          { role: 'doctor' }
        ]
      }
    });
    
    // Get all doctors
    const allDoctors = await User.findAll({
      where: {
        role: 'doctor',
        isActive: true
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'email', 'position']
    });
    
    console.log('\n📋 All doctor accounts in system:');
    allDoctors.forEach(doctor => {
      console.log(`- ID: ${doctor.id}, Name: ${doctor.firstName} ${doctor.lastName}, Username: ${doctor.username}, Email: ${doctor.email}`);
    });
    
    console.log('\n🎯 Target doctors:');
    if (johnnyDavis) {
      console.log(`✅ Johnny Davis found: ID ${johnnyDavis.id}, Username: ${johnnyDavis.username}`);
    } else {
      console.log('❌ Johnny Davis not found');
    }
    
    if (alisonShore) {
      console.log(`✅ Alison Shore found: ID ${alisonShore.id}, Username: ${alisonShore.username}`);
    } else {
      console.log('❌ Alison Shore not found');
    }
    
    return {
      johnnyDavis,
      alisonShore,
      allDoctors
    };
    
  } catch (error) {
    console.error('Error checking doctor accounts:', error);
  }
}

checkDoctorAccounts().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});