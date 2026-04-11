import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh, CompassCalibration } from '@mui/icons-material';
import { useCompass } from '../../context/CompassContext';

const SMOOTH = 0.15;

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

  // ✅ Correct angle math
  const rawAngle = ((qiblaDirection - deviceHeading) + 360) % 360;

  useEffect(() => {
    if (!compassActive) startCompass();
  }, [compassActive, startCompass]);

  useEffect(() => {
    setSmoothAngle(prev => prev + (rawAngle - prev) * SMOOTH);
  }, [rawAngle]);

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
        p: 3,
        borderRadius: 4,
        border: '1px solid #E5E7EB',
        background: 'white',
        textAlign: 'center'
      }}
    >
      <Typography fontWeight={600} sx={{ mb: 2 }}>
        🧭 Qibla Direction
      </Typography>

      {/* ✅ Compass Circle */}
      <Box
        sx={{
          position: 'relative',
          width: 150,
          height: 150,
          mx: 'auto',
          borderRadius: '50%',
          border: '2px solid #DFDFDF',
          background: '#FAFAFA'
        }}
      >

        {/* ✅ Kaaba inside circle at TOP center */}
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '1.4rem'
          }}
        >
          🕋
        </Box>

        {/* ✅ Arrow (shaft + head) centered correctly */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 4,
            height: 60,
            transform: `translate(-50%, -100%) rotate(${smoothAngle}deg)`,
            transformOrigin: '50% 100%',
          }}
        >
          {/* Arrow shaft */}
          <Box
            sx={{
              width: '100%',
              height: '100%',
              background: '#0D9488',
              borderRadius: 2
            }}
          />

          {/* ✅ Arrowhead ATTACHED to shaft */}
          <Box
            sx={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '14px solid #0D9488'
            }}
          />
        </Box>

        {/* ✅ Center red dot */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 10,
            height: 10,
            background: '#DC2626',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </Box>

      {/* ✅ Turn hint */}
      <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
        Turn {rawAngle.toFixed(0)}°
      </Typography>

      {/* ✅ Controls */}
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
        <Button variant="outlined" size="small" onClick={refreshLocation}>
          <Refresh fontSize="small" />
        </Button>
        <Button
          variant={compassActive ? 'outlined' : 'contained'}
          size="small"
          onClick={compassActive ? stopCompass : startCompass}
        >
          <CompassCalibration fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
};

export default PrayerCompassInline;
