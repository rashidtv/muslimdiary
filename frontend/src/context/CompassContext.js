import React, { createContext, useContext, useState } from "react";

const CompassContext = createContext(null);

export const useCompass = () => {
  const ctx = useContext(CompassContext);
  if (!ctx) {
    throw new Error("useCompass must be used within CompassProvider");
  }
  return ctx;
};

export const CompassProvider = ({ children }) => {
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [compassActive, setCompassActive] = useState(false);
  const [compassError, setCompassError] = useState("");

  // ✅ Global Qibla bearing (works anywhere on Earth)
  const calculateQiblaBearing = (lat, lon) => {
    const kaabaLat = 21.4225 * Math.PI / 180;
    const kaabaLon = 39.8262 * Math.PI / 180;

    const φ1 = lat * Math.PI / 180;
    const λ1 = lon * Math.PI / 180;

    const y = Math.sin(kaabaLon - λ1);
    const x =
      Math.cos(φ1) * Math.tan(kaabaLat) -
      Math.sin(φ1) * Math.cos(kaabaLon - λ1);

    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // ✅ iPhone + Android heading normalization
  const handleCompass = (event) => {
    let heading = null;

    // ✅ iOS Safari
    if (typeof event.webkitCompassHeading === "number") {
      heading = event.webkitCompassHeading;
    }

    // ✅ Android
    else if (typeof event.alpha === "number") {
      heading = (360 - event.alpha + 90) % 360;
    }

    if (heading !== null && !Number.isNaN(heading)) {
      setDeviceHeading(heading);
    }
  };

  const startCompass = async () => {
    try {
      setCompassError("");

      if (!window.DeviceOrientationEvent) {
        setCompassError("Compass not supported");
        return;
      }

      // ✅ iOS permission requirement
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          setCompassError("Compass permission denied");
          return;
        }
      }

      window.addEventListener("deviceorientation", handleCompass, true);
      setCompassActive(true);

    } catch {
      setCompassError("Failed to start compass");
    }
  };

  const stopCompass = () => {
    window.removeEventListener("deviceorientation", handleCompass, true);
    setCompassActive(false);
  };

  const setUserLocationAndCalculateQibla = (lat, lon) => {
    const bearing = calculateQiblaBearing(lat, lon);
    setQiblaDirection(bearing);
  };

  // ✅ Arrow rotation (stable)
  const getQiblaAngle = () => {
    if (qiblaDirection === null) return 0;
    return (qiblaDirection - deviceHeading + 360) % 360;
  };

  return (
    <CompassContext.Provider
      value={{
        qiblaDirection,
        deviceHeading,
        compassActive,
        compassError,
        startCompass,
        stopCompass,
        setUserLocationAndCalculateQibla,
        getQiblaAngle,
      }}
    >
      {children}
    </CompassContext.Provider>
  );
};
