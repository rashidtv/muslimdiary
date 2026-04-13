import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { Refresh, MyLocation } from "@mui/icons-material";
import { useCompass } from "../../context/CompassContext";

const QiblaStaticDirection = () => {
  const {
    qiblaDirection,
    compassError,
    setUserLocationAndCalculateQibla,
  } = useCompass();

  const [locationLabel, setLocationLabel] = useState("");

  /* ✅ Get GPS + calculate Qibla */
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

  /* ✅ Manual refresh */
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

  /* ✅ Convert numerical degrees to text label */
  const getDirectionText = (deg) => {
    if (deg == null) return "";
    const labels = [
      "North",
      "North‑East",
      "East",
      "South‑East",
      "South",
      "South‑West",
      "West",
      "North‑West",
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
        textAlign: "center",
      }}
    >
      <Typography variant="h6" fontWeight={700}>
        🧭 Qibla Direction
      </Typography>

      {/* ✅ GPS coordinates */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1, display: "flex", justifyContent: "center", gap: 1 }}
      >
        <MyLocation sx={{ fontSize: 16 }} />
        {locationLabel}
      </Typography>

      {qiblaDirection !== null && (
        <>
          {/* ✅ Rotating SVG arrow: EXACT bearing */}
          <Box
            component="img"
            src="/qibla-arrow.svg"
            alt="Qibla Arrow"
            sx={{
              mt: 3,
              width: 80,
              height: 80,
              transform: `rotate(${qiblaDirection}deg)`,
              transition: "transform 0.2s ease-out",
            }}
          />

          {/* ✅ Numerical degrees */}
          <Typography
            variant="h4"
            fontWeight={700}
            color="primary.main"
            sx={{ mt: 2 }}
          >
            {qiblaDirection.toFixed(0)}°
          </Typography>

          {/* ✅ Compass direction */}
          <Typography variant="body1" fontWeight={600} sx={{ mt: 1 }}>
            {getDirectionText(qiblaDirection)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Face your body toward the arrow direction shown above.
          </Typography>
        </>
      )}

      {/* ✅ Refresh button */}
      <Button
        variant="outlined"
        sx={{ mt: 3 }}
        startIcon={<Refresh />}
        onClick={refreshLocation}
      >
        Refresh Location
      </Button>

      {/* ✅ Error */}
      {compassError && (
        <Typography sx={{ mt: 2 }} color="error">
          {compassError}
        </Typography>
      )}
    </Box>
  );
};

export default QiblaStaticDirection;
