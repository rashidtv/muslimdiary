import React, { createContext, useContext, useState } from "react";

const CompassContext = createContext(null);

export const useCompass = () => {
  const ctx = useContext(CompassContext);
  if (!ctx) throw new Error("useCompass must be used inside CompassProvider");
  return ctx;
};

export const CompassProvider = ({ children }) => {
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [compassError, setCompassError] = useState("");

  // ✅ Global Qibla calculation
  const calculateQiblaBearing = (lat, lon) => {
    const kaabaLat = 21.4225 * Math.PI / 180;
    const kaabaLon = 39.8262 * Math.PI / 180;

    const φ1 = lat * Math.PI / 180;
    const λ1 = lon * Math.PI / 180;

    const y = Math.sin(kaabaLon - λ1);
    const x = Math.cos(φ1) * Math.tan(kaabaLat) - Math.sin(φ1) * Math.cos(kaabaLon - λ1);

    return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
  };

  const setUserLocationAndCalculateQibla = (lat, lon) => {
    try {
      const bearing = calculateQiblaBearing(lat, lon);
      setQiblaDirection(bearing);
    } catch (err) {
      setCompassError("Failed to calculate Qibla bearing.");
    }
  };

  return (
    <CompassContext.Provider
      value={{
        qiblaDirection,
        compassError,
        setUserLocationAndCalculateQibla,
      }}
    >
      {children}
    </CompassContext.Provider>
  );
};
