import React, { createContext, useState, useContext, useEffect } from 'react';

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

  // Check backend status on startup
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const API_BASE = 'https://muslimdailybackend.onrender.com';
      const response = await fetch(`${API_BASE}/api/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        setBackendStatus('online');
        console.log('✅ Backend is online');
      } else {
        setBackendStatus('offline');
        console.warn('⚠️ Backend responded with error');
      }
    } catch (error) {
      setBackendStatus('offline');
      console.warn('❌ Backend is offline or starting up');
    }
  };

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('muslimDiary_user');
    const token = localStorage.getItem('muslimDiary_token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('muslimDiary_user');
        localStorage.removeItem('muslimDiary_token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, retryCount = 0) => {
    try {
      // Dynamic API URL for different environments
      const getApiBase = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:5000';
        }
        return 'https://muslimdailybackend.onrender.com';
      };

      const API_BASE = getApiBase();
      
      console.log('🔐 Attempting login to:', `${API_BASE}/api/auth/login`);
      
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      console.log('📡 Login response status:', response.status);
      
      // Handle backend warming up (524 status on Render)
      if (response.status === 524 || response.status === 503) {
        if (retryCount < 3) {
          console.log(`🔄 Backend is warming up, retry ${retryCount + 1}/3 in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          return login(email, password, retryCount + 1);
        } else {
          throw new Error('Backend is taking too long to start. Please try again in a moment.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Login failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Login successful, user data:', data.user);
        // Use ACTUAL user data from backend
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          zone: data.user.zone
        };
        
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
      
      // Handle timeout errors with retry
      if (error.name === 'TimeoutError' && retryCount < 2) {
        console.log(`🔄 Request timeout, retry ${retryCount + 1}/2 in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return login(email, password, retryCount + 1);
      }
      
      // If backend is completely down, provide helpful message
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        setBackendStatus('offline');
        return { 
          success: false, 
          error: 'Backend service is temporarily unavailable. Please try again in a moment.' 
        };
      }
      
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password, retryCount = 0) => {
    try {
      // Dynamic API URL for different environments
      const getApiBase = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return 'http://localhost:5000';
        }
        return 'https://muslimdailybackend.onrender.com';
      };

      const API_BASE = getApiBase();
      
      console.log('📝 Attempting registration to:', `${API_BASE}/api/auth/register`);
      
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      console.log('📡 Registration response status:', response.status);
      
      // Handle backend warming up
      if (response.status === 524 || response.status === 503) {
        if (retryCount < 3) {
          console.log(`🔄 Backend is warming up, retry ${retryCount + 1}/3 in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
          return register(name, email, password, retryCount + 1);
        } else {
          throw new Error('Backend is taking too long to start. Please try again in a moment.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Registration failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Registration successful, user data:', data.user);
        // Use ACTUAL user data from backend
        const userData = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          zone: data.user.zone
        };
        
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
      
      // Handle timeout errors with retry
      if (error.name === 'TimeoutError' && retryCount < 2) {
        console.log(`🔄 Request timeout, retry ${retryCount + 1}/2 in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return register(name, email, password, retryCount + 1);
      }
      
      // If backend is completely down
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        setBackendStatus('offline');
        return { 
          success: false, 
          error: 'Backend service is temporarily unavailable. Please try again in a moment.' 
        };
      }
      
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('muslimDiary_user');
    localStorage.removeItem('muslimDiary_token');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    backendStatus,
    checkBackendStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};