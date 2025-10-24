import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Container,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  AccessTime,
  TrendingUp,
  MenuBook,
  Psychology,
  PlayArrow,
  CheckCircle,
  Chat,
  CalendarMonth,
  LocationOn
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import PrayerTimes from '../components/PrayerTimes/PrayerTimes';

const Home = ({ onAuthAction }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const features = [
    {
      icon: <Chat sx={{ fontSize: { xs: 20, md: 24 } }} />,
      title: 'WhatsApp Reminders',
      description: 'Prayer times & Quran verses directly in WhatsApp'
    },
    {
      icon: <CalendarMonth sx={{ fontSize: { xs: 20, md: 24 } }} />,
      title: 'Daily Planning',
      description: 'Schedule spiritual tasks with your day'
    },
    {
      icon: <AccessTime sx={{ fontSize: { xs: 20, md: 24 } }} />,
      title: 'Prayer Times',
      description: 'Accurate times with auto-location'
    },
    {
      icon: <TrendingUp sx={{ fontSize: { xs: 20, md: 24 } }} />,
      title: 'Progress Tracking',
      description: 'Track your spiritual growth'
    }
  ];

  const handleGetStarted = () => {
    if (onAuthAction) {
      onAuthAction('register');
    }
  };

  return (
    <Box sx={{ pb: { xs: 1, md: 0 } }}>
      {/* Hero Section */}
      <Box sx={{ 
        textAlign: 'center', 
        mb: { xs: 3, md: 4 },
        pt: { xs: 1, md: 2 }
      }}>
        <Container maxWidth="md">
          <Box
            sx={{
              width: { xs: 70, md: 90 },
              height: { xs: 70, md: 90 },
              backgroundColor: 'rgba(13, 148, 136, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '2px solid rgba(13, 148, 136, 0.2)'
            }}
          >
            <MenuBook sx={{ fontSize: { xs: 32, md: 42 }, color: '#0D9488' }} />
          </Box>
          
          <Typography 
            variant={isMobile ? "h4" : "h3"} 
            fontWeight="700" 
            gutterBottom
          >
            Muslim<span style={{ color: '#F59E0B' }}>Diary</span>
          </Typography>
          
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              color: 'text.secondary', 
              mb: 3,
              maxWidth: 500,
              margin: '0 auto',
              lineHeight: 1.4
            }}
          >
            Your peaceful companion for daily spiritual practice
          </Typography>
          
          {!user && (
            <Button 
              variant="contained" 
              size={isMobile ? "large" : "large"}
              endIcon={<PlayArrow />}
              onClick={handleGetStarted}
              sx={{
                backgroundColor: '#0D9488',
                '&:hover': {
                  backgroundColor: '#0F766E',
                },
                px: { xs: 4, md: 6 },
                py: { xs: 1.5, md: 2 },
                borderRadius: 3,
                fontWeight: 700,
                fontSize: { xs: '1rem', md: '1.1rem' },
              }}
            >
              Start Your Journey
            </Button>
          )}
          {user && (
            <Chip 
              icon={<CheckCircle sx={{ fontSize: 16 }} />}
              label={`Welcome back, ${user.name}`}
              sx={{ 
                backgroundColor: 'rgba(13, 148, 136, 0.08)',
                color: '#0D9488',
                border: '1px solid rgba(13, 148, 136, 0.2)',
                fontSize: { xs: '0.9rem', md: '1rem' },
                padding: { xs: 1, md: 1.5 },
                height: 'auto',
                fontWeight: 500
              }}
            />
          )}
        </Container>
      </Box>

      {/* Prayer Times Section */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <PrayerTimes />
      </Box>

      {/* Features Grid */}
      <Container maxWidth="lg" sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          textAlign="center" 
          fontWeight="700" 
          gutterBottom 
          sx={{ mb: { xs: 2, md: 3 } }}
        >
          Why Choose Muslim Diary?
        </Typography>
        <Grid container spacing={2}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center' }}>
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box 
                    sx={{
                      width: 50,
                      height: 50,
                      backgroundColor: 'rgba(13, 148, 136, 0.1)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      color: '#0D9488'
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" fontWeight="600" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* WhatsApp Integration */}
      {!user && (
        <Container maxWidth="md" sx={{ mt: { xs: 3, md: 4 }, textAlign: 'center' }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            color: 'white',
            borderRadius: 3
          }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Chat sx={{ fontSize: { xs: 40, md: 48 }, mb: 2 }} />
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight="700" gutterBottom>
                Reminders on WhatsApp
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
                Get prayer times and daily verses without opening the app
              </Typography>
              <Button 
                variant="contained"
                onClick={handleGetStarted}
                sx={{
                  backgroundColor: 'white',
                  color: '#128C7E',
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 700
                }}
              >
                Connect WhatsApp
              </Button>
            </CardContent>
          </Card>
        </Container>
      )}
    </Box>
  );
};

export default Home;