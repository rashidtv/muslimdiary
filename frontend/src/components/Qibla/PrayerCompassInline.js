import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh, CompassCalibration } from '@mui/icons-material';
import { useCompass } from '../../context/CompassContext';

const SMOOTH = 0.15;
const ALIGN_THRESHOLD = 4;

const PrayerCompassInline = () => {
  const {
    qiblaDirection,
    deviceHeading,
    compassActive,
    compassError,
    setUserLocationAndCalculateQibla,
    startCompass,
    stopCompass
  } = useCompass();

  const [smoothAngle, setSmoothAngle] = useState(0);
  const vibrateRef = useRef(0);

  // ✅ Compute correct pointing angle
  const rawAngle =
    (qiblaDirection - deviceHeading + 360) % 360;

  // Smooth arrow motion
  useEffect(() => {
    setSmoothAngle(prev => prev + (rawAngle - prev) * SMOOTH);
  }, [rawAngle]);

  // Auto start compass
  useEffect(() => {
    if (!compassActive) startCompass();
  }, [compassActive, startCompass]);

  const isAligned = Math.abs(rawAngle) <= ALIGN_THRESHOLD;

  // ✅ Gentle vibration on alignment
  useEffect(() => {
    if (!navigator.vibrate) return;
    if (!isAligned) return;

    const now = Date.now();
    if (now - vibrateRef.current > 2500) {
      navigator.vibrate(20);
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
        maxWidth: 230,
        mx: 'auto'
      }}
    >
      <Typography
        variant="h6"
        fontWeight={600}
        textAlign="center"
        mb={2}
      >
        🧭 Qibla Direction
      </Typography>

      {compassError && (
        <Typography color="error" fontSize="0.8rem" mb={1}>
          {compassError}
        </Typography>
      )}

      {/* ✅ Compass ring */}
      <Box
        sx={{
          position: 'relative',
          width: 130,
          height: 130,
          mx: 'auto',
          borderRadius: '50%',
          border: '2px solid #E5E7EB',
          background: '#FAFAFA',
        }}
      >
        {/* ✅ Tick marks */}
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

        {/* ✅ ARROW — rotates independently */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 3,
            height: 55,
            backgroundColor: isAligned ? '#22C55E' : '#0D9488',
            transform: `translate(-50%, -50%) rotate(${smoothAngle}deg)`,
            transformOrigin: 'center bottom',
            transition: 'background-color 0.2s'
          }}
        >
          {/* ✅ Arrow HEAD — separate so it stays upright */}
          <Box
            sx={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderBottom: `10px solid ${isAligned ? '#22C55E' : '#0D9488'}`,
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          />
        </Box>

        {/* ✅ Kaaba icon — FIXED, NOT ROTATING */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '1rem'
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

      {/* ✅ Status label */}
      <Typography
        variant="caption"
        textAlign="center"
        display="block"
        mt={1}
        mb={2}
        color={isAligned ? 'success.main' : 'text.secondary'}
      >
        {isAligned
          ? 'Aligned with Qibla ✅'
          : `Turn ${rawAngle.toFixed(0)}°`}
      </Typography>

      {/* ✅ Buttons */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
        <Button
          size="small"
          variant="outlined"
          onClick={refreshLocation}
        >
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
