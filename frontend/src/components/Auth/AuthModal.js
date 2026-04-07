import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Snackbar,
  Alert
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import Login from './Login';
import Register from './Register';

const AuthModal = ({ open, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const { login, register } = useAuth();

  const handleTabChange = (event, newValue) => {
    setMode(newValue);
  };

  const handleSubmit = async (formData) => {
    try {
      let result;
      
      if (mode === 'login') {
        result = await login(formData.email, formData.password);
      } else {
        result = await register(formData.name, formData.email, formData.password);
      }

      if (result.success) {
        setSnackbar({ 
          open: true, 
          message: `Successfully ${mode === 'login' ? 'signed in' : 'registered'}!`, 
          severity: 'success' 
        });
        onClose();
      } else {
        setSnackbar({ 
          open: true, 
          message: result.error, 
          severity: 'error' 
        });
      }
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.message, 
        severity: 'error' 
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ffffff 100%)'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          pb: 1,
          background: 'linear-gradient(135deg, #0D9488 0%, #F59E0B 100%)',
          color: 'white',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <span style={{ fontSize: '24px' }}>🕌</span>
            <Box>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                Muslim<span style={{ color: '#FFD700' }}>Diary</span>
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                {mode === 'login' ? 'Welcome Back!' : 'Start Your Journey'}
              </div>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={mode} 
              onChange={handleTabChange} 
              centered
              sx={{
                '& .MuiTab-root': {
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  textTransform: 'none',
                  minWidth: 'auto',
                  px: 3,
                  py: 2
                }
              }}
            >
              <Tab label="Sign In" value="login" />
              <Tab label="Register" value="register" />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {mode === 'login' ? (
              <Login onSubmit={handleSubmit} onSwitchToRegister={() => setMode('register')} />
            ) : (
              <Register onSubmit={handleSubmit} onSwitchToLogin={() => setMode('login')} />
            )}
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AuthModal;