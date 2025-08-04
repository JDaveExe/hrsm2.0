import axios from './axiosConfig';

// Function to get the authorization token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  return token;
};

// Function to create the authorization header
const getAuthHeader = () => {
  const token = getAuthToken();
  if (token) {
    return { 'x-auth-token': token };
  }
  return {};
};

const getUsers = async () => {
  try {
    const response = await axios.get('/api/users', {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const createUser = async (userData) => {
  try {
    // Use the create-staff endpoint for admin/doctor users
    const response = await axios.post('/api/auth/create-staff', userData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`/api/users/${userId}`, userData, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error.response ? error.response.data : error.message);
    throw error;
  }
};
  
  const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`/api/users/${userId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const userService = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};

export default userService;
