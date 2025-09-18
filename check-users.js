const mysql = require('mysql2/promise');

async function checkUsers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hrsm2'
  });

  try {
    console.log('🔍 Checking available users in the system...\n');
    
    // Get all users to see what IDs are available
    const [users] = await connection.execute(`
      SELECT id, username, role
      FROM users 
      ORDER BY id
    `);
    
    console.log('Available users:');
    users.forEach(user => {
      console.log(`  ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });
    
    console.log(`\nTotal users: ${users.length}`);
    
    // Check if there are any doctors
    const [doctors] = await connection.execute(`
      SELECT id, username, role
      FROM users 
      WHERE role = 'doctor'
      ORDER BY id
    `);
    
    console.log(`\nDoctors available: ${doctors.length}`);
    doctors.forEach(doctor => {
      console.log(`  Doctor ID: ${doctor.id}, Username: ${doctor.username}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsers();