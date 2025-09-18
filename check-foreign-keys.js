const mysql = require('mysql2/promise');

async function checkForeignKeys() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hrsm2'
  });

  try {
    console.log('🔍 Checking foreign key constraints on check_in_sessions table...\n');
    
    // Get the table structure and constraints
    const [constraints] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_NAME = 'check_in_sessions' 
        AND TABLE_SCHEMA = 'hrsm2'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY CONSTRAINT_NAME
    `);
    
    console.log('Foreign key constraints:');
    constraints.forEach(constraint => {
      console.log(`  ${constraint.CONSTRAINT_NAME}:`);
      console.log(`    Column: ${constraint.COLUMN_NAME}`);
      console.log(`    References: ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
      console.log('');
    });
    
    // Check specifically constraint check_in_sessions_ibfk_103
    const [specificConstraint] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE CONSTRAINT_NAME = 'check_in_sessions_ibfk_103'
        AND TABLE_SCHEMA = 'hrsm2'
    `);
    
    console.log('Specific constraint check_in_sessions_ibfk_103:');
    specificConstraint.forEach(constraint => {
      console.log(`  Column: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkForeignKeys();