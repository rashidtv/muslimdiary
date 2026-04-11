import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  MenuBook,
  Spa,
  CalendarMonth,
  CompassCalibration
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';
import PrayerTimes from '../components/PrayerTimes/PrayerTimes';
import QiblaModal from '../components/Qibla/QiblaModal';

const Home = ({ onAuthAction }) => {
  const { user } = useAuth();
  const [qiblaOpen, setQiblaOpen] = useState(false);

  // ✅ Quick actions shown below prayer times
  const quickActions = [
    {
      title: 'Quran',
      icon: <MenuBook />,
      action: '/quran'
    },
    {
      title: 'Dhikr / Du’a',
      icon: <Spa />,
      action: '/dua'
    },
    {
      title: 'Qibla',
      icon: <CompassCalibration />,
      action: 'qibla' // special modal action
    },
    {
      title: 'Calendar',
      icon: <CalendarMonth />,
      action: '/calendar'
    }
  ];

  const handleQuickAction = (action) => {
    if (action === 'qibla') {
      setQiblaOpen(true);
    } else {
      window.location.href = action;
    }
  };

  return (
    <Box sx={{ pb: { xs: 2, md: 3 } }}>
      <Container maxWidth="md">

        {/* ✅ MAIN PRAYER SECTION */}
        <PrayerTimes />

        {/* ✅ QUICK ACTIONS */}
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ mt: 3, mb: 1 }}
        >
          Quick Actions
        </Typography>

        <Grid container spacing={2}>
          {quickActions.map((item, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Card
                onClick={() => handleQuickAction(item.action)}
                sx={{
                  cursor: 'pointer',
                  borderRadius: 3,
                  textAlign: 'center',
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    backgroundColor: 'rgba(13,148,136,0.05)'
                  }
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Box
                    sx={{
                      fontSize: 28,
                      color: 'primary.main',
                      mb: 1
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={600}
                  >
                    {item.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ✅ OPTIONAL CTA FOR LOGGED-OUT USERS */}
        {!user && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Track your prayers & progress
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2 }}
            >
              Create an account to save prayer history and reminders.
            </Typography>
            <Typography
              onClick={() => onAuthAction?.('register')}
              sx={{
                display: 'inline-block',
                cursor: 'pointer',
                fontWeight: 600,
                color: 'primary.main'
              }}
            >
              Create an account →
            </Typography>
          </Box>
        )}

      </Container>

      {/* ✅ QIBLA MODAL (ONLY OPENS WHEN USER TAPS QUICK ACTION) */}
      <QiblaModal
        open={qiblaOpen}
        onClose={() => setQiblaOpen(false)}
      />
    </Box>
  );
};

export default Home;
