/**
 * Migration to add clinical notes fields to CheckInSession table
 * Run this file to add the new fields for storing checkup clinical information
 */

const { sequelize } = require('../config/database');

async function addClinicalNotesFields() {
  try {
    console.log('🔄 Starting migration: Adding clinical notes fields...');

    // Add new columns to check_in_sessions table
    await sequelize.query(`
      ALTER TABLE check_in_sessions 
      ADD COLUMN IF NOT EXISTS chiefComplaint TEXT,
      ADD COLUMN IF NOT EXISTS presentSymptoms TEXT,
      ADD COLUMN IF NOT EXISTS treatmentPlan TEXT
    `);

    console.log('✅ Migration completed successfully!');
    console.log('📋 Added fields:');
    console.log('   - chiefComplaint: TEXT (Primary reason for patient visit)');
    console.log('   - presentSymptoms: TEXT (Current symptoms described by patient)');
    console.log('   - treatmentPlan: TEXT (Prescribed treatment plan)');
    console.log('💡 Note: The diagnosis field already exists in the model');
    console.log('💡 Note: The doctorNotes field already exists in the model');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration if called directly
if (require.main === module) {
  addClinicalNotesFields()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addClinicalNotesFields };
