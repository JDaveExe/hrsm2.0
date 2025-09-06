import axios from './axiosConfig';

const getUsers = async () => {
  try {
    console.log('🔧 userService.getUsers() calling /api/users with temp-admin-token');
    const response = await axios.get('/api/users', {
      headers: {
        'x-auth-token': 'temp-admin-token',
        'Authorization': undefined, // Override any Bearer token from interceptor
      },
    });
    console.log('✅ userService.getUsers() success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ userService.getUsers() error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const createUser = async (userData) => {
  try {
    // Use the create-staff endpoint for admin/doctor users
    const response = await axios.post('/api/auth/create-staff', userData, {
      headers: {
        'x-auth-token': 'temp-admin-token',
        'Authorization': undefined,
      },
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
      headers: {
        'x-auth-token': 'temp-admin-token',
        'Authorization': undefined,
      },
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
      headers: {
        'x-auth-token': 'temp-admin-token',
        'Authorization': undefined,
      },
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
