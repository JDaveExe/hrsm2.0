require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrsm'
};

async function checkTableStructure() {
    let connection;
    
    try {
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected');
        
        console.log('\n📋 USERS TABLE STRUCTURE:');
        console.log('========================');
        const [userColumns] = await connection.execute('DESCRIBE users');
        userColumns.forEach(col => {
            console.log(`${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
        });
        
        console.log('\n📋 PATIENTS TABLE STRUCTURE:');
        console.log('============================');
        const [patientColumns] = await connection.execute('DESCRIBE patients');
        patientColumns.forEach(col => {
            console.log(`${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
        });
        
        console.log('\n📋 FAMILIES TABLE STRUCTURE:');
        console.log('============================');
        const [familyColumns] = await connection.execute('DESCRIBE families');
        familyColumns.forEach(col => {
            console.log(`${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}`);
        });

    } catch (error) {
        console.error('❌ Database error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

checkTableStructure();
