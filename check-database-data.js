const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });
const { sequelize } = require('./backend/config/database');

async function checkDatabaseData() {
  try {
    console.log('🔍 Checking database data...\n');

    // Check Patients table
    const [patients] = await sequelize.query(`
      SELECT 
        COUNT(*) as totalPatients,
        COUNT(CASE WHEN gender = 'Male' THEN 1 END) as malePatients,
        COUNT(CASE WHEN gender = 'Female' THEN 1 END) as femalePatients,
        MIN(dateOfBirth) as oldestDOB,
        MAX(dateOfBirth) as youngestDOB
      FROM Patients
    `);

    console.log('👥 PATIENTS DATA:');
    console.log('  Total Patients:', patients[0]?.totalPatients || 0);
    console.log('  Male Patients:', patients[0]?.malePatients || 0);
    console.log('  Female Patients:', patients[0]?.femalePatients || 0);
    console.log('  Oldest DOB:', patients[0]?.oldestDOB || 'N/A');
    console.log('  Youngest DOB:', patients[0]?.youngestDOB || 'N/A');

    // Check sample patients
    const [samplePatients] = await sequelize.query(`
      SELECT id, firstName, lastName, dateOfBirth, gender, civilStatus
      FROM Patients 
      LIMIT 5
    `);

    console.log('\n📋 SAMPLE PATIENTS:');
    samplePatients.forEach((patient, index) => {
      console.log(`  ${index + 1}. ${patient.firstName} ${patient.lastName} - ${patient.gender} - DOB: ${patient.dateOfBirth} - Civil: ${patient.civilStatus || 'N/A'}`);
    });

    // Check age distribution
    const [ageDistribution] = await sequelize.query(`
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 0 AND 10 THEN '0-10'
          WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 11 AND 20 THEN '11-20'
          WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 21 AND 30 THEN '21-30'
          WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 31 AND 40 THEN '31-40'
          WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 41 AND 50 THEN '41-50'
          WHEN TIMESTAMPDIFF(YEAR, dateOfBirth, CURDATE()) BETWEEN 51 AND 60 THEN '51-60'
          ELSE '61+'
        END as ageGroup,
        COUNT(*) as count
      FROM Patients 
      WHERE dateOfBirth IS NOT NULL
      GROUP BY ageGroup
      ORDER BY ageGroup
    `);

    console.log('\n📊 AGE DISTRIBUTION:');
    ageDistribution.forEach(group => {
      console.log(`  ${group.ageGroup}: ${group.count} patients`);
    });

    // Check Families table
    const [families] = await sequelize.query(`
      SELECT COUNT(*) as totalFamilies
      FROM Families
    `);

    console.log('\n🏠 FAMILIES DATA:');
    console.log('  Total Families:', families[0]?.totalFamilies || 0);

    // Check Checkup sessions
    const [checkups] = await sequelize.query(`
      SELECT 
        COUNT(*) as totalCheckups,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedCheckups,
        COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as inProgressCheckups
      FROM check_in_sessions
    `);

    console.log('\n🏥 CHECKUP DATA:');
    console.log('  Total Checkups:', checkups[0]?.totalCheckups || 0);
    console.log('  Completed Checkups:', checkups[0]?.completedCheckups || 0);
    console.log('  In-Progress Checkups:', checkups[0]?.inProgressCheckups || 0);

    // Check recent checkup trends
    const [checkupTrends] = await sequelize.query(`
      SELECT 
        DATE(updatedAt) as date,
        DAYNAME(updatedAt) as dayName,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedCheckups
      FROM check_in_sessions 
      WHERE updatedAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        AND status = 'completed'
      GROUP BY DATE(updatedAt), DAYNAME(updatedAt)
      ORDER BY date
    `);

    console.log('\n📈 CHECKUP TRENDS (Last 7 days):');
    if (checkupTrends.length > 0) {
      checkupTrends.forEach(trend => {
        console.log(`  ${trend.dayName} (${trend.date}): ${trend.completedCheckups} completed checkups`);
      });
    } else {
      console.log('  No checkup data in the last 7 days');
    }

    // Check Appointments
    const [appointments] = await sequelize.query(`
      SELECT COUNT(*) as totalAppointments
      FROM Appointments
    `);

    console.log('\n📅 APPOINTMENTS DATA:');
    console.log('  Total Appointments:', appointments[0]?.totalAppointments || 0);

    await sequelize.close();

  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabaseData();
