// Database protection and initialization script
require('dotenv').config();
const { sequelize } = require('../config/database');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Family = require('../models/Family');

class DatabaseProtection {
  constructor() {
    this.isInitialized = false;
  }

  async initializeDatabase() {
    try {
      console.log('🔧 Initializing database protection...');
      
      // Test connection first
      await sequelize.authenticate();
      console.log('✅ Database connection established');

      // Check if patients table exists and has proper structure
      const tableExists = await this.checkTableExists('Patients');
      
      if (!tableExists) {
        console.log('📋 Patients table not found, creating...');
        await this.createPatientsTable();
      } else {
        console.log('📋 Patients table exists, checking structure...');
        await this.validateTableStructure();
      }

      // Ensure proper indexes without duplicates
      await this.ensureProperIndexes();
      
      this.isInitialized = true;
      console.log('✅ Database protection initialized successfully');
      
    } catch (error) {
      console.error('❌ Database protection initialization failed:', error);
      throw error;
    }
  }

  async checkTableExists(tableName) {
    try {
      const [results] = await sequelize.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = '${process.env.DB_NAME || 'hrsm2'}' 
        AND table_name = '${tableName}'
      `);
      return results[0].count > 0;
    } catch (error) {
      console.error('Error checking table existence:', error);
      return false;
    }
  }

  async createPatientsTable() {
    try {
      // Force create the table with proper structure
      await Patient.sync({ force: true });
      console.log('✅ Patients table created successfully');
    } catch (error) {
      console.error('Error creating Patients table:', error);
      throw error;
    }
  }

  async validateTableStructure() {
    try {
      // Check current indexes
      const [indexes] = await sequelize.query('SHOW INDEXES FROM Patients');
      
      // Count duplicate indexes
      const indexCounts = {};
      indexes.forEach(idx => {
        const key = `${idx.Column_name}_${idx.Non_unique}`;
        indexCounts[key] = (indexCounts[key] || 0) + 1;
      });

      // Check for duplicates
      const hasDuplicates = Object.values(indexCounts).some(count => count > 1);
      
      if (hasDuplicates || indexes.length > 10) {
        console.log('⚠️  Detected duplicate or excessive indexes, rebuilding table...');
        await this.rebuildPatientsTable();
      } else {
        console.log('✅ Table structure is valid');
      }
    } catch (error) {
      console.error('Error validating table structure:', error);
      // If validation fails, rebuild the table
      await this.rebuildPatientsTable();
    }
  }

  async rebuildPatientsTable() {
    try {
      console.log('🔨 Rebuilding Patients table...');
      
      // Backup existing data
      const [existingPatients] = await sequelize.query('SELECT * FROM Patients');
      console.log(`📦 Backing up ${existingPatients.length} existing patients`);
      
      // Drop and recreate table
      await sequelize.query('DROP TABLE IF EXISTS Patients');
      await Patient.sync({ force: true });
      
      // Restore data if any existed
      if (existingPatients.length > 0) {
        console.log('📥 Restoring patient data...');
        for (const patient of existingPatients) {
          try {
            await Patient.create(patient);
          } catch (restoreError) {
            console.warn(`Warning: Could not restore patient ${patient.id}:`, restoreError.message);
          }
        }
        console.log('✅ Patient data restored');
      }
      
    } catch (error) {
      console.error('Error rebuilding Patients table:', error);
      throw error;
    }
  }

  async ensureProperIndexes() {
    try {
      // Remove any existing duplicate indexes manually
      const [indexes] = await sequelize.query('SHOW INDEXES FROM Patients WHERE Key_name != "PRIMARY"');
      
      // Group indexes by column and type
      const indexGroups = {};
      indexes.forEach(idx => {
        const key = `${idx.Column_name}_${idx.Non_unique}`;
        if (!indexGroups[key]) indexGroups[key] = [];
        indexGroups[key].push(idx.Key_name);
      });

      // Remove duplicates, keeping only the first one
      for (const [key, indexNames] of Object.entries(indexGroups)) {
        if (indexNames.length > 1) {
          // Keep the first, remove the rest
          for (let i = 1; i < indexNames.length; i++) {
            try {
              await sequelize.query(`DROP INDEX \`${indexNames[i]}\` ON Patients`);
              console.log(`🗑️  Removed duplicate index: ${indexNames[i]}`);
            } catch (dropError) {
              console.warn(`Warning: Could not drop index ${indexNames[i]}:`, dropError.message);
            }
          }
        }
      }

      console.log('✅ Index cleanup completed');
    } catch (error) {
      console.error('Error ensuring proper indexes:', error);
    }
  }

  async getStatus() {
    try {
      const [indexes] = await sequelize.query('SHOW INDEXES FROM Patients');
      const [tableInfo] = await sequelize.query('DESCRIBE Patients');
      
      return {
        initialized: this.isInitialized,
        totalIndexes: indexes.length,
        totalColumns: tableInfo.length,
        indexes: indexes.map(idx => ({
          name: idx.Key_name,
          column: idx.Column_name,
          unique: idx.Non_unique === 0
        }))
      };
    } catch (error) {
      return {
        initialized: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const dbProtection = new DatabaseProtection();

module.exports = dbProtection;
