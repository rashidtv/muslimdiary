import React from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button
} from '@mui/material';
import { Close, Refresh, CompassCalibration } from '@mui/icons-material';
import { useCompass } from '../../context/CompassContext';

const QiblaModal = ({ open, onClose }) => {
  const {
    qiblaDirection,
    userLocation,
    compassActive,
    setUserLocationAndCalculateQibla,
    startCompass,
    stopCompass,
    getQiblaAngle
  } = useCompass();

  const angle = getQiblaAngle();

  // ✅ Request sensor permission (iOS Safari fix)
  const requestPermission = async () => {
    if (
      window.DeviceOrientationEvent &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      const res = await DeviceOrientationEvent.requestPermission().catch(() => null);
      return res === 'granted';
    }
    return true;
  };

  // ✅ START MUST ALSO RECALCULATE QIBLA
  const handleStart = async () => {
    const ok = await requestPermission();
    if (!ok) return;

    if (!userLocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocationAndCalculateQibla(
            pos.coords.latitude,
            pos.coords.longitude
          );
          startCompass();
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      // ✅ Force recalculation even if location exists
      setUserLocationAndCalculateQibla(
        userLocation.latitude,
        userLocation.longitude
      );
      startCompass();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: { borderRadius: 3, p: 2 }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography fontWeight={600}>🧭 Qibla Direction</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Box>

      {/* Compass */}
      <Box
        sx={{
          width: 140,
          height: 140,
          mx: 'auto',
          my: 2,
          borderRadius: '50%',
          border: '2px solid #E5E7EB',
          background: '#FAFAFA',
          position: 'relative'
        }}
      >
        {/* North */}
        <Typography
          sx={{
            position: 'absolute',
            top: 6,
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 700,
            fontSize: '0.75rem',
            color: '#D32F2F'
          }}
        >
          N
        </Typography>

        {/* Arrow */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 2,
            height: 55,
            backgroundColor: '#0D9488',
            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
            transformOrigin: 'center center',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '10px solid #0D9488'
            }
          }}
        />

        {/* Center */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 12,
            height: 12,
            backgroundColor: '#D32F2F',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            border: '2px solid white'
          }}
        />
      </Box>

      {/* Angle */}
      <Typography variant="body2" textAlign="center" sx={{ mb: 2 }}>
        Qibla: {(qiblaDirection || 0).toFixed(0)}°
      </Typography>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleStart}
        >
          Refresh
        </Button>

        <Button
          variant={compassActive ? "outlined" : "contained"}
          startIcon={<CompassCalibration />}
          onClick={compassActive ? stopCompass : handleStart}
        >
          {compassActive ? "Stop" : "Start"}
        </Button>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
        sx={{ mt: 2, display: 'block' }}
      >
        Hold phone flat and rotate until arrow points upward.
      </Typography>
    </Dialog>
  );
};

export default QiblaModal;
