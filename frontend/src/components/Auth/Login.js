import React, { useState } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const Login = ({ onSubmit, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        fullWidth
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        required
        sx={{ mb: 2 }}
      />
      <TextField
        fullWidth
        label="Password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange}
        required
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{ mb: 3 }}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={loading}
        sx={{
          py: 1.5,
          borderRadius: 2,
          fontSize: '1rem',
          fontWeight: '600',
          background: 'linear-gradient(135deg, #0D9488 0%, #F59E0B 100%)'
        }}
      >
        {loading ? 'Signing In...' : 'Sign In'}
      </Button>
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Don't have an account?{' '}
          <Button 
            onClick={onSwitchToRegister}
            sx={{ 
              textTransform: 'none', 
              fontWeight: '600',
              color: 'primary.main'
            }}
          >
            Register here
          </Button>
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;