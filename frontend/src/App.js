import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { CssBaseline, Button, Box, IconButton, Typography, Container, Avatar, Menu, MenuItem, Drawer, List, ListItem, ListItemIcon, ListItemText, BottomNavigation, BottomNavigationAction, Paper, useMediaQuery } from '@mui/material';
import {
  Home as HomeIcon,
  Analytics,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Close,
  Book,
  CalendarMonth,
  TrendingUp
} from '@mui/icons-material';

import { usePWAInstall } from './hooks/usePWAInstall';
import { PracticeProvider } from './context/PracticeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { CompassProvider } from './context/CompassContext';

import Home from './pages/Home';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import AuthModal from './components/Auth/AuthModal';
import ThemeToggle from './components/Accessibility/ThemeToggle';
import AccessibilityMenu from './components/Accessibility/AccessibilityMenu';

import './styles/accessibility.css';

/* ================= USER MENU ================= */
const UserMenu = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <>
      <Avatar
        sx={{
          width: 36,
          height: 36,
          background: 'linear-gradient(135deg, #0D9488 0%, #F59E0B 100%)',
          cursor: 'pointer',
          fontWeight: 600
        }}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        {user.name?.charAt(0).toUpperCase()}
      </Avatar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem disabled>
          <Typography fontWeight={600}>{user.name}</Typography>
        </MenuItem>
        <MenuItem onClick={() => navigate('/progress')}>My Progress</MenuItem>
        <MenuItem onClick={() => navigate('/calendar')}>My Calendar</MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>Settings</MenuItem>
        <MenuItem onClick={logout} sx={{ color: 'error.main' }}>Logout</MenuItem>
      </Menu>
    </>
  );
};

/* ================= MOBILE DRAWER ================= */
const MobileDrawer = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { label: 'Home', icon: <HomeIcon />, path: '/' },
    { label: 'Calendar', icon: <CalendarMonth />, path: '/calendar' },
    { label: 'Progress', icon: <TrendingUp />, path: '/progress' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Drawer open={open} onClose={onClose}>
      <Box sx={{ width: 260 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography fontWeight={700}>MuslimDiary</Typography>
          <IconButton onClick={onClose}><Close /></IconButton>
        </Box>

        <List>
          {items.map(item => (
            <ListItem
              key={item.path}
              button
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                onClose();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

/* ================= MOBILE BOTTOM NAV ================= */
const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { label: 'Home', icon: <HomeIcon />, path: '/' },
    { label: 'Calendar', icon: <CalendarMonth />, path: '/calendar' },
    { label: 'Progress', icon: <TrendingUp />, path: '/progress' },
  ];

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation
        value={location.pathname}
        onChange={(e, v) => navigate(v)}
      >
        {items.map(item => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            value={item.path}
            icon={item.icon}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

/* ================= HEADER ================= */
const Header = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:900px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', py: 1 }}>
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}

          <Box sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Typography fontWeight={700}>
              Muslim<span style={{ color: '#F59E0B' }}>Diary</span>
            </Typography>
          </Box>

          <AccessibilityMenu />
          <ThemeToggle />
          {user && <UserMenu />}
        </Container>
      </Box>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

/* ================= PWA INSTALL ================= */
const PWAInstallPrompt = () => {
  const { isInstallable, installApp } = usePWAInstall();
  if (!isInstallable) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 80,
        right: 16,
        backgroundColor: 'primary.main',
        color: 'white',
        p: 1.5,
        borderRadius: 2,
        cursor: 'pointer'
      }}
      onClick={installApp}
    >
      Install App
    </Box>
  );
};

/* ================= MAIN APP ================= */
function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  return (
    <ThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <PracticeProvider>
          <NotificationProvider>
            <CompassProvider>
              <Router>
                <Header />

                <Container maxWidth="lg" sx={{ py: 2 }}>
                  <Routes>
                    <Route path="/" element={<Home onAuthAction={setAuthMode} />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<Home onAuthAction={setAuthMode} />} />
                  </Routes>
                </Container>

                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <MobileBottomNav />
                </Box>

                <PWAInstallPrompt />
                <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
              </Router>
            </CompassProvider>
          </NotificationProvider>
        </PracticeProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
