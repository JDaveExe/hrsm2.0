require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQLDATABASE || process.env.DB_NAME,
  process.env.MYSQLUSER || process.env.DB_USER,
  process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log, // Enable logging to debug connection
  }
);

const connectDB = async () => {
  try {
    console.log('🔍 Database Configuration:');
    console.log('Host:', process.env.MYSQLHOST || process.env.DB_HOST);
    console.log('Port:', process.env.MYSQLPORT || process.env.DB_PORT);
    console.log('Database:', process.env.MYSQLDATABASE || process.env.DB_NAME);
    console.log('User:', process.env.MYSQLUSER || process.env.DB_USER);
    console.log('Password:', (process.env.MYSQLPASSWORD || process.env.DB_PASSWORD) ? '***SET***' : 'NOT SET');
    
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully!');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
