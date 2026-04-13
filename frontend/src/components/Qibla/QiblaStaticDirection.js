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
      { enableHighAccuracy: true, timeout: 10000 }
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

  // Determine compass label (N, NE, E, SE, etc.)
  const getDirectionLabel = (deg) => {
    if (deg == null) return "";
    const dirs = ["North", "North‑East", "East", "South‑East", "South", "South‑West", "West", "North‑West"];
    return dirs[Math.round(deg / 45) % 8];
  };

  // Choose arrow emoji for direction
  const getDirectionArrow = (deg) => {
    if (deg == null) return "⬆️";
    const arrows = ["⬆️","↗️","➡️","↘️","⬇️","↙️","⬅️","↖️"];
    return arrows[Math.round(deg / 45) % 8];
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
      <Typography variant="h6" fontWeight={700}>
        🧭 Qibla Direction
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        <MyLocation sx={{ fontSize: 15, mr: 0.5 }} />
        {locationLabel}
      </Typography>

      {qiblaDirection !== null && (
        <>
          <Typography variant="h3" fontWeight={700} color="primary.main" sx={{ mt: 2 }}>
            {getDirectionArrow(qiblaDirection)}
          </Typography>

          <Typography variant="h4" fontWeight={700} color="primary.main">
            {qiblaDirection.toFixed(0)}°
          </Typography>

          <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
            {getDirectionLabel(qiblaDirection)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Face your body toward the direction shown above.
          </Typography>
        </>
      )}

      {compassError && (
        <Typography color="error" fontSize="0.8rem" sx={{ mt: 2 }}>
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
