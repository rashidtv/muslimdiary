import React, { useMemo } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Button,
  Chip
} from '@mui/material';
import {
  Close,
  Refresh,
  CompassCalibration,
  CheckCircle
} from '@mui/icons-material';
import { useCompass } from '../../context/CompassContext';

const ALIGNMENT_THRESHOLD = 5; // degrees

const QiblaModal = ({ open, onClose }) => {
  const {
    qiblaDirection,
    deviceHeading,
    compassActive,
    userLocation,
    setUserLocationAndCalculateQibla,
    startCompass,
    stopCompass,
    getQiblaAngle
  } = useCompass();

  // Angle for arrow rotation
  const angle = getQiblaAngle();

  // ✅ Calculate alignment status
  const isAligned = useMemo(() => {
    if (
      deviceHeading === null ||
      qiblaDirection === null ||
      Number.isNaN(deviceHeading) ||
      Number.isNaN(qiblaDirection)
    ) {
      return false;
    }

    let diff = Math.abs(deviceHeading - qiblaDirection);
    if (diff > 180) diff = 360 - diff;

    return diff <= ALIGNMENT_THRESHOLD;
  }, [deviceHeading, qiblaDirection]);

  // ✅ iOS permission handling
  const requestPermission = async () => {
    if (
      window.DeviceOrientationEvent &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const res = await DeviceOrientationEvent.requestPermission();
        return res === 'granted';
      } catch {
        return false;
      }
    }
    return true;
  };

  // ✅ Start = permission + location + recalculation
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
      setUserLocationAndCalculateQibla(
        userLocation.latitude,
        userLocation.longitude
      );
      startCompass();
    }
  };

  // ✅ Auto‑stop compass when modal closes (battery friendly)
  const handleClose = () => {
    if (compassActive) stopCompass();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 3, p: 2 } }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography fontWeight={600}>🧭 Qibla Direction</Typography>
        <IconButton onClick={handleClose}>
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

        {/* ✅ Smooth rotating arrow */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 2,
            height: 55,
            backgroundColor: isAligned ? '#16A34A' : '#0D9488',
            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.35s ease-out', // ✅ smooth animation
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: isAligned
                ? '10px solid #16A34A'
                : '10px solid #0D9488'
            }
          }}
        />

        {/* Center dot */}
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

      {/* ✅ Alignment Indicator */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        {isAligned ? (
          <Chip
            icon={<CheckCircle />}
            label="Aligned ✅"
            color="success"
            variant="outlined"
          />
        ) : (
          <Typography variant="body2" color="text.secondary">
            Rotate phone to align with Qibla
          </Typography>
        )}
      </Box>

      {/* Angle Info */}
      <Typography variant="body2" textAlign="center" sx={{ mb: 2 }}>
        Qibla: {(qiblaDirection || 0).toFixed(0)}°
        {deviceHeading !== null && (
          <> • Heading: {deviceHeading.toFixed(0)}°</>
        )}
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
          variant={compassActive ? 'outlined' : 'contained'}
          startIcon={<CompassCalibration />}
          onClick={compassActive ? stopCompass : handleStart}
        >
          {compassActive ? 'Stop' : 'Start'}
        </Button>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
        sx={{ mt: 2, display: 'block' }}
      >
        Hold phone flat and rotate slowly until aligned.
      </Typography>
    </Dialog>
  );
};

export default QiblaModal;
