import React, { createContext, useContext, useState } from "react";

const CompassContext = createContext();

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
  const [userLocation, setUserLocation] = useState(null);
  const [compassError, setCompassError] = useState("");

  // ✅ Global Qibla calculation (works anywhere on Earth)
  const calculateQiblaBearing = (lat, lon) => {
    const kaabaLat = 21.4225 * Math.PI / 180;
    const kaabaLon = 39.8262 * Math.PI / 180;
    const φ1 = lat * Math.PI / 180;
    const λ1 = lon * Math.PI / 180;

    const y = Math.sin(kaabaLon - λ1);
    const x =
      Math.cos(φ1) * Math.tan(kaabaLat) -
      Math.sin(φ1) * Math.cos(kaabaLon - λ1);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

const handleCompass = (event) => {const handleCompass =  // ✅ iPhone / iOS Safari — MUST INVERT
  if (typeof event.webkitCompassHeading !== "undefined") {
    heading = (360 - event.webkitCompassHeading) % 360;
  }

  // ✅ Android (Chrome)
  else if (event.alpha != null) {
    heading = (360 - event.alpha + 90) % 360;
  }

  if (heading !== null && !isNaN(heading)) {
    setDeviceHeading(heading);
  }
};
  let heading = null;

  const startCompass = async () => {
    try {
      setCompassError("");

      if (!window.DeviceOrientationEvent) {
        setCompassError("Compass not supported");
        return;
      }

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
    setUserLocation({ latitude: lat, longitude: lon });
    setQiblaDirection(calculateQiblaBearing(lat, lon));
  };

  // ✅ Arrow rotation (MODEL A)
  const getQiblaAngle = () => {
    if (!qiblaDirection) return 0;
    return (qiblaDirection - deviceHeading + 360) % 360;
  };

  return (
    <CompassContext.Provider
      value={{
        qiblaDirection,
        deviceHeading,
        compassActive,
        userLocation,
        compassError,
        setUserLocationAndCalculateQibla,
        startCompass,
        stopCompass,
        getQiblaAngle
      }}
    >
      {children}
    </CompassContext.Provider>
  );
};
