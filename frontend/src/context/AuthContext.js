import React, { createContext, useState, useContext, useEffect } from 'react';

// Centralized configuration
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000',
    timeout: 10000
  },
  production: {
    baseURL: 'https://muslimdiarybackend.onrender.com',
    timeout: 15000
  }
};

const getApiConfig = () => {
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
  return isDevelopment ? API_CONFIG.development : API_CONFIG.production;
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking'); // checking, online, offline

  const apiConfig = getApiConfig();

  // Enhanced backend status check with retry logic
  const checkBackendStatus = async (retryCount = 0) => {
    try {
      console.log('🔍 Checking backend status...');
      
      const response = await fetch(`${apiConfig.baseURL}/api/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        setBackendStatus('online');
        console.log('✅ Backend is online');
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.warn('❌ Backend status check failed:', error.message);
      
      // Retry logic for backend warming up
      if (retryCount < 2) {
        console.log(`🔄 Retrying backend check (${retryCount + 1}/3)...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return checkBackendStatus(retryCount + 1);
      }
      
      setBackendStatus('offline');
      return false;
    }
  };

  // Check backend status on startup
  useEffect(() => {
    checkBackendStatus();
  }, []);

  // Load user from localStorage on component mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('muslimDiary_user');
        const token = localStorage.getItem('muslimDiary_token');
        
        if (storedUser && token) {
          const userData = JSON.parse(storedUser);
          // Validate stored user data structure
          if (userData && userData.id && userData.email) {
            setUser(userData);
            console.log('👤 User session restored from storage');
          } else {
            console.warn('Invalid user data in storage, clearing...');
            clearStoredAuth();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearStoredAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Clear stored authentication data
  const clearStoredAuth = () => {
    localStorage.removeItem('muslimDiary_user');
    localStorage.removeItem('muslimDiary_token');
    localStorage.removeItem('lastKnownZone');
  };

  // Enhanced API request with proper error handling
  const makeApiRequest = async (endpoint, options = {}, retryCount = 0) => {
    const url = `${apiConfig.baseURL}${endpoint}`;
    
    try {
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(apiConfig.timeout)
      };

      const response = await fetch(url, { ...defaultOptions, ...options });

      // Handle backend warming up (Render specific)
      if (response.status === 524 || response.status === 503) {
        if (retryCount < 2) {
          console.log(`🔄 Backend warming up, retry ${retryCount + 1}/3...`);
          await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)));
          return makeApiRequest(endpoint, options, retryCount + 1);
        } else {
          throw new Error('Backend is starting up. Please try again in a moment.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `Request failed with status ${response.status}` 
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      // Handle timeout and network errors with retry
      if ((error.name === 'TimeoutError' || error.message.includes('Failed to fetch')) && retryCount < 2) {
        console.log(`🔄 Network issue, retry ${retryCount + 1}/3...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return makeApiRequest(endpoint, options, retryCount + 1);
      }
      
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login...');
      
      const data = await makeApiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (data.success) {
        console.log('✅ Login successful');
        
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          zone: data.user.zone || 'WLY01'
        };
        
        // Update state and storage
        setUser(userData);
        localStorage.setItem('muslimDiary_user', JSON.stringify(userData));
        localStorage.setItem('muslimDiary_token', data.token);
        setBackendStatus('online');
        
        return { success: true, user: userData };
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Update backend status based on error type
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        setBackendStatus('offline');
        return { 
          success: false, 
          error: 'Service temporarily unavailable. Please check your connection.' 
        };
      }
      
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log('📝 Attempting registration...');
      
      const data = await makeApiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password })
      });

      if (data.success) {
        console.log('✅ Registration successful');
        
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          zone: data.user.zone || 'WLY01'
        };
        
        // Update state and storage
        setUser(userData);
        localStorage.setItem('muslimDiary_user', JSON.stringify(userData));
        localStorage.setItem('muslimDiary_token', data.token);
        setBackendStatus('online');
        
        return { success: true, user: userData };
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Update backend status based on error type
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        setBackendStatus('offline');
        return { 
          success: false, 
          error: 'Service temporarily unavailable. Please check your connection.' 
        };
      }
      
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    console.log('👋 Logging out user');
    setUser(null);
    clearStoredAuth();
  };

  const refreshBackendStatus = async () => {
    return await checkBackendStatus();
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    backendStatus,
    checkBackendStatus: refreshBackendStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};