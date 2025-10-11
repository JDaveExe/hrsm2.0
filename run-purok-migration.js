const { sequelize } = require('./backend/config/database');

async function migrateDatabaseColumn() {
  try {
    console.log('🔄 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');
    
    console.log('📊 Current table structure:');
    const [currentStructure] = await sequelize.query('DESCRIBE Patients');
    console.table(currentStructure);
    
    console.log('\n🔄 Starting migration: barangay → purok...\n');
    
    // Check if barangay column exists
    const barangayExists = currentStructure.some(col => col.Field === 'barangay');
    const purokExists = currentStructure.some(col => col.Field === 'purok');
    
    if (!barangayExists && purokExists) {
      console.log('✅ Migration already completed! Column "purok" exists.');
      await sequelize.close();
      return;
    }
    
    if (!barangayExists && !purokExists) {
      console.log('❌ Neither "barangay" nor "purok" column found!');
      await sequelize.close();
      process.exit(1);
    }
    
    // Begin transaction
    console.log('🔒 Starting transaction...');
    await sequelize.query('START TRANSACTION');
    
    try {
      // Rename column
      console.log('🔄 Renaming column: barangay → purok...');
      await sequelize.query('ALTER TABLE Patients CHANGE COLUMN barangay purok VARCHAR(255)');
      
      // Verify the change
      console.log('✅ Column renamed successfully!');
      console.log('\n📊 New table structure:');
      const [newStructure] = await sequelize.query('DESCRIBE Patients');
      console.table(newStructure);
      
      // Check data
      console.log('\n📊 Sample data (first 5 records):');
      const [sampleData] = await sequelize.query(`
        SELECT id, firstName, lastName, purok, street, city 
        FROM Patients 
        ORDER BY id 
        LIMIT 5
      `);
      console.table(sampleData);
      
      // Count records
      const [counts] = await sequelize.query(`
        SELECT 
          COUNT(*) as total_patients,
          COUNT(purok) as patients_with_purok,
          COUNT(*) - COUNT(purok) as patients_without_purok
        FROM Patients
      `);
      console.log('\n📊 Patient statistics:');
      console.table(counts);
      
      // Commit transaction
      console.log('\n💾 Committing changes...');
      await sequelize.query('COMMIT');
      
      console.log('\n✅ Migration completed successfully!');
      console.log('🎉 Database column "barangay" has been renamed to "purok"');
      
    } catch (error) {
      console.error('\n❌ Migration failed! Rolling back...');
      await sequelize.query('ROLLBACK');
      throw error;
    }
    
    await sequelize.close();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('\n❌ Error during migration:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

console.log('═══════════════════════════════════════════════');
console.log('  DATABASE MIGRATION: barangay → purok');
console.log('═══════════════════════════════════════════════\n');

migrateDatabaseColumn();
