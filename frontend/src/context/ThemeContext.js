import React, { createContext, useState, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    // Check user's system preference or saved preference
    const savedTheme = localStorage.getItem('muslimDiary_theme');
    const savedHighContrast = localStorage.getItem('muslimDiary_highContrast');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(systemPrefersDark);
    }

    if (savedHighContrast) {
      setHighContrast(savedHighContrast === 'true');
      if (savedHighContrast === 'true') {
        document.body.classList.add('high-contrast');
      }
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('muslimDiary_theme', newDarkMode ? 'dark' : 'light');
  };

  const toggleHighContrast = () => {
    const newHighContrast = !highContrast;
    setHighContrast(newHighContrast);
    localStorage.setItem('muslimDiary_highContrast', newHighContrast.toString());
    
    if (newHighContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  // Enhanced theme with better accessibility
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#14B8A6' : '#0D9488',
        light: darkMode ? '#2DD4BF' : '#14B8A6',
        dark: darkMode ? '#0F766E' : '#0D9488',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#F59E0B',
        light: '#FBBF24',
        dark: '#D97706',
      },
      background: {
        default: darkMode ? '#0F172A' : '#F0FDFA',
        paper: darkMode ? '#1E293B' : '#FFFFFF',
      },
      text: {
        primary: darkMode ? '#F1F5F9' : '#1E293B',
        secondary: darkMode ? '#94A3B8' : '#64748B',
      },
      // Enhanced contrast for accessibility
      contrastThreshold: 4.5,
      tonalOffset: 0.2,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { 
        fontWeight: 700,
        fontSize: { xs: '1.5rem', md: '2rem' },
      },
      h5: { 
        fontWeight: 600,
        fontSize: { xs: '1.25rem', md: '1.5rem' },
      },
      h6: { 
        fontWeight: 600,
        fontSize: { xs: '1.1rem', md: '1.25rem' },
      },
      body1: {
        fontSize: { xs: '0.875rem', md: '1rem' },
        lineHeight: 1.6, // Better readability
      },
      body2: {
        fontSize: { xs: '0.8rem', md: '0.875rem' },
        lineHeight: 1.5,
      },
      button: { 
        fontWeight: 600, 
        textTransform: 'none',
        fontSize: { xs: '0.8rem', md: '0.9rem' }
      },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: darkMode 
              ? '0 2px 12px rgba(0, 0, 0, 0.3)' 
              : '0 2px 12px rgba(13, 148, 136, 0.08)',
            border: darkMode 
              ? '1px solid #374151' 
              : '1px solid #E2E8F0',
            borderRadius: 16,
            transition: 'all 0.2s ease',
            '&:hover': {
              boxShadow: darkMode 
                ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
                : '0 4px 20px rgba(13, 148, 136, 0.12)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: { xs: '8px 16px', md: '10px 24px' },
            fontWeight: 600,
            fontSize: { xs: '0.8rem', md: '0.9rem' },
            minHeight: '44px', // Better touch targets for accessibility
            minWidth: '44px',
          },
          contained: {
            backgroundColor: darkMode ? '#14B8A6' : '#0D9488',
            '&:hover': {
              backgroundColor: darkMode ? '#0F766E' : '#0D9488',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: '44px', // Better touch targets
            minHeight: '44px',
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            minHeight: '44px', // Better touch targets
          },
        },
      },
    },
  });

  const value = {
    darkMode,
    toggleDarkMode,
    highContrast,
    toggleHighContrast,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};