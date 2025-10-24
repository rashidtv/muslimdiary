// Create a new file: frontend/src/components/Accessibility/AccessibilityMenu.js
import React, { useState } from 'react';
import { IconButton, Tooltip, Menu, MenuItem, Box } from '@mui/material';
import { Accessibility, Contrast, TextIncrease, TextDecrease } from '@mui/icons-material';

const AccessibilityMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [fontSize, setFontSize] = useState(100);

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 10, 150));
    document.documentElement.style.fontSize = `${fontSize + 10}%`;
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 10, 80));
    document.documentElement.style.fontSize = `${fontSize - 10}%`;
  };

  const resetFontSize = () => {
    setFontSize(100);
    document.documentElement.style.fontSize = '100%';
  };

  const toggleHighContrast = () => {
    document.body.classList.toggle('high-contrast');
    setAnchorEl(null); // Close menu after selection
  };

  return (
    <Box>
      <Tooltip title="Accessibility options">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          color="inherit"
          sx={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Accessibility options"
        >
          <Accessibility />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { 
            mt: 1, 
            borderRadius: 2,
            minWidth: 200
          }
        }}
      >
        <MenuItem onClick={toggleHighContrast}>
          <Contrast sx={{ mr: 1 }} />
          High Contrast Mode
        </MenuItem>
        <MenuItem onClick={increaseFontSize}>
          <TextIncrease sx={{ mr: 1 }} />
          Increase Text Size
        </MenuItem>
        <MenuItem onClick={decreaseFontSize}>
          <TextDecrease sx={{ mr: 1 }} />
          Decrease Text Size
        </MenuItem>
        <MenuItem onClick={resetFontSize}>
          Reset Text Size
        </MenuItem>
        <MenuItem disabled>
          Current: {fontSize}%
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AccessibilityMenu;