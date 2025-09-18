import React, { createContext, useState, useContext, useMemo, useEffect, useRef, useCallback } from 'react';

const AuthContext = createContext(null);

// Configuration constants
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before logout
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

export const AuthProvider = ({ children }) => {
  // Initialize auth data from sessionStorage if available
  const [authData, setAuthData] = useState(() => {
    try {
      const storedAuth = sessionStorage.getItem('authData');
      const storedExpiry = sessionStorage.getItem('authExpiry');
      
      if (storedAuth && storedExpiry) {
        const expiryTime = parseInt(storedExpiry);
        const now = Date.now();
        
        // Check if the session hasn't expired
        if (now < expiryTime) {
          return JSON.parse(storedAuth);
        } else {
          // Session expired, clear storage
          sessionStorage.removeItem('authData');
          sessionStorage.removeItem('authExpiry');
        }
      }
    } catch (error) {
      console.error('Error loading auth from sessionStorage:', error);
      sessionStorage.removeItem('authData');
      sessionStorage.removeItem('authExpiry');
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(false); // Loading state for auth operations
  const [showWarning, setShowWarning] = useState(false); // Show inactivity warning
  const [warningTimeLeft, setWarningTimeLeft] = useState(0); // Time left in warning
  
  // Refs for timers
  const inactivityTimer = useRef(null);
  const warningTimer = useRef(null);
  const warningCountdown = useRef(null);
  const lastActivity = useRef(Date.now());

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
    if (warningTimer.current) {
      clearTimeout(warningTimer.current);
      warningTimer.current = null;
    }
    if (warningCountdown.current) {
      clearInterval(warningCountdown.current);
      warningCountdown.current = null;
    }
  }, []);

  // Reset activity timers - DISABLED FOR QUICK WORKAROUND
  const resetActivityTimer = useCallback(() => {
    if (!authData?.token) return;

    lastActivity.current = Date.now();
    setShowWarning(false);
    clearTimers();

    // Update sessionStorage expiry time
    try {
      const newExpiryTime = Date.now() + INACTIVITY_TIMEOUT;
      sessionStorage.setItem('authExpiry', newExpiryTime.toString());
    } catch (error) {
      console.error('Error updating sessionStorage expiry:', error);
    }

    // DISABLED: Set warning timer (causes rapid re-renders)
    // warningTimer.current = setTimeout(() => {
    //   setShowWarning(true);
    //   setWarningTimeLeft(WARNING_TIME / 1000);
    //   
    //   // Start countdown
    //   warningCountdown.current = setInterval(() => {
    //     setWarningTimeLeft(prev => {
    //       if (prev <= 1) {
    //         logout();
    //         return 0;
    //       }
    //       return prev - 1;
    //     });
    //   }, 1000);
    // }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // DISABLED: Set logout timer (too aggressive)
    // inactivityTimer.current = setTimeout(() => {
    //   logout();
    // }, INACTIVITY_TIMEOUT);
  }, [authData?.token]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    if (!authData?.token) return;
    
    const now = Date.now();
    // Only reset timer if it's been at least 30 seconds since last activity
    // This prevents excessive timer resets
    if (now - lastActivity.current > 30000) {
      resetActivityTimer();
    }
  }, [authData?.token, resetActivityTimer]);

  // Extend session when user clicks "Stay Logged In"
  const extendSession = useCallback(() => {
    setShowWarning(false);
    resetActivityTimer();
  }, [resetActivityTimer]);

  // The login function now accepts user data and stores it in state.
  const login = useCallback((data) => {
    console.log('🔐 AuthContext login called with:', data);
    console.log('🔐 Data token:', data?.token);
    console.log('🔐 Data user:', data?.user);
    
    setAuthData(data);
    setIsLoading(false);
    setShowWarning(false);
    
    // Store in sessionStorage with expiry time
    try {
      const expiryTime = Date.now() + INACTIVITY_TIMEOUT;
      sessionStorage.setItem('authData', JSON.stringify(data));
      sessionStorage.setItem('authExpiry', expiryTime.toString());
      console.log('🔐 Stored in sessionStorage:', data);
    } catch (error) {
      console.error('Error saving auth to sessionStorage:', error);
    }
    
    // Set up global auth token for API interceptor
    window.__authToken = data?.token;
    console.log('🔐 Set global token:', data?.token);
  }, []);

  // The logout function clears the user data from state and redirects to homepage.
  const logout = useCallback(() => {
    // PREVENT LOOP: Only logout if there is a user session
    if (!authData) {
      return;
    }

    setAuthData(null);
    setIsLoading(false);
    setShowWarning(false);
    clearTimers();
    
    // Clear sessionStorage
    try {
      sessionStorage.removeItem('authData');
      sessionStorage.removeItem('authExpiry');
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
    
    // Clear global auth token
    window.__authToken = null;
    
    console.log('User logged out - redirecting to homepage');
    
    // CONSISTENT REDIRECT: Always redirect to homepage after logout
    // This ensures consistent behavior across all dashboards
    setTimeout(() => {
      window.location.href = '/';
    }, 100); // Small delay to ensure state updates complete
  }, [authData, clearTimers]);

  // Set up activity listeners
  useEffect(() => {
    if (!authData?.token) {
      clearTimers();
      return;
    }

    // Set up global logout function for API interceptor
    window.__authLogout = logout;

    // Add activity listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start initial timer
    resetActivityTimer();

    // Cleanup
    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimers();
    };
  }, [authData?.token, handleActivity, resetActivityTimer, logout, clearTimers]);

  // Initialize global auth token on mount/auth change
  useEffect(() => {
    if (authData?.token) {
      window.__authToken = authData.token;
      window.__authLogout = logout;
    } else {
      window.__authToken = null;
      window.__authLogout = null;
    }
  }, [authData?.token, logout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      window.__authToken = null;
      window.__authLogout = null;
    };
  }, [clearTimers]);

  // Memoize the context value to prevent unnecessary re-renders of consumers.
  const value = useMemo(() => ({
    user: authData?.user, // The user object from state
    token: authData?.token, // Convenience access to token
    authData, // Provide full authData for debugging
    isLoading, // Loading state
    showWarning, // Inactivity warning state
    warningTimeLeft, // Time left before auto-logout
    login,
    logout,
    extendSession, // Function to extend session
    setIsLoading, // Expose setIsLoading for auth operations
    // Fix: Ensure isAuthenticated matches authData existence - require both token AND user
    isAuthenticated: !!(authData?.token && authData?.user),
  }), [authData, isLoading, showWarning, warningTimeLeft, login, logout, extendSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to easily access the auth context.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
