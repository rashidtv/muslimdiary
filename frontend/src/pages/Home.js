import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button
} from '@mui/material';

import { MenuBook, AccessTime, CalendarMonth, Spa } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import PrayerTimes from '../components/PrayerTimes/PrayerTimes';
import PrayerCompassInline from '../components/Qibla/PrayerCompassInline';

const Home = ({ onAuthAction }) => {
  const { user } = useAuth();

  const quickActions = [
    { icon: <MenuBook />, title: "Quran", action: "/quran" },
    { icon: <Spa />, title: "Dhikr / Du’a", action: "/dua" },
    { icon: <AccessTime />, title: "Set Reminders", action: "/settings" },
    { icon: <CalendarMonth />, title: "Calendar", action: "/calendar" },
  ];

  return (
    <Box sx={{ pb: 2 }}>

      <Container maxWidth="md" sx={{ mt: 2 }}>

        {/* ✅ Prayer Times */}
        <PrayerTimes />

        {/* ✅ Qibla Compass (inline) */}
        <Box sx={{ mt: 3 }}>
          <PrayerCompassInline />
        </Box>

        {/* ✅ Quick Actions */}
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ mt: 4, mb: 1 }}
        >
          Quick Actions
        </Typography>

        <Grid container spacing={2}>
          {quickActions.map((item, i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Card
                sx={{
                  textAlign: 'center',
                  p: 2,
                  borderRadius: 3,
                  cursor: 'pointer',
                  "&:hover": { backgroundColor: '#F3F4F6' }
                }}
                onClick={() => {
                  if (item.action.startsWith("/")) {
                    window.location.href = item.action;
                  }
                }}
              >
                <Box sx={{ fontSize: 30, mb: 1, color: '#0D9488' }}>
                  {item.icon}
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {item.title}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>

      </Container>

      {/* ✅ Public UI (if not logged in) */}
      {!user && (
        <Box sx={{ textAlign: 'center', mt: 5 }}>
          <Typography variant="h5" fontWeight={700}>
            MuslimDiary
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Create an account to save progress and reminders.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => onAuthAction('register')}
            sx={{
              backgroundColor: '#0D9488',
              "&:hover": { backgroundColor: '#0F766E' },
              px: 4, py: 1.5, borderRadius: 3
            }}
          >
            Get Started
          </Button>
        </Box>
      )}

    </Box>
  );
};

export default Home;
