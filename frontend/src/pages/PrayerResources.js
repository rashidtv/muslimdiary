import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Refresh,
  Navigation,
  MyLocation,
  CompassCalibration
} from '@mui/icons-material';
import { useCompass } from '../context/CompassContext';

const PrayerResources = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationName, setLocationName] = useState('');

  const {
    qiblaDirection,
    deviceHeading,
    compassActive,
    userLocation,
    compassError,
    setUserLocationAndCalculateQibla,
    startCompass,
    stopCompass,
    getQiblaAngle
  } = useCompass();

  // Use production backend URL
  const API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000' 
    : 'https://muslimdiarybackend.onrender.com';

  useEffect(() => {
    if (!userLocation) {
      getLocation();
    } else if (!locationName) {
      getLocationName(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation]);

  // Intelligent location name cleaning
  const getCleanLocationName = (address) => {
    const administrativeTerms = [
      'municipal', 'council', 'majlis', 'daerah', 'district', 
      'administrative', 'perbandaran', 'bandaran', 'city council',
      'municipality', 'county', 'authority', 'jabatan'
    ];

    let city = '';
    let state = address.state || '';

    // Function to check if text contains administrative terms
    const hasAdministrativeTerm = (text) => {
      if (!text) return false;
      return administrativeTerms.some(term => 
        text.toLowerCase().includes(term.toLowerCase())
      );
    };

    // Function to extract clean city name from text
    const extractCleanCityName = (text) => {
      if (!text) return '';
      
      let cleanText = text;
      
      // Remove administrative terms
      administrativeTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        cleanText = cleanText.replace(regex, '');
      });
      
      // Remove extra spaces, commas, and special characters
      cleanText = cleanText.replace(/[,\s]+/g, ' ').trim();
      
      return cleanText || text;
    };

    // Priority order for city names with intelligent cleaning
    const cityFields = ['city', 'town', 'village', 'municipality', 'suburb', 'county'];
    
    for (const field of cityFields) {
      if (address[field]) {
        const rawName = address[field];
        
        // If it doesn't contain administrative terms, use it directly
        if (!hasAdministrativeTerm(rawName)) {
          city = rawName;
          break;
        } else {
          // If it has administrative terms, try to extract clean name
          const cleanName = extractCleanCityName(rawName);
          if (cleanName && cleanName.length > 2) {
            city = cleanName;
            break;
          }
        }
      }
    }

    // Final cleanup of city name
    if (city) {
      // Remove any remaining administrative terms
      city = city.replace(/\b(council|municipal|daerah|district|perbandaran)\b/gi, '').trim();
      // Remove double spaces and trailing commas
      city = city.replace(/\s+/g, ' ').replace(/,\s*$/, '').trim();
    }

    // Return formatted location
    if (city && state && city !== state) {
      return `${city}, ${state}`;
    } else if (city) {
      return city;
    } else if (state) {
      return state;
    }

    return 'Your Location';
  };

  const getLocationName = async (latitude, longitude) => {
    try {
      console.log('📍 Getting location via proxy:', latitude, longitude);
      
      // Use backend proxy with correct production URL
      const response = await fetch(
        `${API_BASE}/api/nominatim-proxy?lat=${latitude}&lon=${longitude}&format=json&zoom=10&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location name from proxy');
      }
      
      const data = await response.json();
      
      if (data && data.address) {
        const address = data.address;
        
        // Get intelligently cleaned location name
        const cleanName = getCleanLocationName(address);
        setLocationName(cleanName);
        
        // Store for Prayer Times to use
        const locationData = {
          cleanName,
          rawAddress: address,
          timestamp: new Date().toISOString(),
          coordinates: { latitude, longitude }
        };
        
        localStorage.setItem('userLocationData', JSON.stringify(locationData));
        localStorage.setItem('userLocationName', cleanName);
        
        console.log('📍 Location found:', cleanName);
        
      } else {
        const fallbackName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setLocationName(fallbackName);
        localStorage.setItem('userLocationName', fallbackName);
      }
    } catch (error) {
      console.log('Error getting location name:', error);
      const fallbackName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      setLocationName(fallbackName);
      localStorage.setItem('userLocationName', fallbackName);
    }
  };

  const getLocation = () => {
    setLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocationAndCalculateQibla(latitude, longitude);
        getLocationName(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setError('Unable to get your location');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const currentAngle = getQiblaAngle();

  return (
    <Container maxWidth="sm" sx={{ py: 2, px: { xs: 1, sm: 2 } }}>
      <Card 
        elevation={1}
        sx={{
          background: 'white',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <CardContent sx={{ textAlign: 'center', p: 3 }}>
          
          {/* Simple Header */}
          <Box sx={{ mb: 3 }}>
            <Typography 
              variant="h5" 
              fontWeight="600" 
              color="primary.main"
              gutterBottom
            >
              Qibla Compass
            </Typography>
            <Chip 
              icon={<Navigation />}
              label={compassActive ? "ACTIVE" : "READY"} 
              color={compassActive ? "success" : "default"}
              variant="outlined"
              size="small"
            />
          </Box>

          {/* Error Messages */}
          {(error || compassError) && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3, borderRadius: 1 }}
            >
              {error || compassError}
            </Alert>
          )}

          {/* Location Display */}
          {userLocation && (
            <Box sx={{ 
              mb: 3, 
              p: 2, 
              borderRadius: 2,
              backgroundColor: 'grey.50',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <MyLocation sx={{ fontSize: 18, color: 'primary.main', mr: 1 }} />
                <Typography variant="body1" color="primary.main" fontWeight="500">
                  Your Location
                </Typography>
              </Box>
              
              <Typography variant="body1" gutterBottom>
                {locationName || 'Getting location...'}
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                Qibla Direction: <strong>{qiblaDirection}°</strong>
              </Typography>
            </Box>
          )}

          {/* Clean Compass Design */}
          <Box sx={{ 
            position: 'relative', 
            width: 250, 
            height: 250, 
            margin: '0 auto 24px auto',
            borderRadius: '50%',
            border: '2px solid',
            borderColor: 'grey.300',
            backgroundColor: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            
            {/* Cardinal Directions - Adjusted spacing */}
            <Typography variant="h6" fontWeight="bold" sx={{ 
              position: 'absolute', 
              top: 20,
              left: '50%', 
              transform: 'translateX(-50%)', 
              color: '#d32f2f'
            }}>
              N
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ 
              position: 'absolute', 
              top: '50%', 
              right: 20,
              transform: 'translateY(-50%)', 
              color: 'primary.main'
            }}>
              E
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ 
              position: 'absolute', 
              bottom: 20,
              left: '50%', 
              transform: 'translateX(-50%)', 
              color: 'success.main'
            }}>
              S
            </Typography>
            <Typography variant="body1" fontWeight="bold" sx={{ 
              position: 'absolute', 
              top: '50%', 
              left: 20,
              transform: 'translateY(-50%)', 
              color: 'warning.main'
            }}>
              W
            </Typography>

            {/* Qibla Arrow */}
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 3,
              height: 100,
              backgroundColor: '#1976d2',
              transform: `translate(-50%, -50%) rotate(${currentAngle}deg)`,
              transformOrigin: 'center center',
              zIndex: 2,
              borderRadius: '1px',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '10px solid #1976d2'
              }
            }} />

            {/* Center Dot */}
            <Box sx={{
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              width: 16, 
              height: 16,
              backgroundColor: '#d32f2f', 
              borderRadius: '50%', 
              transform: 'translate(-50%, -50%)',
              border: '2px solid white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              zIndex: 3
            }} />

            {/* Current Angle Display */}
            {compassActive && (
              <Box sx={{
                position: 'absolute',
                bottom: 40,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'primary.main',
                color: 'white',
                padding: '4px 12px',
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: '500',
                whiteSpace: 'nowrap'
              }}>
                {currentAngle.toFixed(0)}° to Mecca
              </Box>
            )}
          </Box>

          {/* Current Heading Display */}
          {compassActive && (
            <Box sx={{ 
              textAlign: 'center',
              mb: 2,
              p: 1.5,
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: 1
            }}>
              <Typography variant="body2" fontWeight="500">
                Current Device Heading: {deviceHeading.toFixed(0)}°
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>
                Rotate until arrow points to 0° to face Mecca
              </Typography>
            </Box>
          )}

          {/* Simple Controls */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            mb: 2
          }}>
            <Button 
              startIcon={<Refresh />} 
              onClick={getLocation}
              variant="outlined"
              disabled={loading}
              size="medium"
            >
              {loading ? <CircularProgress size={20} /> : 'Refresh'}
            </Button>
            
            <Button 
              startIcon={<CompassCalibration />} 
              onClick={compassActive ? stopCompass : startCompass}
              variant={compassActive ? "outlined" : "contained"}
              color={compassActive ? "secondary" : "primary"}
              size="medium"
            >
              {compassActive ? 'Stop' : 'Start Compass'}
            </Button>
          </Box>

          {/* Simple Instructions */}
          <Typography variant="body2" color="text.secondary" textAlign="center">
            {!compassActive 
              ? 'Click "Start Compass" to begin. Allow permissions if prompted.'
              : 'The blue arrow points to Mecca. Rotate your device until it points to 0°.'
            }
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PrayerResources;