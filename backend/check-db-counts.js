const { sequelize } = require('./config/database');

const checkActualCounts = async () => {
  try {
    await sequelize.authenticate();
    console.log('🔍 Checking actual database counts...\n');

    // Check patients table
    const patients = await sequelize.query(
      'SELECT COUNT(*) as count FROM patients', 
      { type: sequelize.QueryTypes.SELECT }
    );

    // Check patient users
    const patientUsers = await sequelize.query(
      'SELECT COUNT(*) as count FROM users WHERE role = "patient"', 
      { type: sequelize.QueryTypes.SELECT }
    );

    // Check families
    const families = await sequelize.query(
      'SELECT COUNT(*) as count FROM families', 
      { type: sequelize.QueryTypes.SELECT }
    );

    // List any remaining patients
    const remainingPatients = await sequelize.query(
      'SELECT id, firstName, lastName, userId FROM patients', 
      { type: sequelize.QueryTypes.SELECT }
    );

    // List any remaining patient users
    const remainingUsers = await sequelize.query(
      'SELECT id, email, contactNumber, role FROM users WHERE role = "patient"', 
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log('📊 ACTUAL DATABASE COUNTS:');
    console.log(`   Patients: ${patients[0].count}`);
    console.log(`   Patient Users: ${patientUsers[0].count}`);
    console.log(`   Families: ${families[0].count}`);

    if (remainingPatients.length > 0) {
      console.log('\n🚨 REMAINING PATIENTS:');
      remainingPatients.forEach(p => {
        console.log(`   - ${p.firstName} ${p.lastName} (ID: ${p.id}, UserID: ${p.userId || 'None'})`);
      });
    }

    if (remainingUsers.length > 0) {
      console.log('\n🚨 REMAINING PATIENT USERS:');
      remainingUsers.forEach(u => {
        console.log(`   - ${u.email || u.contactNumber} (ID: ${u.id}, Role: ${u.role})`);
      });
    }

    if (patients[0].count === 0 && patientUsers[0].count === 0) {
      console.log('\n✅ Database is clean - no patients or patient users found');
      console.log('💡 The dashboard showing "3 patients" might be a caching issue');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await sequelize.close();
  }
};

checkActualCounts();
