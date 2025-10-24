import React, { useState, useContext } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { AccessTime, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { PracticeContext } from '../../context/PracticeContext';

const PrayerTimesCard = () => {
  const { user } = useAuth();
  const { trackPrayer } = useContext(PracticeContext);
  const [selectedPrayer, setSelectedPrayer] = useState('');
  const [trackingStatus, setTrackingStatus] = useState({});

  // Sample prayer times - you can replace with actual API data
  const prayerTimes = [
    { name: 'Fajr', time: '5:30 AM', completed: false },
    { name: 'Dhuhr', time: '12:30 PM', completed: false },
    { name: 'Asr', time: '4:00 PM', completed: false },
    { name: 'Maghrib', time: '6:15 PM', completed: false },
    { name: 'Isha', time: '8:00 PM', completed: false }
  ];

  const handlePrayerSelect = (prayerName) => {
    setSelectedPrayer(prayerName);
  };

  const trackPrayerHandler = async () => {
    if (!user) {
      setTrackingStatus({ type: 'error', message: 'Please sign in to track prayers' });
      return;
    }

    if (!selectedPrayer) {
      setTrackingStatus({ type: 'error', message: 'Please select a prayer' });
      return;
    }

    try {
      await trackPrayer(selectedPrayer);
      setTrackingStatus({ 
        type: 'success', 
        message: `${selectedPrayer} prayer tracked successfully!` 
      });
      setSelectedPrayer('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setTrackingStatus({});
      }, 3000);
    } catch (error) {
      setTrackingStatus({ type: 'error', message: 'Failed to track prayer' });
    }
  };

  if (!user) {
    return (
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <AccessTime sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Prayer Times Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to track your daily prayers and monitor your progress
          </Typography>
          <Button variant="contained" size="large">
            Sign In to Track
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3, overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccessTime sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h5" fontWeight="600">
              Today's Prayers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track your daily prayers
            </Typography>
          </Box>
          <Chip 
            label="Live" 
            color="success" 
            size="small"
            sx={{ ml: 'auto' }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {trackingStatus.message && (
          <Alert 
            severity={trackingStatus.type} 
            sx={{ mb: 2 }}
            onClose={() => setTrackingStatus({})}
          >
            {trackingStatus.message}
          </Alert>
        )}

        <RadioGroup value={selectedPrayer} sx={{ mb: 3 }}>
          {prayerTimes.map((prayer, index) => (
            <Box
              key={prayer.name}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                mb: 1,
                borderRadius: 2,
                border: '2px solid',
                borderColor: selectedPrayer === prayer.name ? 'primary.main' : 'divider',
                backgroundColor: selectedPrayer === prayer.name ? 'rgba(13, 148, 136, 0.04)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: 'primary.light',
                  backgroundColor: 'rgba(13, 148, 136, 0.02)'
                }
              }}
              onClick={() => handlePrayerSelect(prayer.name)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <FormControlLabel
                  value={prayer.name}
                  control={
                    <Radio 
                      icon={<RadioButtonUnchecked />}
                      checkedIcon={<CheckCircle color="primary" />}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle1" fontWeight="600">
                        {prayer.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {prayer.time}
                      </Typography>
                    </Box>
                  }
                  sx={{ mr: 0, flex: 1 }}
                />
              </Box>
              
              {prayer.completed && (
                <Chip 
                  label="Completed" 
                  color="success" 
                  size="small" 
                  variant="outlined"
                />
              )}
            </Box>
          ))}
        </RadioGroup>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={trackPrayerHandler}
          disabled={!selectedPrayer}
          sx={{
            borderRadius: 2,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          Mark as Completed
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Track your progress in the Progress page
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PrayerTimesCard;