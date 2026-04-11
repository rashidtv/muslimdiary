import React, { createContext, useState, useContext, useEffect } from 'react';

const CompassContext = createContext();

export const useCompass = () => {
  const context = useContext(CompassContext);
  if (!context) {
    throw new Error("useCompass must be used within a CompassProvider");
  }
  return context;
};

export const CompassProvider = ({ children }) => {
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [compassActive, setCompassActive] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [compassError, setCompassError] = useState("");

  /* ---------------------------------------------
     ✅ QIBLA DIRECTION CALCULATION (ACCURATE)
     --------------------------------------------- */
  const calculateQiblaDirection = (lat, lng) => {
    // Convert degrees to radians
    const φ1 = lat * Math.PI / 180;
    const φ2 = 21.4225 * Math.PI / 180;      // Kaaba latitude
    const λ1 = lng * Math.PI / 180;
    const λ2 = 39.8262 * Math.PI / 180;      // Kaaba longitude

    const y = Math.sin(λ2 - λ1);
    const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(λ2 - λ1);

    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360; // Normalize 0–360°
  };

  /* ------------------------------------------------------------
     ✅ FIXED DEVICE HEADING FOR ALL DEVICES (iOS + Android)
     ------------------------------------------------------------ */
  const handleCompass = (event) => {

    let heading = null;

    // ✅ iOS Safari (webkitCompassHeading = TRUE heading)
    if (typeof event.webkitCompassHeading !== "undefined") {
      heading = event.webkitCompassHeading;
    }

    // ✅ Android Chrome uses alpha → but alpha=0 means device faces EAST
    else if (event.alpha != null) {
      // Convert EAST-based alpha to TRUE NORTH heading:
      // Formula: heading = (360 - alpha + 90) % 360
      heading = (360 - event.alpha + 90) % 360;
    }

    // ✅ Only update if valid
    if (heading !== null && !isNaN(heading)) {
      setDeviceHeading(heading);
    }
  };

  /* ------------------------------------------------------------
     ✅ START COMPASS (Required user gesture for iOS)
     ------------------------------------------------------------ */
  const startCompass = async () => {
    try {
      setCompassError("");

      if (!window.DeviceOrientationEvent) {
        setCompassError("Compass not supported on this device");
        return;
      }

      // ✅ iOS permission
      if (typeof DeviceOrientationEvent.requestPermission === "function") {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== "granted") {
          setCompassError("Compass permission denied");
          return;
        }
      }

      window.addEventListener("deviceorientation", handleCompass, true);
      setCompassActive(true);

    } catch (err) {
      setCompassError("Failed to start compass");
    }
  };

  /* ------------------------------------------------------------
     ✅ STOP COMPASS
     ------------------------------------------------------------ */
  const stopCompass = () => {
    window.removeEventListener("deviceorientation", handleCompass, true);
    setCompassActive(false);
  };

  /* ------------------------------------------------------------
     ✅ SET LOCATION + CALCULATE QIBLA
     ------------------------------------------------------------ */
  const setUserLocationAndCalculateQibla = (lat, lng) => {
    setUserLocation({ latitude: lat, longitude: lng });
    const qibla = calculateQiblaDirection(lat, lng);
    setQiblaDirection(qibla);
  };

  /* ------------------------------------------------------------
     ✅ GET FINAL ARROW ROTATION
     (Qibla direction - device heading)
     ------------------------------------------------------------ */
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
