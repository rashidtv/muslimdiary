import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Refresh, MyLocation } from "@mui/icons-material";
import { useCompass } from "../../context/CompassContext";

const QiblaStaticDirection = () => {
  const {
    qiblaDirection,
    compassError,
    setUserLocationAndCalculateQibla
  } = useCompass();

  const [locationLabel, setLocationLabel] = useState("");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocationAndCalculateQibla(latitude, longitude);
        setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      () => setLocationLabel("Location unavailable"),
      { enableHighAccuracy: true }
    );
  }, []);

  const refreshLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocationAndCalculateQibla(latitude, longitude);
        setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  // ✅ Convert Qibla angle to direction text
  const getLabel = (deg) => {
    if (deg == null) return "";
    const labels = [
      "North", "North‑East", "East", "South‑East",
      "South", "South‑West", "West", "North‑West"
    ];
    return labels[Math.round(deg / 45) % 8];
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
      <Typography variant="h6" fontWeight={700}>🧭 Qibla Direction</Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        <MyLocation sx={{ fontSize: 16, mr: 0.5 }} />
        {locationLabel}
      </Typography>

      {qiblaDirection !== null && (
        <>
          {/* ✅ ROTATE THE ARROW SVG EXACTLY TO QIBLA DIRECTION */}
          <Box
            component="img"
            src="/qibla-arrow.svg"
            alt="Qibla Arrow"
            sx={{
              width: 80,
              height: 80,
              mt: 2,
              transform: `rotate(${qiblaDirection}deg)`,
              transition: "0.2s ease"
            }}
          />

          <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ mt: 1 }}>
            {qiblaDirection.toFixed(0)}°
          </Typography>

          <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
            {getLabel(qiblaDirection)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Face your body toward the arrow direction.
          </Typography>
        </>
      )}

      <Button
        variant="outlined"
        sx={{ mt: 3 }}
        startIcon={<Refresh />}
        onClick={refreshLocation}
      >
        Refresh Location
      </Button>

      {compassError && (
        <Typography color="error" sx={{ mt: 2 }}>
          {compassError}
        </Typography>
      )}
    </Box>
  );
};

export default QiblaStaticDirection;
