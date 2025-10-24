import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { Brightness4, Brightness7, Accessibility } from '@mui/icons-material';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>
        <IconButton
          onClick={toggleDarkMode}
          color="inherit"
          sx={{
            minWidth: '44px',
            minHeight: '44px',
            border: '1px solid',
            borderColor: 'divider'
          }}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ThemeToggle;