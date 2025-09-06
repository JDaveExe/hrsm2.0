const { sequelize } = require('./config/database');

const cleanupDatabase = async () => {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // Get all indexes on the families table
    const [indexes] = await sequelize.query(`
      SHOW INDEX FROM families WHERE Key_name != 'PRIMARY'
    `);
    
    console.log(`📊 Found ${indexes.length} non-primary indexes on families table`);
    
    // Group indexes by key name to find duplicates
    const indexGroups = {};
    indexes.forEach(index => {
      if (!indexGroups[index.Key_name]) {
        indexGroups[index.Key_name] = [];
      }
      indexGroups[index.Key_name].push(index);
    });
    
    // Drop duplicate indexes
    for (const [keyName, indexList] of Object.entries(indexGroups)) {
      if (indexList.length > 1 || keyName.includes('contactNumber')) {
        console.log(`🗑️ Dropping index: ${keyName}`);
        try {
          await sequelize.query(`DROP INDEX \`${keyName}\` ON families`);
        } catch (error) {
          console.log(`   ⚠️ Could not drop ${keyName}: ${error.message}`);
        }
      }
    }
    
    // Recreate the unique constraint properly
    console.log('🔧 Recreating contactNumber unique constraint...');
    try {
      await sequelize.query(`
        ALTER TABLE families 
        ADD CONSTRAINT families_contactNumber_unique 
        UNIQUE (contactNumber)
      `);
      console.log('✅ Unique constraint recreated');
    } catch (error) {
      console.log(`⚠️ Could not recreate constraint: ${error.message}`);
    }
    
    // Show final index count
    const [finalIndexes] = await sequelize.query(`
      SHOW INDEX FROM families WHERE Key_name != 'PRIMARY'
    `);
    console.log(`📊 Final index count: ${finalIndexes.length}`);
    
    console.log('✅ Database cleanup completed');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  } finally {
    await sequelize.close();
  }
};

cleanupDatabase();
