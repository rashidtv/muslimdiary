import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Paper,
  useTheme
} from '@mui/material';
import { CheckCircle, Schedule, TrendingUp } from '@mui/icons-material';
import { usePractice } from '../context/PracticeContext';
import { useAuth } from '../context/AuthContext';

const Progress = () => {
  const { prayerProgress, getTodayPrayers, getWeeklyProgress } = usePractice();
  const { user } = useAuth();
  const theme = useTheme();

  // Safe data access with fallbacks
  const todayPrayers = getTodayPrayers ? getTodayPrayers() : [];
  const weeklyProgress = getWeeklyProgress ? getWeeklyProgress() : [];
  
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  
  // Calculate today's progress
  const todayCompleted = todayPrayers ? todayPrayers.length : 0;
  const todayTotal = prayers.length;
  const todayPercentage = todayTotal > 0 ? (todayCompleted / todayTotal) * 100 : 0;

  // Calculate weekly progress
  const weeklyCompleted = weeklyProgress ? weeklyProgress.length : 0;
  const weeklyTotal = prayers.length * 7; // 5 prayers × 7 days
  const weeklyPercentage = weeklyTotal > 0 ? (weeklyCompleted / weeklyTotal) * 100 : 0;

  // Get completion status for each prayer today
  const getPrayerCompletionStatus = (prayerName) => {
    if (!todayPrayers) return false;
    return todayPrayers.some(prayer => prayer.name === prayerName);
  };

  if (!user) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Prayer Progress
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Sign in to track your prayer progress and see your achievements
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight="700" gutterBottom>
        Your Progress
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track your daily prayers and spiritual journey
      </Typography>

      {/* Today's Progress */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TrendingUp sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight="600">
                Today's Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Typography>
            </Box>
            <Chip 
              label={`${todayCompleted}/${todayTotal}`} 
              color="primary" 
              sx={{ ml: 'auto' }}
            />
          </Box>

          <LinearProgress 
            variant="determinate" 
            value={todayPercentage} 
            sx={{ 
              height: 12, 
              borderRadius: 6, 
              mb: 3,
              backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200'
            }}
          />

          <Grid container spacing={2}>
            {prayers.map((prayer) => {
              const isCompleted = getPrayerCompletionStatus(prayer);
              return (
                <Grid item xs={12} sm={6} md={4} key={prayer}>
                  <Paper 
                    elevation={1}
                    sx={{ 
                      p: 2, 
                      borderRadius: 2,
                      border: isCompleted ? '2px solid' : '1px solid',
                      borderColor: isCompleted ? 'success.main' : 'divider',
                      backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.08)' : 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle sx={{ color: 'success.main' }} />
                    ) : (
                      <Schedule sx={{ color: 'text.secondary' }} />
                    )}
                    <Box>
                      <Typography variant="body1" fontWeight="600">
                        {prayer}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isCompleted ? 'Completed' : 'Pending'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Weekly Progress */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TrendingUp sx={{ fontSize: 32, color: 'secondary.main', mr: 2 }} />
            <Box>
              <Typography variant="h5" fontWeight="600">
                Weekly Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This week's prayer completion
              </Typography>
            </Box>
            <Chip 
              label={`${weeklyCompleted}/${weeklyTotal}`} 
              color="secondary" 
              sx={{ ml: 'auto' }}
            />
          </Box>

          <LinearProgress 
            variant="determinate" 
            value={weeklyPercentage} 
            sx={{ 
              height: 12, 
              borderRadius: 6,
              backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200'
            }}
          />

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {weeklyPercentage.toFixed(1)}% of weekly prayers completed
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2, borderRadius: 3 }}>
            <Typography variant="h3" fontWeight="700" color="primary.main">
              {todayCompleted}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Today's Prayers
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2, borderRadius: 3 }}>
            <Typography variant="h3" fontWeight="700" color="secondary.main">
              {weeklyCompleted}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This Week
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2, borderRadius: 3 }}>
            <Typography variant="h3" fontWeight="700" color="success.main">
              {prayerProgress ? prayerProgress.length : 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Prayers
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ textAlign: 'center', p: 2, borderRadius: 3 }}>
            <Typography variant="h3" fontWeight="700" color="info.main">
              {todayPercentage.toFixed(0)}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Today's Goal
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Progress;