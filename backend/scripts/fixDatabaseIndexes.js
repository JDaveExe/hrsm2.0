const { sequelize } = require('../config/database');

const fixDatabaseIndexes = async () => {
  try {
    console.log('🔧 Starting database index cleanup...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Get current indexes on families table
    const [indexes] = await sequelize.query(`
      SHOW INDEX FROM families
    `);
    
    console.log(`📊 Found ${indexes.length} indexes on families table:`);
    
    // Group indexes by key name to see duplicates
    const indexGroups = {};
    indexes.forEach(index => {
      if (!indexGroups[index.Key_name]) {
        indexGroups[index.Key_name] = [];
      }
      indexGroups[index.Key_name].push(index);
    });
    
    console.log(`🔍 Index groups found:`);
    Object.keys(indexGroups).forEach(keyName => {
      console.log(`   - ${keyName}: ${indexGroups[keyName].length} columns`);
    });
    
    // Drop duplicate/unnecessary indexes (keep PRIMARY and essential ones)
    const indexesToDrop = Object.keys(indexGroups).filter(keyName => 
      keyName !== 'PRIMARY' && 
      keyName !== 'familyId' && 
      keyName !== 'contactNumber'
    );
    
    console.log(`🗑️  Dropping ${indexesToDrop.length} unnecessary indexes...`);
    
    for (const indexName of indexesToDrop) {
      try {
        await sequelize.query(`DROP INDEX \`${indexName}\` ON families`);
        console.log(`   ✅ Dropped index: ${indexName}`);
      } catch (error) {
        console.log(`   ⚠️  Failed to drop ${indexName}: ${error.message}`);
      }
    }
    
    // Also check for any duplicate unique constraints and remove them
    try {
      // Remove any duplicate unique constraints on contactNumber
      await sequelize.query(`
        ALTER TABLE families 
        DROP INDEX contactNumber
      `);
      console.log('✅ Removed duplicate contactNumber unique constraint');
    } catch (error) {
      console.log('ℹ️  No duplicate contactNumber constraint to remove');
    }
    
    // Re-add the contactNumber unique constraint properly
    try {
      await sequelize.query(`
        ALTER TABLE families 
        ADD UNIQUE INDEX idx_families_contact (contactNumber)
      `);
      console.log('✅ Added clean contactNumber unique index');
    } catch (error) {
      console.log('ℹ️  ContactNumber unique constraint already exists or failed to add:', error.message);
    }
    
    // Show final index count
    const [finalIndexes] = await sequelize.query(`SHOW INDEX FROM families`);
    console.log(`📊 Final state: ${finalIndexes.length} indexes remaining`);
    
    console.log('✅ Database index cleanup completed!');
    console.log('🚀 Server should now start successfully');
    
  } catch (error) {
    console.error('❌ Error during index cleanup:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the fix
fixDatabaseIndexes();
