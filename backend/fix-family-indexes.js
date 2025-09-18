const { sequelize } = require('./config/database');

async function fixFamilyTableIndexes() {
  try {
    console.log('🔧 Starting Family table index cleanup...');
    
    // Get all indexes on the families table
    const [indexes] = await sequelize.query(`
      SHOW INDEX FROM families WHERE Key_name != 'PRIMARY'
    `);
    
    console.log(`📊 Found ${indexes.length} non-primary indexes on families table`);
    
    // Remove all non-primary indexes
    for (const index of indexes) {
      try {
        if (index.Key_name !== 'PRIMARY') {
          console.log(`🗑️ Dropping index: ${index.Key_name}`);
          await sequelize.query(`DROP INDEX \`${index.Key_name}\` ON families`);
        }
      } catch (error) {
        console.log(`⚠️ Could not drop index ${index.Key_name}:`, error.message);
      }
    }
    
    console.log('✅ Family table index cleanup completed');
    
  } catch (error) {
    console.error('❌ Error fixing family table indexes:', error);
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    await fixFamilyTableIndexes();
    
    console.log('🎉 Database fix completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixFamilyTableIndexes };
