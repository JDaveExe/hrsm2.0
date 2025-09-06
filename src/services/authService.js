import axios from 'axios'; // Use direct axios instead of configured instance

const API_URL = '/api/auth/';

const login = async (emailOrPhone, password) => {
  const response = await axios.post(API_URL + 'login', {
    login: emailOrPhone,
    password,
  });

  // Don't store in localStorage here - let the AuthContext handle it
  return response.data;
};

const register = async (userData) => {
  // Use direct axios call to avoid auth interceptors
  const response = await axios.post(
    (process.env.REACT_APP_API_URL || 'http://localhost:5000') + API_URL + 'register', 
    userData,
    {
      headers: {
        'Content-Type': 'application/json',
        // No Authorization header
      }
    }
  );
  return response.data;
};

const logout = () => {
  // Don't remove from localStorage here - let the AuthContext handle it
};

const authService = {
  login,
  register,
  logout,
};

export default authService;
