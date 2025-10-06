import axios from '../services/axiosConfig';

// Function to get the authorization token from sessionStorage (consistent with AuthContext)
const getAuthToken = () => {
  try {
    // First try to get from window global (set by AuthContext)
    if (window.__authToken) {
      return window.__authToken;
    }
    
    // Fallback to sessionStorage (used by AuthContext)
    const authData = sessionStorage.getItem('authData');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed ? parsed.token : null;
    }
    
    // Final fallback to localStorage
    const localAuthData = JSON.parse(localStorage.getItem('auth') || 'null');
    return localAuthData ? localAuthData.token : null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Function to create the authorization header
const getAuthHeader = () => {
  const token = getAuthToken();
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
};

/**
 * Fetches all unsorted patients (those not assigned to a family).
 * @returns {Promise<Array>} A promise that resolves to an array of unsorted patients.
 */
const getUnsortedMembers = async () => {
  try {
    const response = await axios.get(`/api/admin/unsorted-members`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching unsorted members:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches all patients.
 * @returns {Promise<Array>} A promise that resolves to an array of all patients.
 */
const getAllPatients = async () => {
  try {
    const response = await axios.get(`/api/patients`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all patients:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches a specific patient by ID with detailed information.
 * @param {number} patientId - The ID of the patient to fetch.
 * @returns {Promise<Object>} A promise that resolves to the patient data.
 */
const getPatientById = async (patientId) => {
  try {
    const response = await axios.get(`/api/patients/${patientId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching patient by ID:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches all families.
 * @returns {Promise<Array>} A promise that resolves to an array of all families.
 */
const getAllFamilies = async () => {
  try {
    const response = await axios.get(`/api/families`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all families:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Creates a new family.
 * @param {Object} familyData - The family data to create.
 * @returns {Promise<Object>} A promise that resolves to the created family.
 */
const createFamily = async (familyData) => {
  try {
    const response = await axios.post(`/api/families`, familyData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating family:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Updates an existing family.
 * @param {number} familyId - The ID of the family to update.
 * @param {Object} familyData - The family data to update.
 * @returns {Promise<Object>} A promise that resolves to the updated family.
 */
const updateFamily = async (familyId, familyData) => {
  try {
    const response = await axios.put(`/api/families/${familyId}`, familyData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error updating family:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Assigns a patient to a family using family ID.
 * @param {number} patientId - The ID of the patient to assign.
 * @param {number} familyId - The ID of the family to assign to.
 * @returns {Promise<Object>} A promise that resolves to the assignment result.
 */
const assignPatientToFamily = async (patientId, familyId) => {
  try {
    const response = await axios.put(`/api/patients/${patientId}/assign-family`, 
      { familyId }, 
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error assigning patient to family:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Assigns an unsorted member to a family (new method following your old system).
 * @param {number} memberId - The ID of the member to assign.
 * @param {string} familyName - The name of the family to assign to.
 * @param {boolean} createNew - Whether to create a new family if it doesn't exist.
 * @returns {Promise<Object>} A promise that resolves to the assignment result.
 */
const assignUnsortedMemberToFamily = async (memberId, familyName, createNew = false) => {
  try {
    const response = await axios.patch(`/api/unsorted/${memberId}/assign-family`, 
      { familyName, createNew }, 
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error assigning unsorted member to family:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const autosortPatients = async () => {
  try {
    const response = await axios.post(`/api/admin/autosort-patients`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error auto-sorting patients:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Creates a new patient in the system
 * @param {Object} patientData - Patient information including name, date of birth, contact info, etc.
 * @returns {Promise<Object>} A promise that resolves to the created patient
 */
const createPatient = async (patientData) => {
  try {
    const response = await axios.post('/api/patients', patientData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating patient:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Updates an existing patient in the system
 * @param {number} patientId - The ID of the patient to update
 * @param {Object} patientData - Updated patient information
 * @returns {Promise<Object>} A promise that resolves to the updated patient
 */
const updatePatient = async (patientId, patientData) => {
  try {
    const response = await axios.put(`/api/patients/${patientId}`, patientData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error updating patient:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Creates a new admin or doctor user.
 * @param {Object} userData - The user data.
 * @returns {Promise<Object>} A promise that resolves to the created user.
 */
const createStaffUser = async (userData) => {
  try {
    const response = await axios.post(`/api/auth/create-staff`, userData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating staff user:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches all admin and doctor users.
 * @returns {Promise<Array>} A promise that resolves to an array of users.
 */
const getUserList = async () => {
  try {
    const response = await axios.get(`/api/admin/users`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user list:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Updates an existing user.
 * @param {number} userId - The user ID.
 * @param {Object} userData - The updated user data.
 * @returns {Promise<Object>} A promise that resolves to the updated user.
 */
const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`/api/admin/users/${userId}`, userData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Deletes a user account.
 * @param {number} userId - The user ID.
 * @returns {Promise<Object>} A promise that resolves to the delete confirmation.
 */
const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`/api/admin/users/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Resets a user's password.
 * @param {number} userId - The user ID.
 * @param {string} newPassword - The new password.
 * @returns {Promise<Object>} A promise that resolves to the reset confirmation.
 */
const resetUserPassword = async (userId, newPassword) => {
  try {
    const response = await axios.put(`/api/admin/users/${userId}/reset-password`, 
      { newPassword }, 
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error resetting user password:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Cleans up user data - removes all users except current admin.
 * @returns {Promise<Object>} A promise that resolves to the cleanup confirmation.
 */
const cleanupUserData = async () => {
  try {
    const response = await axios.delete(`/api/admin/users/cleanup`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error cleaning up user data:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const createFamiliesForPatients = async (patientIds) => {
  try {
    const response = await axios.post(`/api/patients/autosort/create-families`, 
      { patientIds }, 
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating families for patients:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Creates a vital signs record for a patient.
 * @param {Object} vitalSignsData - The vital signs data to save.
 * @returns {Promise<Object>} A promise that resolves to the created vital signs record.
 */
const createVitalSigns = async (vitalSignsData) => {
  try {
    const response = await axios.post(`/api/vital-signs`, vitalSignsData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating vital signs:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches vital signs history for a specific patient.
 * @param {number} patientId - The ID of the patient.
 * @returns {Promise<Array>} A promise that resolves to an array of vital signs records.
 */
const getVitalSignsHistory = async (patientId) => {
  try {
    const response = await axios.get(`/api/vital-signs/patient/${patientId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching vital signs history:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches today's checkups.
 * @returns {Promise<Array>} A promise that resolves to an array of today's checkups.
 */
const getTodaysCheckups = async () => {
  try {
    const response = await axios.get(`/api/checkups/today`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching today\'s checkups:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Records vital signs for a patient's checkup session.
 * @param {number} sessionId - The ID of the check-in session.
 * @param {Object} vitalSigns - The vital signs data to record.
 * @returns {Promise<Object>} A promise that resolves to the updated session.
 */
const recordVitalSigns = async (sessionId, vitalSigns) => {
  try {
    const response = await axios.post(`/api/checkups/${sessionId}/vital-signs`, vitalSigns, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error recording vital signs:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Notifies the doctor about a patient's checkup.
 * @param {number} sessionId - The ID of the check-in session.
 * @returns {Promise<Object>} A promise that resolves to the notification result.
 */
const notifyDoctor = async (sessionId) => {
  try {
    const response = await axios.post(`/api/checkups/${sessionId}/notify-doctor`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error notifying doctor:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Creates a new check-in session for a patient.
 * @param {Object} checkInData - The check-in data.
 * @returns {Promise<Object>} A promise that resolves to the created session.
 */
const createCheckInSession = async (checkInData) => {
  try {
    const response = await axios.post(`/api/checkups/check-in`, checkInData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating check-in session:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Updates the status of a checkup session.
 * @param {number} sessionId - The ID of the check-in session.
 * @param {string} status - The new status.
 * @param {string} notes - Optional notes.
 * @returns {Promise<Object>} A promise that resolves to the updated session.
 */
const updateCheckupStatus = async (sessionId, status, notes = '') => {
  try {
    const response = await axios.put(`/api/checkups/${sessionId}/status`, { status, notes }, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error updating checkup status:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Remove a patient from today's checkups
 * @param {string} patientId - The ID of the patient to remove
 * @returns {Promise<Object>} A promise that resolves to the response data
 */
const removeFromTodaysCheckups = async (patientId) => {
  try {
    const response = await axios.delete(`/api/checkups/today/${patientId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error removing patient from today\'s checkups:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches checkup statistics for today.
 * @returns {Promise<Object>} A promise that resolves to the statistics.
 */
const getTodaysCheckupStats = async () => {
  try {
    const response = await axios.get(`/api/checkups/stats/today`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching checkup stats:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Deletes a patient by ID
 * @param {number} patientId - The ID of the patient to delete
 * @returns {Promise<Object>} A promise that resolves to the deletion response
 */
const deletePatient = async (patientId) => {
  try {
    const response = await axios.delete(`/api/patients/${patientId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting patient:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches medicine usage analytics data for charts
 * @returns {Promise<Array>} A promise that resolves to medicine usage data
 */
const getMedicineUsage = async () => {
  try {
    const response = await axios.get(`/api/dashboard/medicine-usage`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching medicine usage:', error.response ? error.response.data : error.message);
    throw error;
  }
};

/**
 * Fetches vaccine usage analytics data for charts
 * @returns {Promise<Array>} A promise that resolves to vaccine usage data
 */
const getVaccineUsage = async () => {
  try {
    const response = await axios.get(`/api/dashboard/vaccine-usage`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching vaccine usage:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const adminService = {
  getUnsortedMembers,
  getAllPatients,
  getPatientById,
  getAllFamilies,
  createFamily,
  updateFamily,
  assignPatientToFamily,
  autosortPatients,
  createFamiliesForPatients,
  createPatient,
  updatePatient,
  deletePatient,
  createStaffUser,
  getUserList,
  updateUser,
  deleteUser,
  resetUserPassword,
  cleanupUserData,
  createVitalSigns,
  getVitalSignsHistory,
  getTodaysCheckups,
  recordVitalSigns,
  notifyDoctor,
  createCheckInSession,
  updateCheckupStatus,
  getTodaysCheckupStats,
  removeFromTodaysCheckups,
  getMedicineUsage,
  getVaccineUsage,
};

export default adminService;
