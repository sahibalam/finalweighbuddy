import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Set axios base URL to point to backend
const isDevelopment = process.env.NODE_ENV === 'development';
axios.defaults.baseURL = isDevelopment 
  ? 'http://localhost:5001' 
  : (process.env.REACT_APP_API_URL || '');

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'LOGIN_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'USER_LOADED':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token header
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Load user
  const loadUser = async (tokenOverride) => {
    const tokenToUse = tokenOverride || state.token || localStorage.getItem('token');
    if (tokenToUse) {
      setAuthToken(tokenToUse);
      try {
        const res = await axios.get('/api/auth/me');
        dispatch({
          type: 'USER_LOADED',
          payload: res.data.user
        });
      } catch (error) {
        // If we have a token but /me fails transiently (e.g. during OAuth transitions),
        // do not immediately wipe auth state; keep token and allow subsequent retries.
        const message = error.response?.data?.message || 'Authentication failed';
        const status = error.response?.status;
        if (status === 401) {
          dispatch({
            type: 'AUTH_ERROR',
            payload: message
          });
        } else {
          dispatch({
            type: 'AUTH_ERROR',
            payload: message
          });
        }
      }
    } else {
      dispatch({ type: 'AUTH_ERROR', payload: null });
    }
  };

  // Register user
  const register = async (formData) => {
    try {
      const res = await axios.post('/api/auth/register', formData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
      setAuthToken(res.data.token);
      return { success: true };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAIL',
        payload: error.response?.data?.message || 'Registration failed'
      });
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  // Login user
  const login = async (formData) => {
    try {
      const res = await axios.post('/api/auth/login', formData);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: res.data
      });
      setAuthToken(res.data.token);
      return { success: true, user: res.data.user };
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAIL',
        payload: error.response?.data?.message || 'Login failed'
      });
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  // Logout user
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    setAuthToken(null);
  };

  // Update user profile
  const updateProfile = async (formData) => {
    try {
      const res = await axios.put('/api/auth/profile', formData);
      dispatch({
        type: 'UPDATE_USER',
        payload: res.data.user
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Update failed' };
    }
  };

  // Change password
  const changePassword = async (formData) => {
    try {
      await axios.put('/api/auth/password', formData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Password change failed' };
    }
  };

  // Load user on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !state.token) {
      // Ensure reducer state catches up if token was set outside of AuthContext (OAuth flows).
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user: state.user }
      });
    }
    loadUser(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set auth token on mount
  useEffect(() => {
    if (state.token) {
      setAuthToken(state.token);
    }
  }, [state.token]);

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    loadUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  try {
    const context = useContext(AuthContext);
    if (!context) {
      console.error('🔴 useAuth Error: Context not found. This means AuthProvider is not wrapping the component properly.');
      console.error('🔴 Check if your component is wrapped in <AuthProvider>');
      
      // Return a fallback context instead of throwing
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: 'AuthContext not available',
        register: () => Promise.resolve({ success: false, error: 'AuthContext not available' }),
        login: () => Promise.resolve({ success: false, error: 'AuthContext not available' }),
        logout: () => {},
        updateProfile: () => Promise.resolve({ success: false, error: 'AuthContext not available' }),
        changePassword: () => Promise.resolve({ success: false, error: 'AuthContext not available' }),
        loadUser: () => Promise.resolve()
      };
    }
    return context;
  } catch (error) {
    console.error('🔴 useAuth Error:', error);
    console.error('🔴 This means there is a problem with the AuthContext setup');
    
    // Return a fallback context
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: 'AuthContext error: ' + error.message,
      register: () => Promise.resolve({ success: false, error: 'AuthContext error' }),
      login: () => Promise.resolve({ success: false, error: 'AuthContext error' }),
      logout: () => {},
      updateProfile: () => Promise.resolve({ success: false, error: 'AuthContext error' }),
      changePassword: () => Promise.resolve({ success: false, error: 'AuthContext error' }),
      loadUser: () => Promise.resolve()
    };
  }
}; 