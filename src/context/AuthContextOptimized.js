import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';

// Create the context
const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  UPDATE_USER: 'UPDATE_USER',
};

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Memoized actions to prevent unnecessary re-renders
  const actions = useMemo(() => ({
    login: async (credentials) => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
        
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });

        if (!response.ok) {
          throw new Error('Login failed');
        }

        const data = await response.json();
        
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user: data.user, token: data.token },
        });
        
        return data;
      } catch (error) {
        dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: error.message });
        throw error;
      }
    },

    logout: useCallback(() => {
      localStorage.removeItem('token');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }, []),

    updateUser: useCallback((updates) => {
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updates });
    }, []),

    clearError: useCallback(() => {
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    }, []),
  }), []);

  // Memoized context value
  const contextValue = useMemo(() => ({
    ...state,
    ...actions,
  }), [state, actions]);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { user: data.user, token },
            });
          } else {
            localStorage.removeItem('token');
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
