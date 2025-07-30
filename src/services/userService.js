const API_URL = '/api/users';

// Helper function to get the auth token from localStorage
const getAuthToken = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user.token : null;
};

// Helper function to create authorization headers
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const getUsers = async () => {
  const response = await fetch(API_URL, {
    headers: getAuthHeaders()
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized: Please log in again.');
    }
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Failed to fetch users');
  }
  return response.json();
};

const createUser = async (userData) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(userData)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Failed to create user');
  }
  return response.json();
};

const updateUser = async (userId, userData) => {
    const response = await fetch(`${API_URL}/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || 'Failed to update user');
    }
    return response.json();
  };
  
  const deleteUser = async (userId) => {
    const response = await fetch(`${API_URL}/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || 'Failed to delete user');
    }
    return response.json();
  };

const userService = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};

export default userService;
