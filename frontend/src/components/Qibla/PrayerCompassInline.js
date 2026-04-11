import React, { useEffect, useRef, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Refresh, CompassCalibration } from "@mui/icons-material";
import { useCompass } from "../../context/CompassContext";

const COMPASS_SIZE = 150;      
const KAABA_OFFSET = 20;        
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

  /* ✅ TRUE ARROW ROTATION */
  const arrowAngle = ((qiblaDirection - deviceHeading) + 360) % 360;

  /* ✅ Smooth motion */
  useEffect(() => {
    setSmoothAngle(prev => prev + (arrowAngle - prev) * SMOOTH);
  }, [arrowAngle]);

  /* ✅ Auto start compass */
  useEffect(() => {
    if (!compassActive) startCompass();
  }, [compassActive, startCompass]);

  /* ✅ Calculate Kaaba icon position */
  const rad = (qiblaDirection - 90) * (Math.PI / 180);
  const center = COMPASS_SIZE / 2;
  const radius = center - KAABA_OFFSET;

  const kaabaX = center + radius * Math.cos(rad);
  const kaabaY = center + radius * Math.sin(rad);

  const refreshGPS = () => {
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocationAndCalculateQibla(
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
        border: "1px solid #E5E7EB",
        background: "white",
        textAlign: "center"
      }}
    >
      <Typography fontWeight={600} sx={{ mb: 2 }}>
        🧭 Qibla Direction
      </Typography>

      <Box
        sx={{
          position: "relative",
          width: COMPASS_SIZE,
          height: COMPASS_SIZE,
          mx: "auto",
          borderRadius: "50%",
          border: "2px solid #D1D5DB",
          background: "#FAFAFA"
        }}
      >
        {/* ✅ Kaaba icon placed at true Qibla angle */}
        <Box
          sx={{
            position: "absolute",
            top: kaabaY - 14,
            left: kaabaX - 14,
            fontSize: "1.6rem",
            transition: "top 0.15s, left 0.15s"
          }}
        >
          🕋
        </Box>

        {/* ✅ Arrow that points to Kaaba */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 4,
            height: radius - 5,
            backgroundColor: "#0D9488",
            transform: `translate(-50%, -100%) rotate(${smoothAngle}deg)`,
            transformOrigin: "50% 100%",
          }}
        >
          {/* ✅ Arrowhead attached */}
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

        {/* ✅ Center red dot */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 10,
            height: 10,
            background: "#DC2626",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)"
          }}
        />
      </Box>

      <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
        Turn {arrowAngle.toFixed(0)}°
      </Typography>

      <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 2 }}>
        <Button variant="outlined" size="small" onClick={refreshGPS}>
          <Refresh fontSize="small" />
        </Button>
        <Button
          variant={compassActive ? "outlined" : "contained"}
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
