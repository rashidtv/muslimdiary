import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh, CompassCalibration } from '@mui/icons-material';
import { useCompass } from '../../context/CompassContext';

const ALIGN_THRESHOLD = 5;      // degrees
const SMOOTHING = 0.12;         // lower = smoother

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

  const [smoothedAngle, setSmoothedAngle] = useState(0);
  const lastVibrate = useRef(0);

  const rawAngle = getQiblaAngle();
  const isAligned = Math.abs(rawAngle) <= ALIGN_THRESHOLD;

  /* ✅ Auto‑start compass */
  useEffect(() => {
    if (!compassActive) startCompass();
    // eslint-disable-next-line
  }, []);

  /* ✅ Smooth angle using linear interpolation */
  useEffect(() => {
    setSmoothedAngle(prev =>
      prev + (rawAngle - prev) * SMOOTHING
    );
  }, [rawAngle]);

  /* ✅ Gentle vibration when aligned */
  useEffect(() => {
    if (!isAligned || !navigator.vibrate) return;

    const now = Date.now();
    if (now - lastVibrate.current > 2500) {
      navigator.vibrate(20);
      lastVibrate.current = now;
    }
  }, [isAligned]);

  const fetchLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
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
        backgroundColor: '#fff',
        maxWidth: 220,
        mx: 'auto'
      }}
    >
      <Typography variant="h6" fontWeight={600} textAlign="center" mb={1}>
        🧭 Qibla
      </Typography>

      {compassError && (
        <Typography color="error" variant="body2">
          {compassError}
        </Typography>
      )}

      {/* ✅ Compass */}
      <Box
        sx={{
          position: 'relative',
          width: 120,
          height: 120,
          mx: 'auto',
          borderRadius: '50%',
          border: '2px solid #E5E7EB',
          background: '#FAFAFA',
          mb: 1
        }}
      >
        {/* ✅ Tick marks */}
        {[0, 90, 180, 270].map(deg => (
          <Box
            key={deg}
            sx={{
              position: 'absolute',
              width: 2,
              height: 8,
              backgroundColor: '#9CA3AF',
              top: 0,
              left: '50%',
              transform: `rotate(${deg}deg) translate(-50%, 0)`
            }}
          />
        ))}

        {/* ✅ Arrow */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 2,
            height: 48,
            backgroundColor: isAligned ? '#22C55E' : '#0D9488',
            transform: `translate(-50%, -50%) rotate(${smoothedAngle}deg)`,
            transformOrigin: 'center center',
            transition: 'background-color 0.3s'
          }}
        />

        {/* ✅ Kaaba icon (REAL DOM) */}
        <Box
          sx={{
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.9rem'
          }}
        >
          🕋
        </Box>

        {/* ✅ Center dot */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 8,
            height: 8,
            backgroundColor: '#DC2626',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </Box>

      <Typography
        variant="caption"
        display="block"
        textAlign="center"
        color={isAligned ? 'success.main' : 'text.secondary'}
        mb={1}
      >
        {isAligned ? 'Aligned with Qibla' : `Turn ${rawAngle.toFixed(0)}°`}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button size="small" variant="outlined" onClick={fetchLocation}>
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
