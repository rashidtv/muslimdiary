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
      { enableHighAccuracy: true }
    );
  }, [setUserLocationAndCalculateQibla]);

  // ✅ 16‑point accurate compass arrows
  const arrows16 = [
    "⬆️",      // N
    "⬆️↗️",    // NNE
    "↗️",      // NE
    "➡️↗️",    // ENE
    "➡️",      // E
    "↘️➡️",    // ESE
    "↘️",      // SE
    "⬇️↘️",    // SSE
    "⬇️",      // S
    "⬇️↙️",    // SSW
    "↙️",      // SW
    "⬅️↙️",    // WSW
    "⬅️",      // W
    "⬅️↖️",    // WNW
    "↖️",      // NW
    "⬆️↖️"     // NNW
  ];

  const getArrow = (deg) => {
    if (deg == null) return "⬆️";
    const index = Math.round(deg / 22.5) % 16;
    return arrows16[index];
  };

  // ✅ 16‑point text labels
  const labels16 = [
    "North",
    "North‑North‑East",
    "North‑East",
    "East‑North‑East",
    "East",
    "East‑South‑East",
    "South‑East",
    "South‑South‑East",
    "South",
    "South‑South‑West",
    "South‑West",
    "West‑South‑West",
    "West",
    "West‑North‑West",
    "North‑West",
    "North‑North‑West"
  ];

  const getLabel = (deg) => {
    if (deg == null) return "";
    const index = Math.round(deg / 22.5) % 16;
    return labels16[index];
  };

  return (
    <Box sx={{ p: 3, border: "1px solid #E5E7EB", borderRadius: 4, background: "white", textAlign: "center" }}>
      <Typography variant="h6" fontWeight={700}>🧭 Qibla Direction</Typography>

      <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
        <MyLocation sx={{ fontSize: 15 }} /> {locationLabel}
      </Typography>

      {qiblaDirection !== null && (
        <>
          <Typography variant="h2" sx={{ mt: 2 }}>
            {getArrow(qiblaDirection)}
          </Typography>

          <Typography variant="h4" fontWeight={700} color="primary.main">
            {qiblaDirection.toFixed(0)}°
          </Typography>

          <Typography variant="body1" sx={{ mt: 1, fontWeight: 600 }}>
            {getLabel(qiblaDirection)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Face your body in the direction shown by the arrow.
          </Typography>
        </>
      )}

      <Button variant="outlined" sx={{ mt: 3 }} startIcon={<Refresh />} onClick={() => window.location.reload()}>
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
