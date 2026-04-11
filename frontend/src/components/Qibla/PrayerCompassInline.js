import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh, CompassCalibration } from '@mui/icons-material';
import { useCompass } from '../../context/CompassContext';

// Smooth motion factor
const SMOOTHING = 0.15;
const ALIGN_THRESHOLD = 5;

const PrayerCompassInline = () => {
  const {
    qiblaDirection,
    deviceHeading,
    compassActive,
    compassError,
    setUserLocationAndCalculateQibla,
    startCompass,
    stopCompass,
    getQiblaAngle
  } = useCompass();

  const [smoothed, setSmoothed] = useState(0);
  const vibrateRef = useRef(0);

  // Auto-start compass for better UX
  useEffect(() => {
    if (!compassActive) startCompass();
  }, [compassActive, startCompass]);

  const angle = getQiblaAngle(); // Qibla - heading
  const isAligned = Math.abs(angle) <= ALIGN_THRESHOLD;

  // Smooth rotation
  useEffect(() => {
    setSmoothed(prev => prev + (angle - prev) * SMOOTHING);
  }, [angle]);

  // Gentle vibration on alignment
  useEffect(() => {
    if (!navigator.vibrate) return;
    if (!isAligned) return;

    const now = Date.now();
    if (now - vibrateRef.current > 2500) {
      navigator.vibrate(15);
      vibrateRef.current = now;
    }
  }, [isAligned]);

  const refreshLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos =>
        setUserLocationAndCalculateQibla(
          pos.coords.latitude,
          pos.coords.longitude
        ),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: 'white',
        maxWidth: 240,
        mx: 'auto'
      }}
    >
      <Typography variant="h6" fontWeight={600} textAlign="center" mb={2}>
        🧭 Qibla Direction
      </Typography>

      {compassError && (
        <Typography variant="body2" color="error" mb={1}>
          {compassError}
        </Typography>
      )}

      {/* Compass ring */}
      <Box
        sx={{
          position: 'relative',
          width: 130,
          height: 130,
          mx: 'auto',
          borderRadius: '50%',
          border: '2px solid #E5E7EB',
          background: '#FAFAFA',
          mb: 1
        }}
      >
        {/* Ticks */}
        {[0, 90, 180, 270].map(deg => (
          <Box
            key={deg}
            sx={{
              position: 'absolute',
              width: 2,
              height: 10,
              backgroundColor: '#9CA3AF',
              top: 0,
              left: '50%',
              transform: `rotate(${deg}deg) translate(-50%, 0)`
            }}
          />
        ))}

        {/* Arrow shaft */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 3,
            height: 55,
            backgroundColor: isAligned ? '#22C55E' : '#0D9488',
            transform: `translate(-50%, -50%) rotate(${smoothed}deg)`,
            transformOrigin: 'center center',
            transition: 'background-color 0.25s'
          }}
        />

        {/* ✅ REAL Kaaba icon (not pseudo-element) */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -68px) rotate(${smoothed}deg)`,
            transformOrigin: 'center center',
            fontSize: '1.2rem'
          }}
        >
          🕋
        </Box>

        {/* Center dot */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 10,
            height: 10,
            backgroundColor: '#DC2626',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </Box>

      {/* Alignment text */}
      <Typography
        variant="caption"
        display="block"
        textAlign="center"
        color={isAligned ? 'success.main' : 'text.secondary'}
        mb={1}
      >
        {isAligned
          ? 'Aligned with Qibla ✅'
          : `Turn ${angle.toFixed(0)}°`}
      </Typography>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button size="small" variant="outlined" onClick={refreshLocation}>
          <Refresh fontSize="small" />
        </Button>
        <Button
          size="small"
          variant={compassActive ? 'outlined' : 'contained'}
          onClick={compassActive ? stopCompass : startCompass}
        >
          <CompassCalibration fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
};

export default PrayerCompassInline;
