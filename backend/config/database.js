require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || process.env.MYSQLDATABASE,
  process.env.DB_USER || process.env.MYSQLUSER,
  process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
  {
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    dialect: 'mysql',
    logging: console.log, // Enable logging to debug connection
  }
);

const connectDB = async () => {
  try {
    console.log('🔍 Database Configuration:');
    console.log('Host:', process.env.DB_HOST || process.env.MYSQLHOST);
    console.log('Port:', process.env.DB_PORT || process.env.MYSQLPORT);
    console.log('Database:', process.env.DB_NAME || process.env.MYSQLDATABASE);
    console.log('User:', process.env.DB_USER || process.env.MYSQLUSER);
    console.log('Password:', process.env.DB_PASSWORD || process.env.MYSQLPASSWORD ? '***SET***' : 'NOT SET');
    
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully!');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
