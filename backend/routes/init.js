const express = require('express');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Database initialization endpoint
router.post('/init-database', async (req, res) => {
  try {
    console.log('🔄 Starting database initialization...');
    
    // Create tables in the correct order without foreign keys first
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'doctor', 'management', 'patient') NOT NULL,
        firstName VARCHAR(255),
        lastName VARCHAR(255),
        email VARCHAR(255),
        isActive BOOLEAN DEFAULT TRUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Users table created');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS families (
        id INT AUTO_INCREMENT PRIMARY KEY,
        familyName VARCHAR(255) NOT NULL,
        surname VARCHAR(255) NOT NULL,
        headOfFamily VARCHAR(255) NOT NULL,
        contactNumber VARCHAR(255),
        address VARCHAR(255),
        isActive BOOLEAN DEFAULT TRUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    console.log('✅ Families table created');
    
    // Create admin account if it doesn't exist
    const [adminExists] = await sequelize.query(
      'SELECT COUNT(*) as count FROM Users WHERE username = "admin"'
    );
    
    if (adminExists[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await sequelize.query(`
        INSERT INTO Users (username, password, role, firstName, lastName, email)
        VALUES ('admin', ?, 'admin', 'System', 'Administrator', 'admin@hrsm.local')
      `, {
        replacements: [hashedPassword]
      });
      console.log('✅ Admin account created');
    } else {
      console.log('ℹ️ Admin account already exists');
    }
    
    res.json({
      success: true,
      message: 'Database initialized successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;