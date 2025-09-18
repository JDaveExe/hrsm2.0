const mysql = require('mysql2/promise');

async function checkVaccinationSession() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hrsm2'
  });

  try {
    console.log('🔍 Checking last few sessions in check_in_sessions table...\n');
    
    // Get the last 5 sessions to see their status
    const [sessions] = await connection.execute(`
      SELECT id, patientId, status, createdAt, updatedAt, completedAt
      FROM check_in_sessions 
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    console.log('Last 5 sessions:');
    sessions.forEach(session => {
      console.log(`  ID: ${session.id}, Patient: ${session.patientId}, Status: "${session.status}", Updated: ${session.updatedAt}`);
    });
    
    // Check for vaccination-completed status specifically
    const [vaccinationSessions] = await connection.execute(`
      SELECT id, patientId, status, createdAt, updatedAt
      FROM check_in_sessions 
      WHERE status = 'vaccination-completed'
      ORDER BY id DESC
    `);
    
    console.log(`\n📊 Total sessions with "vaccination-completed" status: ${vaccinationSessions.length}`);
    if (vaccinationSessions.length > 0) {
      console.log('Vaccination-completed sessions:');
      vaccinationSessions.forEach(session => {
        console.log(`  ID: ${session.id}, Patient: ${session.patientId}, Updated: ${session.updatedAt}`);
      });
    }
    
    // Check today's completed sessions (both statuses)
    const [todayCompleted] = await connection.execute(`
      SELECT id, patientId, status, updatedAt
      FROM check_in_sessions 
      WHERE (status = 'completed' OR status = 'vaccination-completed')
        AND DATE(updatedAt) = CURDATE()
      ORDER BY updatedAt DESC
    `);
    
    console.log(`\n📅 Today's completed sessions (both types): ${todayCompleted.length}`);
    todayCompleted.forEach(session => {
      console.log(`  ID: ${session.id}, Patient: ${session.patientId}, Status: "${session.status}", Time: ${session.updatedAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkVaccinationSession();