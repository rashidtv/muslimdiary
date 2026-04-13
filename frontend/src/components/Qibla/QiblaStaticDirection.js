import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { MyLocation, Refresh } from "@mui/icons-material";
import { useCompass } from "../../context/CompassContext";

const QiblaStaticDirection = () => {
  const {
    qiblaDirection,
    setUserLocationAndCalculateQibla,
    compassError
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

  const directionLabel = (deg) => {
    if (deg == null) return "";
    const dirs = [
      "North", "North‑East", "East", "South‑East",
      "South", "South‑West", "West", "North‑West"
    ];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <Box sx={{ p: 3, borderRadius: 4, border: "1px solid #E5E7EB", background: "white", textAlign: "center" }}>
      <Typography variant="h6" fontWeight={700}>🧭 Qibla Direction</Typography>

      <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
        <MyLocation sx={{ fontSize: 15 }} /> {locationLabel}
      </Typography>

      {qiblaDirection !== null && (
        <>
          {/* ✅ Rotating Arrow SVG */}
          <Box
            sx={{
              mt: 3,
              width: 80,
              height: 80,
              mx: "auto",
              position: "relative"
            }}
          >
            <Box
              component="img"
              src="/arrow-up.svg"   // ✅ ADD THIS SVG
              alt="Qibla Direction Arrow"
              sx={{
                width: "100%",
                height: "100%",
                transform: `rotate(${qiblaDirection}deg)`
              }}
            />
          </Box>

          <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ mt: 1 }}>
            {qiblaDirection.toFixed(0)}°
          </Typography>

          <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
            {directionLabel(qiblaDirection)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Face your body toward the arrow direction.
          </Typography>
        </>
      )}

      <Button variant="outlined" sx={{ mt: 3 }} startIcon={<Refresh />} onClick={refreshLocation}>
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
