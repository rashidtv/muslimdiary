import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
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
    getQiblaAngle
  } = useCompass();

  const currentAngle = getQiblaAngle();

  const fetchLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocationAndCalculateQibla(latitude, longitude);
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
      }}
    >
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
        🧭 Qibla Direction
      </Typography>

      {compassError && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {compassError}
        </Typography>
      )}

      {/* Location */}
      {userLocation && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <MyLocation sx={{ fontSize: 16, mr: 0.5 }} />
          {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
        </Typography>
      )}

      {/* Compass UI */}
      <Box
        sx={{
          position: "relative",
          width: 200,
          height: 200,
          mx: "auto",
          borderRadius: "50%",
          border: "2px solid #E5E7EB",
          background: "#FAFAFA",
          mb: 2,
        }}
      >
        {/* N */}
        <Typography
          sx={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            fontWeight: "bold",
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
            width: 3,
            height: 80,
            backgroundColor: "#0D9488",
            transform: `translate(-50%, -50%) rotate(${currentAngle}deg)`,
            transformOrigin: "center center",
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              left: "50%",
              width: 0,
              height: 0,
              transform: "translateX(-50%)",
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "12px solid #0D9488",
            },
          }}
        />

        {/* Center Dot */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 14,
            height: 14,
            backgroundColor: "#D32F2F",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            border: "2px solid white",
          }}
        />
      </Box>

      {/* Info */}
      <Typography variant="body2" textAlign="center" sx={{ mb: 2 }}>
        Qibla: {qiblaDirection?.toFixed(0)}°
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
          startIcon={<CompassCalibration />}
          onClick={compassActive ? stopCompass : startCompass}
        >
          {compassActive ? "Stop" : "Start"}
        </Button>
      </Box>
    </Box>
  );
};

export default PrayerCompassInline;
