import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Refresh, CompassCalibration } from "@mui/icons-material";
import { useCompass } from "../../context/CompassContext";

const COMPASS_SIZE = 150;
const SMOOTHING = 0.15;

const PrayerCompassInline = () => {
  const {
    compassActive,
    compassError,
    getQiblaAngle,
    setUserLocationAndCalculateQibla,
    startCompass,
    stopCompass
  } = useCompass();

  const angle = getQiblaAngle();
  const [smoothAngle, setSmoothAngle] = useState(0);

  // Smooth motion for arrow
  useEffect(() => {
    setSmoothAngle((prev) => prev + (angle - prev) * SMOOTHING);
  }, [angle]);

  const refreshLocation = () => {
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
        p: 3,
        borderRadius: 4,
        border: "1px solid #E5E7EB",
        background: "#FFFFFF",
        textAlign: "center",
      }}
    >
      <Typography fontWeight={600} sx={{ mb: 2 }}>
        🧭 Qibla Direction
      </Typography>

      {/* Compass Circle */}
      <Box
        sx={{
          position: "relative",
          width: COMPASS_SIZE,
          height: COMPASS_SIZE,
          mx: "auto",
          borderRadius: "50%",
          border: "2px solid #D1D5DB",
          background: "#FAFAFA",
        }}
      >
        {/* Rotating Arrow */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 4,
            height: COMPASS_SIZE / 2 - 25,
            backgroundColor: "#0D9488",
            transform: `translate(-50%, -100%) rotate(${smoothAngle}deg)`,
            transformOrigin: "50% 100%",
          }}
        >
          {/* Arrowhead */}
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
              borderBottom: "14px solid #0D9488",
            }}
          />
        </Box>

        {/* Center Dot */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: "#DC2626",
            transform: "translate(-50%, -50%)",
          }}
        />
      </Box>

      {/* Angle Display */}
      <Typography variant="caption" sx={{ mt: 2, display: "block" }}>
        Turn {angle.toFixed(0)}°
      </Typography>

      {/* Buttons */}
      <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2 }}>
        <Button variant="outlined" size="small" onClick={refreshLocation}>
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

      {/* Errors */}
      {compassError && (
        <Typography color="error" fontSize="0.8rem" sx={{ mt: 1 }}>
          {compassError}
        </Typography>
      )}
    </Box>
  );
};

export default PrayerCompassInline;
