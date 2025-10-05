require('dotenv').config({ path: './backend/.env' });
const { Sequelize } = require('sequelize');

console.log('🔍 Checking Users Table Structure');
console.log('=================================');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  }
);

async function checkUsersTable() {
  try {
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database!');

    // Get structure of users table
    const [results] = await sequelize.query('DESCRIBE users');
    
    console.log('\n📊 Structure of users table:');
    console.log('============================');
    results.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `(${column.Key})` : ''}`);
    });

    // Get sample data from users table where role is doctor
    console.log('\n👨‍⚕️ Sample Doctor Users:');
    console.log('========================');
    const [doctors] = await sequelize.query("SELECT * FROM users WHERE role = 'doctor' LIMIT 5");
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found in users table');
    } else {
      doctors.forEach((doctor, index) => {
        console.log(`${index + 1}. ID: ${doctor.id}`);
        console.log(`   Columns: ${Object.keys(doctor).join(', ')}`);
        console.log(`   Sample data: ${JSON.stringify(doctor, null, 2)}`);
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
    console.log('🔐 Database connection closed');
  }
}

checkUsersTable();