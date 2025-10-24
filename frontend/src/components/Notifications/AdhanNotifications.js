import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { NotificationsActive, WhatsApp } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const AdhanNotifications = () => {
  const { user } = useAuth();
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleEnableWhatsApp = async () => {
    if (!user) {
      alert('Please sign in to enable notifications');
      return;
    }
    setDialogOpen(true);
  };

  const handleSubmitPhoneNumber = async () => {
    // Validate phone number
    if (!phoneNumber.match(/^\+\d{10,15}$/)) {
      alert('Please enter a valid phone number with country code (e.g., +1234567890)');
      return;
    }

    try {
      // API call to enable WhatsApp notifications
      const response = await fetch('/api/notifications/enable-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          phoneNumber,
          prayerTimes: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
        })
      });

      if (response.ok) {
        setWhatsappEnabled(true);
        setDialogOpen(false);
        alert('WhatsApp notifications enabled successfully!');
      }
    } catch (error) {
      alert('Failed to enable notifications');
    }
  };

  if (!user) {
    return (
      <Card sx={{ borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <NotificationsActive sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Adhan Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Sign in to receive prayer time notifications on WhatsApp
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <NotificationsActive sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Typography variant="h6">Adhan Notifications</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Get notified when it's time for prayer via WhatsApp
        </Alert>

        <FormControlLabel
          control={
            <Switch
              checked={whatsappEnabled}
              onChange={handleEnableWhatsApp}
              color="primary"
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <WhatsApp sx={{ mr: 1, color: 'green' }} />
              WhatsApp Notifications
            </Box>
          }
        />

        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Enable WhatsApp Notifications</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter your WhatsApp number to receive prayer time notifications
            </Typography>
            <TextField
              autoFocus
              label="Phone Number"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              fullWidth
              variant="outlined"
              helperText="Include country code (e.g., +1 for US)"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitPhoneNumber} variant="contained">
              Enable
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdhanNotifications;