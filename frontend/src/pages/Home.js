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
import PrayerCompassInline from '../components/Qibla/PrayerCompassInline';

const Home = ({ onAuthAction }) => {
  const { user } = useAuth();
  const [showQibla, setShowQibla] = useState(false);

  const quickActions = [
    { title: 'Quran', icon: <MenuBook />, action: '/quran' },
    { title: 'Dhikr / Du’a', icon: <Spa />, action: '/dua' },
    { title: 'Qibla', icon: <CompassCalibration />, action: 'inlineQibla' },
    { title: 'Calendar', icon: <CalendarMonth />, action: '/calendar' }
  ];

  const handleQuickAction = (action) => {
    if (action === 'inlineQibla') {
      setShowQibla(true);
      return;
    }
    window.location.href = action;
  };

  return (
    <Box sx={{ pb: 2 }}>
      <Container maxWidth="md">

        {/* ✅ Prayer Times */}
        <PrayerTimes />

        {/* ✅ Inline Qibla Compass */}
        {showQibla && (
          <Box sx={{ mt: 3 }}>
            <PrayerCompassInline />
          </Box>
        )}

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
                  border: '1px solid #E5E7EB',
                  '&:hover': {
                    backgroundColor: 'rgba(13,148,136,0.05)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ fontSize: 28, color: 'primary.main', mb: 1 }}>
                    {item.icon}
                  </Box>
                  <Typography variant="body2" fontWeight={600}>
                    {item.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default Home;
