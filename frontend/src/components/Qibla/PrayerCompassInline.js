import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Refresh, CompassCalibration } from "@mui/icons-material";
import { useCompass } from "../../context/CompassContext";

const SIZE = 150;
const OFFSET = 20;
const SMOOTH = 0.12;

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

  const arrowAngle = ((qiblaDirection - deviceHeading) + 360) % 360;

  useEffect(() => {
    setSmoothAngle(prev => prev + (arrowAngle - prev) * SMOOTH);
  }, [arrowAngle]);

  useEffect(() => {
    if (!compassActive) startCompass();
  }, [compassActive, startCompass]);

  // Kaaba position (true bearing)
  const rad = (qiblaDirection - 90) * (Math.PI / 180);
  const center = SIZE / 2;
  const radius = center - OFFSET;

  const kaabaX = center + radius * Math.cos(rad);
  const kaabaY = center + radius * Math.sin(rad);

  const refreshLocation = () => {
    navigator.geolocation.getCurrentPosition(
      pos =>
        setUserLocationAndCalculateQibla(
          pos.coords.latitude,
          pos.coords.longitude
        ),
      () => {},
      { enableHighAccuracy: true }
    );
  };

  return (
    <Box sx={{ p: 3, borderRadius: 4, border: "1px solid #E5E7EB", textAlign: "center" }}>
      <Typography fontWeight={600} mb={2}>🧭 Qibla Direction</Typography>

      <Box
        sx={{
          position: "relative",
          width: SIZE,
          height: SIZE,
          mx: "auto",
          borderRadius: "50%",
          border: "2px solid #D1D5DB",
          background: "#FAFAFA"
        }}
      >
        {/* Kaaba */}
        <Box sx={{ position: "absolute", top: kaabaY - 14, left: kaabaX - 14, fontSize: "1.6rem" }}>
          🕋
        </Box>

        {/* Arrow */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 4,
            height: radius - 5,
            backgroundColor: "#0D9488",
            transform: `translate(-50%, -100%) rotate(${smoothAngle}deg)`,
            transformOrigin: "50% 100%"
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: -14,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderBottom: "14px solid #0D9488"
            }}
          />
        </Box>

        {/* Center dot */}
        <Box sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 10,
          height: 10,
          background: "#DC2626",
          borderRadius: "50%",
          transform: "translate(-50%, -50%)"
        }} />
      </Box>

      <Typography variant="caption" mt={2} display="block">
        Turn {arrowAngle.toFixed(0)}°
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2 }}>
        <Button size="small" variant="outlined" onClick={refreshLocation}>
          <Refresh fontSize="small" />
        </Button>
        <Button size="small" variant={compassActive ? "outlined" : "contained"} onClick={compassActive ? stopCompass : startCompass}>
          <CompassCalibration fontSize="small" />
        </Button>
      </Box>

      {compassError && <Typography color="error" fontSize="0.8rem">{compassError}</Typography>}
    </Box>
  );
};

export default PrayerCompassInline;
