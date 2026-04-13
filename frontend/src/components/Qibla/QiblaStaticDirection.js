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
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        setUserLocationAndCalculateQibla(lat, lon);
        setLocationLabel(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      },
      () => setLocationLabel("Location unavailable"),
      {
        enableHighAccuracy: true,
        timeout: 10000
      }
    );
  }, [setUserLocationAndCalculateQibla]);

  const refreshLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        setUserLocationAndCalculateQibla(lat, lon);
        setLocationLabel(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      },
      () => {},
      { enableHighAccuracy: true }
    );
  };

  // ✅ Convert angle to compass text (NE/NW/etc)
  const getDirectionLabel = (deg) => {
    if (deg === null) return "";
    const dirs = ["North", "North‑East", "East", "South‑East", "South", "South‑West", "West", "North‑West"];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <Box
      sx={{
        p: 3,
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        background: "white",
        textAlign: "center"
      }}
    >
      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
        🧭 Qibla Direction
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        <MyLocation sx={{ fontSize: 16, mr: 0.5 }} />
        {locationLabel}
      </Typography>

      {qiblaDirection !== null && (
        <>
          <Typography variant="h4" fontWeight={700} color="primary.main">
            {qiblaDirection.toFixed(0)}°
          </Typography>

          <Typography variant="body1" sx={{ mt: 1 }}>
            {getDirectionLabel(qiblaDirection)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Face your body toward the direction above.
          </Typography>
        </>
      )}

      {compassError && (
        <Typography variant="body2" color="error" sx={{ mt: 2 }}>
          {compassError}
        </Typography>
      )}

      <Button
        variant="outlined"
        sx={{ mt: 3 }}
        startIcon={<Refresh />}
        onClick={refreshLocation}
      >
        Refresh Location
      </Button>
    </Box>
  );
};

export default QiblaStaticDirection;
