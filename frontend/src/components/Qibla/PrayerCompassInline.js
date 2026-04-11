import React, { useEffect, useRef } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { Refresh, CompassCalibration } from '@mui/icons-material';
import { useCompass } from '../../context/CompassContext';

const ALIGNMENT_THRESHOLD = 3; // degrees
const TILT_THRESHOLD = 35; // degrees (beta/gamma)

const PrayerCompassInline = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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

  const lastVibrateRef = useRef(0);
  const tiltRef = useRef({ beta: 0, gamma: 0 });

  const angle = getQiblaAngle();
  const isAligned = Math.abs(angle) <= ALIGNMENT_THRESHOLD;

  /* --------------------------------------------------
     ✅ Gentle vibration when aligned
     -------------------------------------------------- */
  useEffect(() => {
    if (!isAligned || !navigator.vibrate) return;

    const now = Date.now();
    if (now - lastVibrateRef.current > 3000) {
      navigator.vibrate(20); // gentle haptic
      lastVibrateRef.current = now;
    }
  }, [isAligned]);

  /* --------------------------------------------------
     ✅ Tilt detection (hold phone flat)
     -------------------------------------------------- */
  useEffect(() => {
    const handleOrientation = (e) => {
      tiltRef.current = {
        beta: e.beta || 0,
        gamma: e.gamma || 0
      };
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  const isTilted =
    Math.abs(tiltRef.current.beta) > TILT_THRESHOLD ||
    Math.abs(tiltRef.current.gamma) > TILT_THRESHOLD;

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
        backgroundColor: isDark ? '#111827' : '#FFFFFF'
      }}
    >
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        🧭 Qibla
      </Typography>

      {compassError && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {compassError}
        </Typography>
      )}

      {/* ✅ Compass Ring */}
      <Box
        sx={{
          position: 'relative',
          width: 120,
          height: 120,
          mx: 'auto',
          borderRadius: '50%',
          border: `2px solid ${isDark ? '#374151' : '#E5E7EB'}`,
          background: isDark ? '#020617' : '#FAFAFA',
          mb: 1
        }}
      >
        {/* ✅ Cardinal markers */}
        {['N', 'E', 'S', 'W'].map((d, i) => (
          <Typography
            key={d}
            sx={{
              position: 'absolute',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              color: d === 'N' ? '#DC2626' : isDark ? '#9CA3AF' : '#6B7280',
              ...(i === 0 && { top: 4, left: '50%', transform: 'translateX(-50%)' }),
              ...(i === 1 && { right: 6, top: '50%', transform: 'translateY(-50%)' }),
              ...(i === 2 && { bottom: 4, left: '50%', transform: 'translateX(-50%)' }),
              ...(i === 3 && { left: 6, top: '50%', transform: 'translateY(-50%)' })
            }}
          >
            {d}
          </Typography>
        ))}

        {/* ✅ Qibla Arrow */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 2,
            height: 50,
            backgroundColor: isAligned ? '#22C55E' : '#0D9488',
            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out',
            '&::after': {
              content: '"🕋"',
              position: 'absolute',
              top: -16,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '0.8rem'
            }
          }}
        />

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

      {/* ✅ Status text */}
      <Typography
        variant="caption"
        textAlign="center"
        display="block"
        sx={{ mb: 1, color: isAligned ? '#22C55E' : 'text.secondary' }}
      >
        {isTilted
          ? 'Hold phone flat 🧘'
          : isAligned
          ? 'Aligned with Qibla'
          : `Turn ${angle.toFixed(0)}°`}
      </Typography>

      {/* ✅ Controls */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button size="small" variant="outlined" startIcon={<Refresh />} onClick={fetchLocation}>
          Refresh
        </Button>
        <Button
          size="small"
          variant={compassActive ? 'outlined' : 'contained'}
          startIcon={<CompassCalibration />}
          onClick={compassActive ? stopCompass : startCompass}
        >
          {compassActive ? 'Stop' : 'Start'}
        </Button>
      </Box>
    </Box>
  );
};

export default PrayerCompassInline;
