require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrsm'
};

// Test patient data with diverse names using existing family surnames
const testPatients = [
    {
        firstName: 'Maria',
        middleName: 'Carmen',
        lastName: 'Garcia',
        familyId: 7,
        dateOfBirth: '1995-03-15',
        gender: 'Female',
        contactNumber: '09171234567',
        email: 'maria.garcia@email.com',
        address: '123 Main St, Manila'
    },
    {
        firstName: 'Juan',
        middleName: 'Carlos',
        lastName: 'Martinez',
        familyId: 5,
        dateOfBirth: '1988-07-22',
        gender: 'Male',
        contactNumber: '09187654321',
        email: 'juan.martinez@email.com',
        address: '456 Rizal Ave, Quezon City'
    },
    {
        firstName: 'Ana',
        middleName: 'Isabel',
        lastName: 'Santos',
        familyId: 40,
        dateOfBirth: '1992-11-08',
        gender: 'Female',
        contactNumber: '09159876543',
        email: 'ana.santos@email.com',
        address: '789 Bonifacio St, Makati'
    },
    {
        firstName: 'Carlos',
        middleName: 'Miguel',
        lastName: 'Rodriguez',
        familyId: 21,
        dateOfBirth: '1985-05-14',
        gender: 'Male',
        contactNumber: '09123456789',
        email: 'carlos.rodriguez@email.com',
        address: '321 EDSA, Pasig'
    },
    {
        firstName: 'Sofia',
        middleName: 'Elena',
        lastName: 'Gonzales',
        familyId: 6,
        dateOfBirth: '1998-09-03',
        gender: 'Female',
        contactNumber: '09134567890',
        email: 'sofia.gonzales@email.com',
        address: '654 Aurora Blvd, San Juan'
    },
    {
        firstName: 'Miguel',
        middleName: 'Antonio',
        lastName: 'Cruz',
        familyId: 48,
        dateOfBirth: '1990-12-25',
        gender: 'Male',
        contactNumber: '09145678901',
        email: 'miguel.cruz@email.com',
        address: '987 Commonwealth Ave, QC'
    },
    {
        firstName: 'Carmen',
        middleName: 'Rosa',
        lastName: 'Ramos',
        familyId: 46,
        dateOfBirth: '1987-04-18',
        gender: 'Female',
        contactNumber: '09156789012',
        email: 'carmen.ramos@email.com',
        address: '147 Katipunan Ave, QC'
    },
    {
        firstName: 'Luis',
        middleName: 'Fernando',
        lastName: 'Mendoza',
        familyId: 53,
        dateOfBirth: '1993-08-07',
        gender: 'Male',
        contactNumber: '09167890123',
        email: 'luis.mendoza@email.com',
        address: '258 Ortigas Ave, Pasig'
    },
    {
        firstName: 'Isabella',
        middleName: 'Paz',
        lastName: 'Fernandez',
        familyId: 45,
        dateOfBirth: '1996-01-30',
        gender: 'Female',
        contactNumber: '09178901234',
        email: 'isabella.fernandez@email.com',
        address: '369 Taft Ave, Manila'
    },
    {
        firstName: 'Ricardo',
        middleName: 'Jose',
        lastName: 'Aquino',
        familyId: 50,
        dateOfBirth: '1991-06-12',
        gender: 'Male',
        contactNumber: '09189012345',
        email: 'ricardo.aquino@email.com',
        address: '741 Shaw Blvd, Mandaluyong'
    },
    {
        firstName: 'Gabriela',
        middleName: 'Luz',
        lastName: 'Villanueva',
        familyId: 58,
        dateOfBirth: '1994-10-05',
        gender: 'Female',
        contactNumber: '09190123456',
        email: 'gabriela.villanueva@email.com',
        address: '852 C5 Road, Taguig'
    },
    {
        firstName: 'Diego',
        middleName: 'Raul',
        lastName: 'Torres',
        familyId: 29,
        dateOfBirth: '1989-02-28',
        gender: 'Male',
        contactNumber: '09101234567',
        email: 'diego.torres@email.com',
        address: '963 Marcos Highway, Marikina'
    },
    {
        firstName: 'Valentina',
        middleName: 'Grace',
        lastName: 'Laurel',
        familyId: 39,
        dateOfBirth: '1997-12-16',
        gender: 'Female',
        contactNumber: '09112345678',
        email: 'valentina.laurel@email.com',
        address: '159 Pioneer St, Mandaluyong'
    }
];

// Function to format date as dd-mm-yyyy for password
function formatPasswordFromDate(dateOfBirth) {
    const date = new Date(dateOfBirth);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

async function addTestPatients() {
    let connection;
    
    try {
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected');

        for (let i = 0; i < testPatients.length; i++) {
            const patient = testPatients[i];
            const password = formatPasswordFromDate(patient.dateOfBirth);
            
            console.log(`\n📝 Adding patient ${i + 1}/13: ${patient.firstName} ${patient.lastName}`);
            
            try {
                // Start transaction
                await connection.beginTransaction();
                
                // First, create user account
                const userInsertQuery = `
                    INSERT INTO users (username, email, password, contactNumber, role, firstName, lastName, middleName, createdAt, updatedAt) 
                    VALUES (?, ?, ?, ?, 'patient', ?, ?, ?, NOW(), NOW())
                `;
                
                const [userResult] = await connection.execute(userInsertQuery, [
                    patient.email, // username is email
                    patient.email,
                    password, // password is dd-mm-yyyy format
                    patient.contactNumber,
                    patient.firstName,
                    patient.lastName,
                    patient.middleName
                ]);
                
                const userId = userResult.insertId;
                console.log(`   ✅ User created with ID: ${userId}`);
                
                // Then, create patient record
                const patientInsertQuery = `
                    INSERT INTO patients (
                        userId, firstName, middleName, lastName, 
                        dateOfBirth, gender, contactNumber, email, 
                        address, familyId, createdAt, updatedAt
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;
                
                const [patientResult] = await connection.execute(patientInsertQuery, [
                    userId,
                    patient.firstName,
                    patient.middleName,
                    patient.lastName,
                    patient.dateOfBirth,
                    patient.gender,
                    patient.contactNumber,
                    patient.email,
                    patient.address,
                    patient.familyId
                ]);
                
                console.log(`   ✅ Patient created with ID: ${patientResult.insertId}`);
                console.log(`   🔑 Login: ${patient.email} / ${password}`);
                
                // Commit transaction
                await connection.commit();
                
            } catch (error) {
                // Rollback transaction on error
                await connection.rollback();
                console.error(`   ❌ Error adding ${patient.firstName} ${patient.lastName}:`, error.message);
            }
        }
        
        console.log('\n🎉 Test patient creation completed!');
        
        // Verify the additions
        console.log('\n📊 Verifying additions...');
        const [patients] = await connection.execute(`
            SELECT p.id, p.firstName, p.lastName, p.email, u.password, f.familyName
            FROM patients p 
            JOIN users u ON p.userId = u.id 
            JOIN families f ON p.familyId = f.id 
            ORDER BY p.id DESC 
            LIMIT 13
        `);
        
        console.log('\n✅ Recent patients added:');
        patients.forEach((patient, index) => {
            console.log(`${index + 1}. ${patient.firstName} ${patient.lastName} (${patient.familyName}) - ${patient.email} / ${patient.password}`);
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

// Run the script
addTestPatients();
