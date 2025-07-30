import axios from 'axios';

const API_URL = '/api/auth/';

const login = async (emailOrPhone, password) => {
  const response = await axios.post(API_URL + 'login', {
    login: emailOrPhone,
    password,
  });

  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }

  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
};

const authService = {
  login,
  logout,
};

export default authService;
