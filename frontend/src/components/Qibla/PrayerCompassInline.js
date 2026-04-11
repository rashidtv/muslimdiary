import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Button
} from '@mui/material';
import { MyLocation, Refresh, CompassCalibration } from '@mui/icons-material';
import { useCompass } from '../../context/CompassContext';

const PrayerCompassInline = () => {
  const {
    qiblaDirection,
    deviceHeading,
    compassActive,
    userLocation,
    compassError,
    setUserLocationAndCalculateQibla,
    startCompass,
    stopCompass,
    getQiblaAngle,
  } = useCompass();

  const currentAngle = getQiblaAngle();

  // ✅ Request permission for device orientation (iOS Safari + Android Chrome)
  const requestSensorPermission = async () => {
    if (window.DeviceOrientationEvent && DeviceOrientationEvent.requestPermission) {
      const permission = await DeviceOrientationEvent.requestPermission().catch(() => null);
      if (permission !== 'granted') return false;
    }
    return true;
  };

  const handleStartCompass = async () => {
    const ok = await requestSensorPermission();
    if (ok) startCompass();
  };

  const fetchLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocationAndCalculateQibla(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        background: "#fff"
      }}
    >
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        🧭 Qibla Direction
      </Typography>

      {userLocation && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          <MyLocation sx={{ fontSize: 14, mr: 0.5 }} />
          {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </Typography>
      )}

      <Box
        sx={{
          width: 150,
          height: 150,
          borderRadius: "50%",
          border: "2px solid #E5E7EB",
          mx: "auto",
          mb: 2,
          background: "#fafafa",
          position: "relative",
        }}
      >
        {/* N marker */}
        <Typography
          sx={{
            position: "absolute",
            top: 6,
            left: "50%",
            transform: "translateX(-50%)",
            fontWeight: 700,
            fontSize: "0.8rem",
            color: "#D32F2F",
          }}
        >
          N
        </Typography>

        {/* Qibla Arrow */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 2,
            height: 60,
            backgroundColor: "#0D9488",
            transform: `translate(-50%, -50%) rotate(${currentAngle}deg)`,
            transformOrigin: "center center",

            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderBottom: "10px solid #0D9488",
            },
          }}
        />

        {/* Center dot */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 12,
            height: 12,
            background: "#d32f2f",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            border: "2px solid white"
          }}
        />
      </Box>

      <Typography variant="body2" sx={{ textAlign: "center", mb: 2 }}>
        Qibla: {(qiblaDirection || 0).toFixed(0)}°
      </Typography>

      {/* Controls */}
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchLocation}
        >
          Refresh
        </Button>

        <Button
          variant={compassActive ? "outlined" : "contained"}
          color="primary"
          startIcon={<CompassCalibration />}
          onClick={compassActive ? stopCompass : handleStartCompass}
        >
          {compassActive ? "Stop" : "Start"}
        </Button>
      </Box>

      {deviceHeading !== null && compassActive && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 1, textAlign: "center", display: "block" }}
        >
          Device Heading: {deviceHeading.toFixed(0)}°
        </Typography>
      )}
    </Box>
  );
};

export default PrayerCompassInline;
