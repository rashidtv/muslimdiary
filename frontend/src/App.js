import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { CssBaseline, Snackbar, Alert, Button } from '@mui/material';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery
} from '@mui/material';
import {
  AccountCircle,
  Login,
  Logout,
  Mosque,
  Home as HomeIcon,
  Analytics,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Close,
  Book,
  Schedule,
  TrendingUp,
  CalendarMonth,
  LocationOn,
  CompassCalibration
} from '@mui/icons-material';
import { usePWAInstall } from './hooks/usePWAInstall';
import { PracticeProvider } from './context/PracticeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { CompassProvider } from './context/CompassContext'; // Add this import

// Components
import Home from './pages/Home';
import PrayerResources from './pages/PrayerResources';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import AuthModal from './components/Auth/AuthModal';
import ThemeToggle from './components/Accessibility/ThemeToggle';
import AccessibilityMenu from './components/Accessibility/AccessibilityMenu';

// Import accessibility CSS
import './styles/accessibility.css';

// User Profile Menu Component
const UserMenu = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  const handleNavigate = (path) => {
    navigate(path);
    handleClose();
  };

  if (!user) return null;

  return (
    <div>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar 
          sx={{ 
            width: 36, 
            height: 36, 
            background: 'linear-gradient(135deg, #0D9488 0%, #F59E0B 100%)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
          onClick={handleMenu}
          aria-label="User menu"
        >
          {user.name?.charAt(0).toUpperCase()}
        </Avatar>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ 
          sx: { 
            mt: 1, 
            borderRadius: 2,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          } 
        }}
      >
        <MenuItem sx={{ cursor: 'default', opacity: 1 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="600">{user.name}</Typography>
            <Typography variant="caption" color="text.secondary">{user.email}</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/progress')}>
          <Analytics sx={{ mr: 2, fontSize: '1.2rem', color: 'primary.main' }} />
          <Typography variant="body2">My Progress</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/calendar')}>
          <CalendarMonth sx={{ mr: 2, fontSize: '1.2rem', color: 'primary.main' }} />
          <Typography variant="body2">My Calendar</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/settings')}>
          <SettingsIcon sx={{ mr: 2, fontSize: '1.2rem', color: 'primary.main' }} />
          <Typography variant="body2">Settings</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <Logout sx={{ mr: 2, fontSize: '1.2rem' }} />
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>
    </div>
  );
};

// Enhanced Mobile Navigation Drawer with "Start Your Journey"
const MobileNavigationDrawer = ({ open, onClose, onAuthAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

 const navigationItems = [
  { label: 'Home', icon: <HomeIcon />, path: '/' },
  { label: 'Prayer Resources', icon: <CompassCalibration />, path: '/prayer-resources' }, // Fixed path
  { label: 'My Calendar', icon: <CalendarMonth />, path: '/calendar' },
  { label: 'Progress', icon: <Analytics />, path: '/progress' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 280,
          backgroundColor: 'background.paper'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
              border: '1px solid rgba(13, 148, 136, 0.2)'
            }}
          >
            <Book sx={{ fontSize: 18, color: 'primary.main' }} />
          </Box>
          <Typography variant="h6" fontWeight="700">
            Muslim<span style={{ color: '#F59E0B' }}>Diary</span>
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" aria-label="Close menu">
          <Close />
        </IconButton>
      </Box>

      <List sx={{ mt: 1, px: 1 }}>
        {navigationItems.map((item) => (
          <ListItem 
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            sx={{
              cursor: 'pointer',
              backgroundColor: location.pathname === item.path ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
              margin: '4px 0',
              borderRadius: 2,
              '&:hover': {
                backgroundColor: 'rgba(13, 148, 136, 0.04)'
              }
            }}
          >
            <ListItemIcon sx={{ 
              color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
              minWidth: 40 
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label}
              primaryTypographyProps={{ 
                fontWeight: location.pathname === item.path ? 600 : 400,
                fontSize: '0.9rem'
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Enhanced "Start Your Journey" Section - Show for both logged in/out but different content */}
      <Box sx={{ p: 3, mt: 'auto', borderTop: '1px solid #E2E8F0', textAlign: 'center' }}>
        {!user ? (
          <>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Start Your Journey
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Track your prayers, monitor progress, and grow spiritually
            </Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                onAuthAction('register');
                onClose();
              }}
              sx={{
                mb: 2,
                borderRadius: 2,
                fontSize: '1rem',
                py: 1.5,
                background: 'linear-gradient(135deg, #0D9488 0%, #F59E0B 100%)',
                fontWeight: '600'
              }}
            >
              Start Your Journey
            </Button>
            <Typography variant="caption" color="text.secondary">
              Click to track prayers and view progress
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Welcome Back!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Continue your spiritual journey
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                navigate('/progress');
                onClose();
              }}
              sx={{
                borderRadius: 2,
                fontSize: '0.9rem',
                py: 1.5
              }}
            >
              View My Progress
            </Button>
          </>
        )}
      </Box>
    </Drawer>
  );
};

// Mobile Bottom Navigation
const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
  { label: 'Home', icon: <HomeIcon />, path: '/' },
  { label: 'Resources', icon: <CompassCalibration />, path: '/prayer-resources' }, // Fixed path
  { label: 'Calendar', icon: <CalendarMonth />, path: '/calendar' },
  { label: 'Progress', icon: <TrendingUp />, path: '/progress' },
];

  return (
    <Paper sx={{ 
      position: 'fixed', 
      bottom: 0, 
      left: 0, 
      right: 0, 
      zIndex: 1000,
      borderTop: '1px solid',
      borderColor: 'divider',
    }} elevation={3}>
      <BottomNavigation
        value={location.pathname}
        onChange={(event, newValue) => navigate(newValue)}
        showLabels
        sx={{
          backgroundColor: 'background.paper',
          height: '65px'
        }}
      >
        {navigationItems.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            value={item.path}
            icon={item.icon}
            sx={{
              color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
              minWidth: '60px',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: location.pathname === item.path ? 600 : 400,
                mt: 0.5
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

// Modern Header Component - Remove auth buttons from header
const Header = ({ onAuthAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 900px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();

  // Desktop navigation items
  const navigationItems = [
  { label: 'Home', path: '/' },
  { label: 'Prayer Resources', path: '/prayer-resources' }, // Fixed path
  { label: 'Calendar', path: '/calendar' },
  { label: 'Progress', path: '/progress' },
];

  return (
    <>
      <AppBar position="sticky" elevation={1} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
        <Toolbar sx={{ minHeight: { xs: '60px', md: '68px' }, py: 1 }}>
          <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                edge="start"
                sx={{ mr: 1, color: 'text.primary' }}
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                flexGrow: 1, 
                cursor: 'pointer' 
              }} 
              onClick={() => navigate('/')}
              aria-label="Muslim Diary Home"
            >
              <Box
                sx={{
                  width: { xs: 32, md: 36 },
                  height: { xs: 32, md: 36 },
                  backgroundColor: 'rgba(13, 148, 136, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                  border: '1px solid rgba(13, 148, 136, 0.2)'
                }}
              >
                <Book sx={{ fontSize: { xs: 18, md: 20 }, color: 'primary.main' }} />
              </Box>
              <Typography variant="h6" component="div" fontWeight="700">
                Muslim<span style={{ color: '#F59E0B' }}>Diary</span>
              </Typography>
            </Box>

            {/* Desktop Navigation - Only show if user is logged in */}
            {!isMobile && user && (
              <Box sx={{ display: 'flex', gap: 2, mr: 4 }}>
                {navigationItems.map((item) => (
                  <Button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      fontWeight: 600,
                      color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                      fontSize: '0.9rem',
                      px: 2,
                      borderRadius: 2,
                      backgroundColor: location.pathname === item.path ? 'rgba(13, 148, 136, 0.08)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(13, 148, 136, 0.04)',
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Only show theme and accessibility controls - NO AUTH BUTTONS */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessibilityMenu />
              <ThemeToggle />
              {/* Show user menu if logged in, nothing if logged out */}
              {user && <UserMenu />}
            </Box>
          </Container>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <MobileNavigationDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        onAuthAction={onAuthAction}
      />
    </>
  );
};

// PWA Install Prompt Component
const PWAInstallPrompt = () => {
  const { isInstallable, installApp } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 72, md: 24 },
        right: { xs: 16, md: 24 },
        left: { xs: 16, md: 'auto' },
        backgroundColor: 'primary.main',
        color: 'white',
        padding: '12px 16px',
        borderRadius: 12,
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(13, 148, 136, 0.3)',
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        fontSize: '0.8rem',
        fontWeight: '600',
        textAlign: 'center'
      }}
      onClick={installApp}
      role="button"
      aria-label="Install Muslim Diary app"
    >
      <Box
        sx={{
          width: 24,
          height: 24,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span style={{ fontSize: '14px' }}>📱</span>
      </Box>
      Install App
    </Box>
  );
};

// Simple Coming Soon Components
const MosqueFinderComingSoon = () => (
  <Container maxWidth="lg" sx={{ py: 3, textAlign: 'center' }}>
    <Typography variant="h4" fontWeight="700" gutterBottom>
      Mosque Finder
    </Typography>
    <Typography variant="h6" color="text.secondary">
      Coming Soon
    </Typography>
  </Container>
);

// Main App Component
function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const handleAuthAction = (mode) => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <PracticeProvider>
          <NotificationProvider>
            <CompassProvider> {/* Add CompassProvider here */}
              <Router>
                <Box sx={{ 
                  minHeight: '100vh', 
                  backgroundColor: 'background.default',
                  pb: { xs: '65px', md: 0 },
                }}>
                  <Header onAuthAction={handleAuthAction} />
                  
                  <Container 
                    maxWidth="lg" 
                    sx={{ 
                      py: { xs: 2, md: 3 },
                      px: { xs: 2, sm: 3 } 
                    }}
                  >
                    <Routes>
                      <Route path="/" element={<Home onAuthAction={handleAuthAction} />} />
                      <Route path="/progress" element={<Progress />} />
                      <Route path="/prayer-resources" element={<PrayerResources />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Home onAuthAction={handleAuthAction} />} />
                    </Routes>
                  </Container>

                  {/* Mobile Bottom Navigation */}
                  <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                    <MobileBottomNav />
                  </Box>

                  <PWAInstallPrompt />

                  <AuthModal 
                    open={authModalOpen}
                    onClose={() => setAuthModalOpen(false)}
                    initialMode={authMode}
                  />

                  {/* Auto-update notification */}
                 
                </Box>
              </Router>
            </CompassProvider>
          </NotificationProvider>
        </PracticeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;