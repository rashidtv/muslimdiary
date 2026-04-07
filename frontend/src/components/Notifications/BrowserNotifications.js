import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Button,
  Alert,
  Chip,
  FormGroup,
  FormControl,
  FormLabel,
  Snackbar
} from '@mui/material';
import { NotificationsActive, Science } from '@mui/icons-material';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const BrowserNotifications = () => {
  const { user } = useAuth();
  
  // All hooks at the top level
  const [selectedPrayers, setSelectedPrayers] = useState(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // This will throw an error if used outside provider, but that's okay for build
  const {
    permission,
    notificationsEnabled,
    requestPermission,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
    checkPermission
  } = useNotification();

  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  useEffect(() => {
    // Load saved prayer preferences
    const saved = localStorage.getItem('muslimDiary_notifications');
    if (saved) {
      const settings = JSON.parse(saved);
      if (settings.prayers) {
        setSelectedPrayers(settings.prayers);
      }
    }
  }, []);

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      const result = await disableNotifications();
      if (result.success) {
        showSnackbar('Notifications disabled', 'success');
      } else {
        showSnackbar('Failed to disable notifications: ' + result.error, 'error');
      }
    } else {
      setLoading(true);
      const result = await enableNotifications(selectedPrayers);
      setLoading(false);
      
      if (result.success) {
        showSnackbar('Prayer time notifications enabled!', 'success');
      } else {
        showSnackbar('Failed to enable notifications: ' + result.error, 'error');
      }
    }
  };

  const handlePrayerToggle = (prayer) => {
    const newPrayers = selectedPrayers.includes(prayer)
      ? selectedPrayers.filter(p => p !== prayer)
      : [...selectedPrayers, prayer];
    
    setSelectedPrayers(newPrayers);

    // Save immediately if notifications are enabled
    if (notificationsEnabled) {
      const settings = JSON.parse(localStorage.getItem('muslimDiary_notifications') || '{}');
      settings.prayers = newPrayers;
      localStorage.setItem('muslimDiary_notifications', JSON.stringify(settings));
    }
  };

  const handleTestNotification = () => {
    sendTestNotification('Test Prayer', new Date().toLocaleTimeString());
    showSnackbar('Test notification sent!', 'success');
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (!user) {
    return (
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <NotificationsActive sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Prayer Time Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to receive prayer time notifications
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getPermissionMessage = () => {
    switch (permission) {
      case 'granted':
        return 'Notifications are enabled for this site';
      case 'denied':
        return 'Notifications are blocked. Please enable them in your browser settings.';
      case 'unsupported':
        return 'Your browser does not support notifications';
      default:
        return 'Click enable to receive prayer time notifications';
    }
  };

  const getPermissionSeverity = () => {
    switch (permission) {
      case 'granted':
        return 'success';
      case 'denied':
        return 'error';
      case 'unsupported':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Card sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsActive sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h6">Prayer Time Notifications</Typography>
        </Box>

        <Alert severity={getPermissionSeverity()} sx={{ mb: 2 }}>
          {getPermissionMessage()}
        </Alert>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="body1" fontWeight="600">
              Browser Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Receive prayer time alerts directly in your browser
            </Typography>
          </Box>
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationsEnabled}
                onChange={handleToggleNotifications}
                disabled={loading || permission === 'denied' || permission === 'unsupported'}
                color="primary"
              />
            }
            label={notificationsEnabled ? "Enabled" : "Enable"}
          />
        </Box>

        <FormControl component="fieldset" fullWidth>
          <FormLabel component="legend">
            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
              Select Prayers to Notify
            </Typography>
          </FormLabel>
          <FormGroup>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {prayers.map((prayer) => (
                <Chip
                  key={prayer}
                  label={prayer}
                  clickable
                  color={selectedPrayers.includes(prayer) ? "primary" : "default"}
                  variant={selectedPrayers.includes(prayer) ? "filled" : "outlined"}
                  onClick={() => handlePrayerToggle(prayer)}
                  disabled={!notificationsEnabled}
                />
              ))}
            </Box>
          </FormGroup>
        </FormControl>

        {notificationsEnabled && (
          <Box sx={{ mt: 2, p: 2, backgroundColor: 'primary.light', borderRadius: 2 }}>
            <Typography variant="body2" color="primary.dark" gutterBottom>
              ✅ Notifications active for: {selectedPrayers.join(', ')}
            </Typography>
            <Typography variant="caption" color="primary.dark">
              You will receive notifications 5 minutes before each prayer time
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
          <Button
            startIcon={<Science />}
            onClick={handleTestNotification}
            variant="outlined"
            disabled={!notificationsEnabled}
          >
            Test Notification
          </Button>
          
          <Button
            onClick={checkPermission}
            variant="text"
            size="small"
          >
            Check Permission
          </Button>
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            🔔 Notifications work even when the app is closed. Make sure to allow notifications when prompted.
          </Typography>
        </Alert>
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Card>
  );
};

export default BrowserNotifications;