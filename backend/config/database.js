require('dotenv').config();
const { Sequelize } = require('sequelize');

// Check if DATABASE_URL is provided (Railway format)
let sequelize;
if (process.env.DATABASE_URL) {
  console.log('📡 Using DATABASE_URL connection string');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'mysql',
    logging: console.log,
  });
} else {
  // Fallback to individual environment variables
  console.log('📡 Using individual MySQL environment variables');
  sequelize = new Sequelize(
    process.env.MYSQLDATABASE || process.env.DB_NAME,
    process.env.MYSQLUSER || process.env.DB_USER,
    process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    {
      host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
      port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: console.log, // Enable logging to debug connection
    }
  );
}

const connectDB = async () => {
  try {
    console.log('🔍 Database Configuration Debug:');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (using connection string)' : 'NOT SET');
    console.log('MYSQLHOST:', process.env.MYSQLHOST || 'NOT SET');
    console.log('MYSQLDATABASE:', process.env.MYSQLDATABASE || 'NOT SET');
    console.log('MYSQLUSER:', process.env.MYSQLUSER || 'NOT SET');
    console.log('MYSQLPASSWORD:', process.env.MYSQLPASSWORD ? '***SET***' : 'NOT SET');
    console.log('MYSQLPORT:', process.env.MYSQLPORT || 'NOT SET');
    console.log('---');
    
    await sequelize.authenticate();
    console.log('✅ MySQL Connected successfully!');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
