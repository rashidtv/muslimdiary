import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Chip
} from '@mui/material';
import {
  Notifications,
  Palette,
  Accessibility,
  Security,
  PrivacyTip,
  Help,
  Info,
  BugReport,
  Storage,
  Wifi,
  Language,
  Email
} from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import BrowserNotifications from '../components/Notifications/BrowserNotifications';
import AccessibilityMenu from '../components/Accessibility/AccessibilityMenu';
import ThemeToggle from '../components/Accessibility/ThemeToggle';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  const appVersion = '1.1.0';
  const lastUpdated = 'October 2024';

  const features = [
    'Prayer time tracking',
    'Progress monitoring',
    'Browser notifications',
    'Dark/Light theme',
    'High contrast mode',
    'Text size adjustment',
    'PWA support',
    'Free forever'
  ];

  const quickActions = [
    {
      label: 'Test Notification',
      icon: <Notifications />,
      action: () => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🕌 Muslim Daily Test', {
            body: 'Notifications are working correctly!',
            icon: '/icons/icon-192x192.png'
          });
        } else {
          alert('Please enable notifications first');
        }
      }
    },
    {
      label: 'Clear Local Data',
      icon: <Storage />,
      action: () => {
        if (window.confirm('Clear all local data? This will reset your progress.')) {
          localStorage.clear();
          window.location.reload();
        }
      }
    },
    {
      label: 'Check Connection',
      icon: <Wifi />,
      action: () => {
        fetch('https://muslimdailybackend.onrender.com/api/health1')
          .then(() => alert('Backend connection: ✅ Online'))
          .catch(() => alert('Backend connection: ❌ Offline'));
      }
    }
  ];

  const handleEmailSupport = () => {
    const email = 'rashidbaseresourcesenterprise@gmail.com';
    const subject = 'Muslim Diary App Support';
    const body = 'Assalamu alaikum,%0D%0A%0D%0AI need help with the Muslim Diary app:%0D%0A%0D%0A[Please describe your issue here]%0D%0A%0D%0AJazakAllah Khair';
    
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleCopyEmail = () => {
    const email = 'rashidbaseresourcesenterprise@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
      alert('Email address copied to clipboard!');
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3, pb: { xs: 10, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="700" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Customize your Muslim Daily experience
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Main Settings */}
        <Grid item xs={12} lg={8}>
          {/* Notifications Section */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Notifications sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" fontWeight="600">
                    Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage prayer time alerts and reminders
                  </Typography>
                </Box>
              </Box>
              <BrowserNotifications />
            </CardContent>
          </Card>

          {/* Appearance Section */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Palette sx={{ fontSize: 32, color: 'secondary.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" fontWeight="600">
                    Appearance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customize the look and feel of the app
                  </Typography>
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Palette sx={{ mr: 2, color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body1" fontWeight="600">
                          Dark Mode
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {darkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                        </Typography>
                      </Box>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={darkMode}
                          onChange={toggleDarkMode}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Typography variant="body1" fontWeight="600" gutterBottom>
                      Accessibility
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                      High contrast and text size
                    </Typography>
                    <AccessibilityMenu />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Privacy & Data Section */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PrivacyTip sx={{ fontSize: 32, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant="h5" fontWeight="600">
                    Privacy & Data
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your data and privacy settings
                  </Typography>
                </Box>
              </Box>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <Security />
                  </ListItemIcon>
                  <ListItemText
                    primary="Data Storage"
                    secondary="Your prayer data is stored locally and securely"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Language />
                  </ListItemIcon>
                  <ListItemText
                    primary="Location Services"
                    secondary="Used only for accurate prayer time detection"
                  />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  🔒 Your data never leaves your device. We don't track or sell your personal information.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Quick Actions & Info */}
        <Grid item xs={12} lg={4}>
          {/* Quick Actions */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Quick Actions
              </Typography>
              <List>
                {quickActions.map((action, index) => (
                  <ListItem
                    key={index}
                    button
                    onClick={action.action}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <ListItemIcon>
                      {action.icon}
                    </ListItemIcon>
                    <ListItemText primary={action.label} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Info sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Typography variant="h6" fontWeight="600">
                  App Information
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Version
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {appVersion}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {lastUpdated}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Features
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {features.map((feature, index) => (
                  <Chip
                    key={index}
                    label={feature}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>

              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  🎉 Completely free - No ads, no subscriptions
                </Typography>
              </Alert>
            </CardContent>
          </Card>

          {/* Support */}
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Help sx={{ fontSize: 32, color: 'secondary.main', mr: 2 }} />
                <Typography variant="h6" fontWeight="600">
                  Support
                </Typography>
              </Box>

              <List>
                <ListItem
                  button
                  onClick={handleEmailSupport}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    <Email />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Support"
                    secondary="Get help with any issues"
                  />
                </ListItem>

                <ListItem
                  button
                  onClick={handleCopyEmail}
                  sx={{
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemIcon>
                    <BugReport />
                  </ListItemIcon>
                  <ListItemText
                    primary="Copy Email Address"
                    secondary="rashidbaseresourcesenterprise@gmail.com"
                  />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                <Typography variant="body2">
                  📧 We're here to help! Email us for any questions or issues.
                </Typography>
              </Alert>

              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Muslim Daily',
                      text: 'Check out this amazing Muslim prayer tracking app!',
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('App link copied to clipboard!');
                  }
                }}
                sx={{ mt: 1 }}
              >
                Share This App
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Made with ❤️ for the Muslim community • Alhamdulillah for everything
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Need help? Email: rashidbaseresourcesenterprise@gmail.com
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Settings;