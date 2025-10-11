/**
 * Production Database Initialization Script
 * This script initializes all database tables for Railway deployment
 * Run this ONCE after deploying to Railway with MySQL database
 */

require('dotenv').config();
const { sequelize } = require('../config/database');

// Import all models to ensure they're registered with Sequelize
const models = require('../models');

async function initializeDatabase() {
  console.log('🚀 Starting Production Database Initialization...\n');
  
  try {
    // Test database connection
    console.log('1️⃣ Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!\n');
    
    // Log database info
    console.log('📊 Database Configuration:');
    console.log(`   Host: ${process.env.MYSQLHOST || process.env.DB_HOST}`);
    console.log(`   Database: ${process.env.MYSQLDATABASE || process.env.DB_NAME}`);
    console.log(`   User: ${process.env.MYSQLUSER || process.env.DB_USER}`);
    console.log('');
    
    // Sync all models (create tables if they don't exist)
    console.log('2️⃣ Creating database tables...');
    console.log('   This may take a minute...\n');
    
    // Use alter: true to update existing tables, force: false to preserve data
    await sequelize.sync({ alter: false, force: false });
    
    console.log('✅ All tables created successfully!\n');
    
    // List all created tables
    console.log('3️⃣ Verifying tables...');
    const tables = await sequelize.query(
      "SHOW TABLES",
      { type: sequelize.QueryTypes.SHOWTABLES }
    );
    
    console.log(`   Found ${tables.length} tables:`);
    tables.forEach(table => console.log(`   - ${table}`));
    console.log('');
    
    // Create default admin user if it doesn't exist
    console.log('4️⃣ Setting up default admin account...');
    const User = models.User;
    
    const adminExists = await User.findOne({ 
      where: { username: 'admin' } 
    });
    
    if (!adminExists) {
      await User.createDefaultUsers();
      console.log('✅ Default admin account created');
      console.log('   Username: admin');
      console.log('   Password: admin123 (CHANGE THIS IMMEDIATELY!)');
    } else {
      console.log('ℹ️  Admin account already exists');
    }
    console.log('');
    
    console.log('🎉 Database initialization complete!\n');
    console.log('📝 Next steps:');
    console.log('   1. Log in with admin credentials');
    console.log('   2. Change default admin password');
    console.log('   3. Create additional user accounts');
    console.log('   4. Start using the system!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:\n');
    console.error(error);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check that MySQL database is running');
    console.error('   2. Verify environment variables are set correctly');
    console.error('   3. Ensure database user has CREATE TABLE permissions');
    console.error('   4. Check Railway logs for more details\n');
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
