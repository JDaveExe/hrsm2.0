import axios from './axiosConfig';

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
 * Fetches all patients from the backend
 * @returns {Promise<Array>} A promise that resolves to an array of all patients
 */
const getAllPatients = async () => {
  try {
    const response = await axios.get('/api/patients', {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching all patients:', error.response ? error.response.data : error.message);
    // Return empty array if there's an error (for graceful fallback)
    return [];
  }
};

/**
 * Fetches unsorted patients (those not assigned to a family)
 * @returns {Promise<Array>} A promise that resolves to an array of unsorted patients
 */
const getUnsortedPatients = async () => {
  try {
    const response = await axios.get('/api/patients/unsorted', {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching unsorted patients:', error.response ? error.response.data : error.message);
    // Return empty array if there's an error (for graceful fallback)
    return [];
  }
};

/**
 * Creates a new patient
 * @param {Object} patientData - The patient data to create
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
 * Gets a specific patient by ID
 * @param {number} patientId - The ID of the patient to fetch
 * @returns {Promise<Object>} A promise that resolves to the patient data
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

export default {
  getAllPatients,
  getUnsortedPatients,
  createPatient,
  getPatientById
};
