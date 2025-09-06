/**
 * Secure Authentication Utils
 * Implements secure token storage and management
 */

// Secure storage utilities
export const SecureStorage = {
  
  // Set secure cookie (httpOnly when possible)
  setSecureCookie: (name, value, options = {}) => {
    const defaults = {
      maxAge: 60 * 60 * 24, // 24 hours
      sameSite: 'strict',
      secure: window.location.protocol === 'https:',
      path: '/'
    };
    
    const cookieOptions = { ...defaults, ...options };
    let cookieString = `${name}=${value}`;
    
    Object.entries(cookieOptions).forEach(([key, val]) => {
      if (val === true) {
        cookieString += `; ${key}`;
      } else if (val !== false) {
        cookieString += `; ${key}=${val}`;
      }
    });
    
    document.cookie = cookieString;
  },

  // Get cookie value
  getCookie: (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  },

  // Remove cookie
  removeCookie: (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  },

  // Secure session storage for non-sensitive data
  setSessionItem: (key, value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to set session storage:', error);
    }
  },

  getSessionItem: (key) => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to get session storage:', error);
      return null;
    }
  },

  removeSessionItem: (key) => {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove session storage:', error);
    }
  },

  // Clear all auth-related storage
  clearAuthStorage: () => {
    // Remove cookies
    SecureStorage.removeCookie('authToken');
    SecureStorage.removeCookie('refreshToken');
    SecureStorage.removeCookie('sessionId');
    
    // Clear session storage
    SecureStorage.removeSessionItem('user');
    SecureStorage.removeSessionItem('permissions');
    
    // Clear sensitive localStorage items (but keep app preferences)
    const authKeys = ['user', 'token', 'authToken', 'refreshToken'];
    authKeys.forEach(key => localStorage.removeItem(key));
  }
};

// Token utilities
export const TokenUtils = {
  
  // Decode JWT payload (client-side validation only)
  decodeToken: (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token) => {
    const decoded = TokenUtils.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  },

  // Get token expiration time
  getTokenExpiration: (token) => {
    const decoded = TokenUtils.decodeToken(token);
    return decoded?.exp ? new Date(decoded.exp * 1000) : null;
  }
};

// Security headers for API requests
export const SecurityHeaders = {
  
  // Get secure headers for API requests
  getSecureHeaders: (token = null) => {
    const headers = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache',
    };

    // Add CSRF protection if available
    const csrfToken = SecureStorage.getCookie('csrfToken');
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    // Add auth token if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }
};

// Auto-logout utilities
export const AutoLogout = {
  
  // Set up automatic logout on token expiration
  setupAutoLogout: (token, logoutCallback) => {
    if (!token) return null;

    const expiration = TokenUtils.getTokenExpiration(token);
    if (!expiration) return null;

    const timeUntilExpiration = expiration.getTime() - Date.now();
    
    if (timeUntilExpiration <= 0) {
      logoutCallback();
      return null;
    }

    // Logout 1 minute before expiration
    const logoutTime = timeUntilExpiration - (60 * 1000);
    
    return setTimeout(() => {
      console.warn('Session expired, logging out...');
      logoutCallback();
    }, Math.max(logoutTime, 0));
  },

  // Activity-based logout
  setupInactivityLogout: (timeoutMinutes = 30, logoutCallback) => {
    let inactivityTimer;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        console.warn('User inactive, logging out...');
        logoutCallback();
      }, timeoutMinutes * 60 * 1000);
    };

    // Track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer(); // Start the timer

    // Return cleanup function
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
    };
  }
};

export default {
  SecureStorage,
  TokenUtils,
  SecurityHeaders,
  AutoLogout
};
