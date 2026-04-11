import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Refresh, CompassCalibration } from '@mui/icons-material';
import { useCompass } from '../../context/CompassContext';

const SMOOTH = 0.12;
const CIRCLE_SIZE = 150;
const KAABA_OFFSET = 18; // slightly inside circle (Option B)

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

  // ✅ Correct arrow rotation
  const arrowAngle = ((qiblaDirection - deviceHeading) + 360) % 360;

  // ✅ Smooth transitions
  useEffect(() => {
    setSmoothAngle(prev => prev + (arrowAngle - prev) * SMOOTH);
  }, [arrowAngle]);

  // ✅ Auto‑start compass
  useEffect(() => {
    if (!compassActive) startCompass();
  }, [compassActive, startCompass]);

  // ✅ Kaaba position on circle rim
  const kaabaRad = (qiblaDirection - 90) * (Math.PI / 180); 
  // subtract 90° so 0° starts at North visually

  const radius = CIRCLE_SIZE / 2 - KAABA_OFFSET;
  const kaabaX = (CIRCLE_SIZE / 2) + radius * Math.cos(kaabaRad);
  const kaabaY = (CIRCLE_SIZE / 2) + radius * Math.sin(kaabaRad);

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

      {/* ✅ Compass circle */}
      <Box
        sx={{
          position: 'relative',
          width: CIRCLE_SIZE,
          height: CIRCLE_SIZE,
          mx: 'auto',
          borderRadius: '50%',
          border: '2px solid #DFDFDF',
          background: '#FAFAFA'
        }}
      >
        {/* ✅ Kaaba placed at correct spherical Qibla direction */}
        <Box
          sx={{
            position: 'absolute',
            top: kaabaY - 14,
            left: kaabaX - 14,
            fontSize: '1.5rem',
            transition: 'top 0.2s, left 0.2s'
          }}
        >
          🕋
        </Box>

        {/* ✅ Arrow that rotates toward Kaaba */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 4,
            height: radius - 10,
            backgroundColor: '#0D9488',
            transform: `translate(-50%, -100%) rotate(${smoothAngle}deg)`,
            transformOrigin: '50% 100%'
          }}
        >
          {/* Arrowhead */}
          <Box
            sx={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderBottom: '14px solid #0D9488'
            }}
          />
        </Box>

        {/* ✅ Center dot */}
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

      <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
        Turn {arrowAngle.toFixed(0)}°
      </Typography>

      {/* ✅ Buttons */}
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

      {compassError && (
        <Typography color="error" fontSize="0.8rem" mt={1}>
          {compassError}
        </Typography>
      )}
    </Box>
  );
};

export default PrayerCompassInline;
