import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Grid,
  useTheme,
  useMediaQuery,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  AccessTime,
  Refresh,
  MyLocation,
  WbSunny,
  NightsStay,
  Brightness4
} from '@mui/icons-material';

const PrayerTimes = () => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [zone, setZone] = useState('');
  const [locationName, setLocationName] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery('(max-width: 400px)');
  const isVerySmallMobile = useMediaQuery('(max-width: 360px)');

  // Get user's current zone from coordinates with intelligent fallback
  const getCurrentZone = async () => {
    try {
      // Try to get coordinates from localStorage first (from PrayerResources)
      const locationData = localStorage.getItem('userLocationData');
      if (locationData) {
        const parsedData = JSON.parse(locationData);
        if (parsedData.coordinates) {
          const { latitude, longitude } = parsedData.coordinates;
          const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:5000' 
            : 'https://muslimdiarybackend.onrender.com';

          const response = await fetch(`${API_BASE}/api/prayertimes/coordinates/${latitude}/${longitude}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              return { zone: data.data.zone, locationName: data.data.locationName };
            }
          }
        }
      }
      
      // Fallback: Try browser geolocation
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur, Putrajaya' });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:5000' 
                : 'https://muslimdiarybackend.onrender.com';

              const response = await fetch(`${API_BASE}/api/prayertimes/coordinates/${latitude}/${longitude}`);
              if (response.ok) {
                const data = await response.json();
                if (data.success) {
                  resolve({ zone: data.data.zone, locationName: data.data.locationName });
                } else {
                  resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur, Putrajaya' });
                }
              } else {
                resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur, Putrajaya' });
              }
            } catch (error) {
              resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur, Putrajaya' });
            }
          },
          (error) => {
            console.log('Geolocation failed, using default zone');
            resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur, Putrajaya' });
          },
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 300000
          }
        );
      });
    } catch (error) {
      console.log('Zone detection error:', error);
      return { zone: 'WLY01', locationName: 'Kuala Lumpur, Putrajaya' };
    }
  };

  useEffect(() => {
    fetchPrayerTimes();
  }, []);

  useEffect(() => {
    if (prayerTimes) {
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [prayerTimes]);

  const fetchPrayerTimes = async () => {
    setLoading(true);
    setError('');
    try {
      const { zone: currentZone, locationName: currentLocationName } = await getCurrentZone();
      setZone(currentZone);
      setLocationName(currentLocationName);

      const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000' 
        : 'https://muslimdiarybackend.onrender.com';

      const response = await fetch(`${API_BASE}/api/prayertimes/${currentZone}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prayer times: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setPrayerTimes(data.data);
        // Store successful zone for future fallback
        localStorage.setItem('lastKnownZone', currentZone);
      } else {
        throw new Error(data.error || 'No prayer times data received');
      }
    } catch (err) {
      console.error('Prayer times fetch error:', err);
      setError('Failed to load prayer times: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPrayerTimes();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getPrayerIcon = (prayerName) => {
    const iconSize = isMobile ? 18 : 20;
    switch (prayerName.toLowerCase()) {
      case 'fajr':
        return <Brightness4 sx={{ fontSize: iconSize, color: '#1976d2' }} />;
      case 'dhuhr':
        return <WbSunny sx={{ fontSize: iconSize, color: '#f57c00' }} />;
      case 'asr':
        return <AccessTime sx={{ fontSize: iconSize, color: '#388e3c' }} />;
      case 'maghrib':
        return <NightsStay sx={{ fontSize: iconSize, color: '#d32f2f' }} />;
      case 'isha':
        return <NightsStay sx={{ fontSize: iconSize, color: '#7b1fa2' }} />;
      default:
        return <AccessTime sx={{ fontSize: iconSize }} />;
    }
  };

  const getPrayerColor = (prayerName) => {
    switch (prayerName.toLowerCase()) {
      case 'fajr':
        return '#1976d2';
      case 'dhuhr':
        return '#f57c00';
      case 'asr':
        return '#388e3c';
      case 'maghrib':
        return '#d32f2f';
      case 'isha':
        return '#7b1fa2';
      default:
        return 'text.primary';
    }
  };

  const formatPrayerName = (name) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const getCurrentPrayer = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];

    for (let i = prayers.length - 1; i >= 0; i--) {
      const prayerTime = prayers[i].time;
      if (prayerTime) {
        const [hours, minutes] = prayerTime.split(':').map(Number);
        const prayerMinutes = hours * 60 + minutes;
        
        if (currentTime >= prayerMinutes) {
          return prayers[i];
        }
      }
    }
    
    return prayers[prayers.length - 1];
  };

  const getNextPrayer = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];

    for (let i = 0; i < prayers.length; i++) {
      const prayerTime = prayers[i].time;
      if (prayerTime) {
        const [hours, minutes] = prayerTime.split(':').map(Number);
        const prayerMinutes = hours * 60 + minutes;
        
        if (currentTime < prayerMinutes) {
          return prayers[i];
        }
      }
    }
    
    return prayers[0];
  };

  // Format time from JAKIM format (HH:MM:SS) to display format (HH:MM AM/PM)
  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);
      
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return timeString;
    }
  };

  // Smart font size scaling for location names - same as Zone size
  const getLocationFontSize = () => {
    if (isVerySmallMobile) return '0.75rem';  // 12px
    if (isSmallMobile) return '0.8rem';       // 13px
    if (isMobile) return '0.85rem';           // 14px
    return '0.9rem';                          // 14.5px for tablet/desktop
  };

  const currentPrayer = getCurrentPrayer();
  const nextPrayer = getNextPrayer();
  const locationFontSize = getLocationFontSize();

  // Stable responsive grid configuration
  const getGridConfig = () => {
    if (isMobile) return { xs: 6 }; // 2 columns on mobile
    return { xs: 6, sm: 4, md: 2.4 }; // 5 columns on larger screens
  };

  if (loading) {
    return (
      <Card elevation={2} sx={{ 
        mb: 3, 
        borderRadius: 2, 
        mx: 'auto',
        maxWidth: '100%',
        width: '100%'
      }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={isMobile ? 32 : 40} sx={{ mb: 2 }} />
          <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary">
            Loading Prayer Times...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card elevation={2} sx={{ 
        mb: 3, 
        borderRadius: 2, 
        mx: 'auto',
        maxWidth: '100%',
        width: '100%'
      }}>
        <CardContent>
          <Alert 
            severity="error" 
            action={
              <Button color="inherit" size="small" onClick={fetchPrayerTimes}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!prayerTimes) {
    return (
      <Card elevation={2} sx={{ 
        mb: 3, 
        borderRadius: 2, 
        mx: 'auto',
        maxWidth: '100%',
        width: '100%'
      }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant={isMobile ? "body1" : "h6"} color="text.secondary" gutterBottom>
            Prayer Times Not Available
          </Typography>
          <Button 
            variant="contained" 
            onClick={fetchPrayerTimes}
            startIcon={<Refresh />}
            size={isMobile ? "small" : "medium"}
          >
            Load Prayer Times
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2} sx={{ 
      mb: 3, 
      borderRadius: 2, 
      overflow: 'visible',
      mx: 'auto',
      maxWidth: '100%',
      width: '100%',
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <CardContent sx={{ p: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header with Location and Refresh */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
          pb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #1976d2 0%, #0D47A1 100%)',
          color: 'white',
          flexShrink: 0
        }}>
          {/* Improved header layout with proper alignment */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'flex-start' },
            mb: 1, // Reduced margin since font is smaller
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1.5, sm: 1 }
          }}>
            {/* Location Section - Full location name with smaller font */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              flex: 1,
              minWidth: 0
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mb: 0.5, // Reduced margin
                flexWrap: 'wrap',
                gap: 1
              }}>
                {/* Full Location Name with smaller font size */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  flex: 1,
                  minWidth: 0
                }}>
                  <MyLocation sx={{ 
                    fontSize: { 
                      xs: isVerySmallMobile ? 14 : 16, 
                      sm: 18 
                    }, 
                    mr: 1, 
                    opacity: 0.9,
                    flexShrink: 0
                  }} />
                  <Typography 
                    fontWeight="600"
                    sx={{ 
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      // Smaller font size same as Zone
                      fontSize: locationFontSize,
                      // Ensure minimum readable size
                      minHeight: '1.2em'
                    }}
                  >
                    {locationName || 'Loading...'}
                  </Typography>
                </Box>

                {/* Refresh Button */}
                {isMobile ? (
                  <IconButton
                    onClick={handleRefresh}
                    disabled={refreshing}
                    size="small"
                    sx={{
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.3)',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderColor: 'rgba(255,255,255,0.5)'
                      },
                      flexShrink: 0,
                      alignSelf: 'center',
                      width: { xs: 30, sm: 34 },
                      height: { xs: 30, sm: 34 }
                    }}
                  >
                    <Refresh sx={{ 
                      fontSize: isVerySmallMobile ? 14 : 16,
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }} />
                  </IconButton>
                ) : (
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    startIcon={<Refresh />}
                    variant="outlined"
                    size="small" // Smaller button to match smaller text
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      '&:hover': {
                        borderColor: 'rgba(255,255,255,0.5)',
                        backgroundColor: 'rgba(255,255,255,0.1)'
                      },
                      minWidth: 'auto',
                      flexShrink: 0,
                      alignSelf: 'flex-start',
                      fontSize: '0.8rem',
                      py: 0.5
                    }}
                  >
                    {refreshing ? 'Updating...' : 'Refresh'}
                  </Button>
                )}
              </Box>
              
              {/* Zone Chip with same font size as location */}
              <Chip 
                label={`Zone ${zone}`} 
                size="small" 
                variant="outlined"
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  // Same font size as location name
                  fontSize: locationFontSize,
                  height: { xs: 20, sm: 22 },
                  alignSelf: 'flex-start',
                  '& .MuiChip-label': {
                    px: 1,
                    fontSize: 'inherit'
                  }
                }}
              />
            </Box>
          </Box>

          {/* Next Prayer Status with coordinated font size */}
          {nextPrayer && (
            <Box sx={{ mt: 1.5 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9, 
                  fontSize: { 
                    xs: isVerySmallMobile ? '0.7rem' : '0.75rem', 
                    sm: '0.8rem' 
                  } 
                }}
              >
                Next: <strong>{formatPrayerName(nextPrayer.name)}</strong> at {formatTimeForDisplay(nextPrayer.time)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Prayer Times Grid */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <Grid container spacing={isMobile ? 1.5 : 2} sx={{ flex: 1 }}>
            {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((key) => {
              const time = prayerTimes[key];
              if (!time) return null;
              
              const prayerName = formatPrayerName(key);
              const isCurrentPrayer = currentPrayer && currentPrayer.name.toLowerCase() === key.toLowerCase();
              const prayerColor = getPrayerColor(key);
              const gridConfig = getGridConfig();
              
              return (
                <Grid item {...gridConfig} key={key} sx={{ display: 'flex' }}>
                  <Box
                    sx={{
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      textAlign: 'center',
                      border: isCurrentPrayer ? `2px solid ${prayerColor}` : '1px solid',
                      borderColor: isCurrentPrayer ? prayerColor : 'divider',
                      backgroundColor: isCurrentPrayer ? `${prayerColor}10` : 'transparent',
                      transition: 'all 0.2s ease',
                      minHeight: { xs: 90, sm: 110 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: '100%',
                      flex: 1,
                      '&:hover': {
                        backgroundColor: isCurrentPrayer ? `${prayerColor}15` : 'grey.50'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: { xs: 0.5, sm: 1 } }}>
                      {getPrayerIcon(key)}
                    </Box>
                    <Typography 
                      variant={isMobile ? "caption" : "body2"} 
                      fontWeight="600" 
                      color={isCurrentPrayer ? prayerColor : 'text.primary'}
                      gutterBottom
                      sx={{ lineHeight: 1.2, textAlign: 'center' }}
                    >
                      {prayerName}
                    </Typography>
                    <Typography 
                      variant={isMobile ? "body2" : "h6"} 
                      fontWeight="700"
                      color={isCurrentPrayer ? prayerColor : 'text.primary'}
                      sx={{ lineHeight: 1.2, textAlign: 'center' }}
                    >
                      {formatTimeForDisplay(time)}
                    </Typography>
                    {isCurrentPrayer && (
                      <Chip 
                        label="Now" 
                        size="small" 
                        sx={{ 
                          mt: { xs: 0.5, sm: 1 },
                          backgroundColor: prayerColor,
                          color: 'white',
                          fontSize: '0.6rem',
                          height: { xs: 18, sm: 20 },
                          '& .MuiChip-label': {
                            px: 1,
                            fontSize: '0.55rem'
                          }
                        }}
                      />
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {/* Last Updated */}
          {lastUpdated && (
            <Box sx={{ 
              mt: 3, 
              pt: 2, 
              borderTop: '1px solid', 
              borderColor: 'divider',
              flexShrink: 0 
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Last updated: {lastUpdated} | Source: JAKIM e-solat
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default PrayerTimes;