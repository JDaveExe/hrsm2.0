// Create getUserPatientId mapping function
const mysql = require('mysql2/promise');

async function createUserPatientMapping() {
    console.log('🔍 CREATING USER → PATIENT ID MAPPING');
    console.log('====================================\n');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'hrsm2'
        });
        
        // Get all user → patient mappings
        const [mappings] = await connection.execute(`
            SELECT 
                u.id as userId,
                u.email,
                u.firstName,
                u.lastName,
                p.id as patientId
            FROM users u
            LEFT JOIN patients p ON u.id = p.userId
            WHERE u.role = 'patient'
            ORDER BY u.id
        `);
        
        console.log('📊 USER → PATIENT ID MAPPINGS:');
        console.log('------------------------------');
        
        const validMappings = {};
        const invalidMappings = [];
        
        mappings.forEach(mapping => {
            if (mapping.patientId) {
                validMappings[mapping.userId] = mapping.patientId;
                console.log(`✅ User ${mapping.userId} (${mapping.email}) → Patient ${mapping.patientId}`);
            } else {
                invalidMappings.push(mapping);
                console.log(`❌ User ${mapping.userId} (${mapping.email}) → NO PATIENT RECORD!`);
            }
        });
        
        console.log(`\n📈 STATISTICS:`);
        console.log(`   Valid mappings: ${Object.keys(validMappings).length}`);
        console.log(`   Invalid mappings: ${invalidMappings.length}`);
        
        // Generate JavaScript mapping function
        console.log('\n💻 FRONTEND MAPPING FUNCTION:');
        console.log('=============================');
        
        const mappingCode = `
// User ID to Patient ID mapping
const USER_PATIENT_MAPPING = ${JSON.stringify(validMappings, null, 4)};

/**
 * Get patient ID from user ID
 * @param {number|string} userId - The user ID
 * @returns {number|null} - The corresponding patient ID or null if not found
 */
function getUserPatientId(userId) {
    const patientId = USER_PATIENT_MAPPING[parseInt(userId)];
    if (!patientId) {
        console.warn(\`⚠️ No patient ID found for user ID: \${userId}\`);
        return null;
    }
    return patientId;
}

/**
 * Get patient ID for currently logged in user
 * @param {object} user - User object from authentication
 * @returns {number|null} - Patient ID or null
 */
function getCurrentUserPatientId(user) {
    if (!user?.id) {
        console.warn('⚠️ No user ID available');
        return null;
    }
    return getUserPatientId(user.id);
}

// Usage examples:
// const patientId = getUserPatientId(10016); // Returns 113
// const patientId = getCurrentUserPatientId(user); // Returns patient ID for current user
        `;
        
        console.log(mappingCode);
        
        // Test the key mappings
        console.log('\n🧪 TESTING KEY MAPPINGS:');
        console.log('========================');
        
        const testUserIds = [10015, 10016, 10048]; // Valentina, Kaleia, Derick
        testUserIds.forEach(userId => {
            const patientId = validMappings[userId];
            const user = mappings.find(m => m.userId === userId);
            if (patientId && user) {
                console.log(`✅ User ${userId} (${user.firstName}) → Patient ${patientId}`);
            } else {
                console.log(`❌ User ${userId} → No mapping found`);
            }
        });
        
        return validMappings;
        
    } catch (error) {
        console.error('❌ Mapping creation failed:', error.message);
        return null;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Create frontend utility file
async function createFrontendUtility() {
    const mappings = await createUserPatientMapping();
    
    if (mappings) {
        const fs = require('fs');
        const utilityCode = `// Patient ID Utility Functions
// Auto-generated mapping from database

const USER_PATIENT_MAPPING = ${JSON.stringify(mappings, null, 2)};

/**
 * Get patient ID from user ID
 * @param {number|string} userId - The user ID
 * @returns {number|null} - The corresponding patient ID or null if not found
 */
export function getUserPatientId(userId) {
    const patientId = USER_PATIENT_MAPPING[parseInt(userId)];
    if (!patientId) {
        console.warn(\`⚠️ No patient ID found for user ID: \${userId}\`);
        return null;
    }
    return patientId;
}

/**
 * Get patient ID for currently logged in user
 * @param {object} user - User object from authentication
 * @returns {number|null} - Patient ID or null
 */
export function getCurrentUserPatientId(user) {
    if (!user?.id) {
        console.warn('⚠️ No user ID available');
        return null;
    }
    return getUserPatientId(user.id);
}

/**
 * Get the correct patient ID for API calls
 * Falls back to localStorage if user object not available
 * @param {object} user - User object (optional)
 * @returns {number|null} - Patient ID for API calls
 */
export function getPatientIdForAPI(user = null) {
    // Try to get from user object first
    if (user?.id) {
        const patientId = getUserPatientId(user.id);
        if (patientId) return patientId;
    }
    
    // Fallback to localStorage (with mapping)
    const storedUserId = localStorage.getItem('patientId') || localStorage.getItem('userId');
    if (storedUserId) {
        const patientId = getUserPatientId(storedUserId);
        if (patientId) return patientId;
    }
    
    console.error('❌ Could not determine patient ID for API call');
    return null;
}

// Export the mapping for debugging
export { USER_PATIENT_MAPPING };
`;
        
        fs.writeFileSync('src/utils/patientIdMapping.js', utilityCode);
        console.log('\n📁 Created: src/utils/patientIdMapping.js');
        console.log('✅ Frontend utility file ready!');
    }
}

createFrontendUtility();