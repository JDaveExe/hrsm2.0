import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from the auth context (will be set by components using this)
    const token = window.__authToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('401 Unauthorized received in api.js interceptor');
      
      // PREVENT LOGOUT: Check if global logout is disabled (during refresh)
      if (window.__authLogout === null) {
        console.log('Logout disabled (likely during refresh), not triggering logout');
        return Promise.reject(error);
      }
      
      // Token expired or invalid - trigger logout
      if (window.__authLogout && typeof window.__authLogout === 'function') {
        console.log('Calling global logout function');
        window.__authLogout();
      } else {
        console.log('No global logout function available');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
