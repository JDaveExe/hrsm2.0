require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hrsm'
};

// Test functions for height conversion
function convertHeight(value, fromUnit, toUnit) {
    if (!value) return '';
    
    if (fromUnit === 'cm' && toUnit === 'ft') {
        // Convert cm to feet and inches format (e.g., "5'8"")
        const totalInches = parseFloat(value) / 2.54;
        const feet = Math.floor(totalInches / 12);
        const inches = (totalInches % 12).toFixed(1);
        return `${feet}'${inches}"`;
    } else if (fromUnit === 'ft' && toUnit === 'cm') {
        // Handle format like "5'8"" or just "5.67"
        let totalInches;
        if (value.includes("'")) {
            const parts = value.split("'");
            const feet = parseInt(parts[0]);
            const inches = parseFloat(parts[1].replace('"', ''));
            totalInches = feet * 12 + inches;
        } else {
            totalInches = parseFloat(value) * 12;
        }
        return (totalInches * 2.54).toFixed(1);
    }
    return value;
}

async function testVitalSignsImprovements() {
    let connection;
    
    try {
        console.log('🔗 Connecting to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connected');
        
        // Test height conversion functions
        console.log('\n🧮 Testing Height Conversions:');
        console.log('=====================================');
        
        // Test cm to ft conversion
        const testHeights = ['170', '175', '180', '165', '160'];
        console.log('CM to FT conversions:');
        testHeights.forEach(height => {
            const converted = convertHeight(height, 'cm', 'ft');
            console.log(`${height}cm = ${converted}`);
        });
        
        // Test ft to cm conversion
        console.log('\nFT to CM conversions:');
        const testFeetHeights = ["5'6\"", "5'8\"", "5'10\"", "6'0\"", "5'4\""];
        testFeetHeights.forEach(height => {
            const converted = convertHeight(height, 'ft', 'cm');
            console.log(`${height} = ${converted}cm`);
        });
        
        // Test loading previous vital signs for a patient
        console.log('\n📊 Testing Previous Vital Signs Loading:');
        console.log('==========================================');
        
        // Get a test patient
        const [patients] = await connection.execute(`
            SELECT p.id, p.firstName, p.lastName 
            FROM patients p 
            WHERE EXISTS (SELECT 1 FROM vital_signs vs WHERE vs.patientId = p.id)
            LIMIT 1
        `);
        
        if (patients.length > 0) {
            const patient = patients[0];
            console.log(`Testing with patient: ${patient.firstName} ${patient.lastName} (ID: ${patient.id})`);
            
            // Get their vital signs history
            const [vitalSigns] = await connection.execute(`
                SELECT * FROM vital_signs 
                WHERE patientId = ? 
                ORDER BY recordedAt DESC 
                LIMIT 3
            `, [patient.id]);
            
            if (vitalSigns.length > 0) {
                console.log(`Found ${vitalSigns.length} vital signs records:`);
                vitalSigns.forEach((vital, index) => {
                    console.log(`${index + 1}. Date: ${vital.recordedAt}`);
                    console.log(`   Height: ${vital.height || 'N/A'} cm`);
                    console.log(`   Weight: ${vital.weight || 'N/A'} kg`);
                    console.log(`   BP: ${vital.systolicBP || 'N/A'}/${vital.diastolicBP || 'N/A'} mmHg`);
                    console.log(`   Temperature: ${vital.temperature || 'N/A'}°C`);
                    console.log('   ---');
                });
                
                const lastVital = vitalSigns[0];
                console.log('\n📝 Last vital signs for pre-filling:');
                console.log(`Height: ${lastVital.height || 'No previous height'} cm`);
                console.log(`Weight: ${lastVital.weight || 'No previous weight'} kg`);
                
                if (lastVital.height) {
                    const heightInFeet = convertHeight(lastVital.height.toString(), 'cm', 'ft');
                    console.log(`Height in feet: ${heightInFeet}`);
                }
            } else {
                console.log('No vital signs found for this patient');
            }
        } else {
            console.log('No patients with vital signs found in database');
        }
        
        // Test getting all test patients we added
        console.log('\n🧪 All Patients Available for Testing:');
        console.log('=====================================');
        
        const [allPatients] = await connection.execute(`
            SELECT p.id, p.firstName, p.lastName, p.email, 
                   COUNT(vs.id) as vitalSignsCount
            FROM patients p 
            LEFT JOIN vital_signs vs ON p.id = vs.patientId
            GROUP BY p.id, p.firstName, p.lastName, p.email
            ORDER BY p.id DESC
            LIMIT 15
        `);
        
        console.log(`Found ${allPatients.length} patients total:`);
        allPatients.forEach(patient => {
            const isTestPatient = patient.email && patient.email.includes('.email.com');
            const marker = isTestPatient ? '🧪' : '👤';
            console.log(`${marker} ${patient.firstName} ${patient.lastName} (${patient.email || 'No email'}) - ${patient.vitalSignsCount} vital signs records`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Database connection closed');
        }
    }
}

// Run the test
testVitalSignsImprovements();
