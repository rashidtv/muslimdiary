import React, { useState } from 'react';
import { IconButton, Tooltip, Menu, MenuItem, Chip, Box } from '@mui/material';
import { Contrast, TextIncrease, TextDecrease } from '@mui/icons-material';

const HighContrastMode = () => {
  const [fontSize, setFontSize] = useState(100); // percentage
  const [anchorEl, setAnchorEl] = useState(null);

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
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Adjust text size">
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          color="inherit"
          sx={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Adjust text size"
        >
          <TextIncrease />
        </IconButton>
      </Tooltip>

      <Tooltip title="High contrast mode">
        <IconButton
          onClick={toggleHighContrast}
          color="inherit"
          sx={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Toggle high contrast mode"
        >
          <Contrast />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
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
        <MenuItem>
          <Chip label={`${fontSize}%`} size="small" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default HighContrastMode;