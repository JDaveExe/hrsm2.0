// Patient ID Utility Functions
// Auto-generated mapping from database

const USER_PATIENT_MAPPING = {
  "47": 40,
  "48": 41,
  "10003": 100,
  "10004": 101,
  "10005": 102,
  "10006": 103,
  "10007": 104,
  "10008": 105,
  "10009": 106,
  "10010": 107,
  "10011": 108,
  "10013": 110,
  "10014": 111,
  "10015": 112,
  "10016": 113,
  "10018": 114,
  "10019": 115,
  "10030": 116,
  "10031": 117,
  "10032": 118,
  "10033": 119,
  "10034": 120,
  "10035": 121,
  "10036": 122,
  "10037": 123,
  "10038": 124,
  "10039": 125,
  "10040": 126,
  "10041": 127,
  "10042": 128,
  "10043": 129,
  "10044": 130,
  "10045": 131,
  "10046": 132,
  "10047": 133,
  "10048": 134
};

/**
 * Get patient ID from user ID
 * @param {number|string} userId - The user ID
 * @returns {number|null} - The corresponding patient ID or null if not found
 */
export function getUserPatientId(userId) {
    const patientId = USER_PATIENT_MAPPING[parseInt(userId)];
    if (!patientId) {
        console.warn(`⚠️ No patient ID found for user ID: ${userId}`);
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
