import axios from './axiosConfig';

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
  const response = await axios.post(API_URL + 'register', userData);
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
