require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'hrsm'
    });
    
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('All tables:', tables.map(t => Object.values(t)[0]));
    
    await connection.end();
}

checkTables();
