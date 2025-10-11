import axios from 'axios';

// Create axios instance with configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    // Get token from global variable first (set by AuthContext)
    let token = window.__authToken;
    
    // Fallback to storage options
    if (!token) {
      token = sessionStorage.getItem('token') ||
              localStorage.getItem('token') ||
              document.cookie.split('authToken=')[1]?.split(';')[0];
    }
    
    // Try to get from authData in sessionStorage
    if (!token) {
      try {
        const authData = sessionStorage.getItem('authData');
        if (authData) {
          const parsed = JSON.parse(authData);
          token = parsed?.token;
        }
      } catch (error) {
        console.error('Error parsing authData:', error);
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF protection
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('401 Unauthorized received in axiosConfig');
      
      // PREVENT LOGOUT: Check if global logout is disabled (during refresh)
      if (window.__authLogout === null) {
        console.log('Logout disabled (likely during refresh), not triggering logout');
        return Promise.reject(error);
      }
      
      // Use global logout function if available (from AuthContext)
      if (window.__authLogout && typeof window.__authLogout === 'function') {
        console.log('401 received, triggering logout via AuthContext');
        window.__authLogout();
      } else {
        // Fallback: Clear auth data and redirect to login
        console.log('401 received, no global logout available, clearing storage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('authData');
        sessionStorage.removeItem('authExpiry');
        window.location.href = '/login';
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      error.message = 'Network connection error. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);

export default api;
