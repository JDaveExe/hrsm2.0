const { sequelize } = require('./config/database');
const { Family, Patient } = require('./models');

async function checkExistingData() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Get all families
    const families = await Family.findAll({
      include: [{
        model: Patient,
        as: 'members'
      }]
    });
    
    console.log('📊 Existing Families and Members:');
    console.log('=====================================');
    
    families.forEach(family => {
      console.log(`Family: ${family.familyName} (ID: ${family.id})`);
      if (family.members && family.members.length > 0) {
        family.members.forEach(member => {
          const age = new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear();
          console.log(`  - ${member.firstName} ${member.lastName} (Age: ${age}, Gender: ${member.gender})`);
        });
      } else {
        console.log('  - No members');
      }
      console.log('');
    });
    
    console.log(`Total Families: ${families.length}`);
    console.log(`Total Patients: ${families.reduce((sum, f) => sum + (f.members ? f.members.length : 0), 0)}`);
    
    // Get just family names for reference
    console.log('\n📝 Family Names in Database:');
    console.log('============================');
    families.forEach(family => {
      console.log(`- ${family.familyName}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkExistingData();
