import axios from '../services/axiosConfig';

// Function to get the authorization token from localStorage
const getAuthToken = () => {
  const authData = JSON.parse(localStorage.getItem('auth'));
  return authData ? authData.token : null;
};

// Function to create the authorization header
const getAuthHeader = () => {
  const token = getAuthToken();
  if (token) {
    return { 'x-auth-token': token };
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

const adminService = {
  getUnsortedMembers,
  getAllPatients,
  getPatientById,
  getAllFamilies,
  createFamily,
  assignPatientToFamily,
  autosortPatients,
  createFamiliesForPatients,
  createPatient,
  createStaffUser,
};

export default adminService;
