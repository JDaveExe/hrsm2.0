require('dotenv').config();
const { Sequelize } = require('sequelize');

// Database connection details from environment variables
console.log('Database connection details:');
console.log(`Host: ${process.env.DB_HOST || 'Not defined'}`);
console.log(`User: ${process.env.DB_USER || 'Not defined'}`);
console.log(`Database: ${process.env.DB_NAME || 'Not defined'}`);
console.log(`Password: ${process.env.DB_PASSWORD ? '******' : 'Not defined or empty'}`);

// Create a connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'hrsm2',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: console.log,
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Create database if it doesn't exist
    try {
      await sequelize.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'hrsm2'}`);
      console.log(`Database ${process.env.DB_NAME || 'hrsm2'} created or already exists.`);
    } catch (dbError) {
      console.error('Failed to create database:', dbError);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

testConnection();
