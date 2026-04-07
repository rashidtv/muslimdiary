import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

const CompassContext = createContext();

export const useCompass = () => {
  const context = useContext(CompassContext);
  if (!context) {
    throw new Error('useCompass must be used within a CompassProvider');
  }
  return context;
};

export const CompassProvider = ({ children }) => {
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [deviceHeading, setDeviceHeading] = useState(0);
  const [compassActive, setCompassActive] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [compassError, setCompassError] = useState('');

  const calculateQiblaDirection = (lat, lng) => {
    const φ1 = lat * Math.PI / 180;
    const φ2 = 21.4225 * Math.PI / 180;
    const λ1 = lng * Math.PI / 180;
    const λ2 = 39.8262 * Math.PI / 180;

    const y = Math.sin(λ2 - λ1);
    const x = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(λ2 - λ1);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;
    
    return Math.round(bearing);
  };

  const handleCompass = (event) => {
    if (event.alpha === null) return;

    let heading = event.alpha;
    
    // For iOS devices
    if (typeof event.webkitCompassHeading !== 'undefined') {
      heading = event.webkitCompassHeading;
    }
    
    if (heading !== null && !isNaN(heading)) {
      setDeviceHeading(heading);
    }
  };

  const startCompass = async () => {
    if (compassActive) return;

    if (!window.DeviceOrientationEvent) {
      setCompassError('Compass not supported on this device');
      return;
    }

    try {
      // iOS permission handling
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          setCompassError('Compass permission denied');
          return;
        }
      }

      window.addEventListener('deviceorientation', handleCompass, true);
      setCompassActive(true);
      setCompassError('');
      
    } catch (error) {
      setCompassError('Failed to start compass: ' + error.message);
    }
  };

  const stopCompass = () => {
    window.removeEventListener('deviceorientation', handleCompass, true);
    setCompassActive(false);
    setDeviceHeading(0);
  };

  const setUserLocationAndCalculateQibla = (latitude, longitude) => {
    setUserLocation({ latitude, longitude });
    const direction = calculateQiblaDirection(latitude, longitude);
    setQiblaDirection(direction);
  };

  const getQiblaAngle = () => {
    if (!qiblaDirection || !compassActive) return qiblaDirection || 0;
    return (qiblaDirection - deviceHeading + 360) % 360;
  };

  const value = {
    qiblaDirection,
    deviceHeading,
    compassActive,
    userLocation,
    compassError,
    setUserLocationAndCalculateQibla,
    startCompass,
    stopCompass,
    getQiblaAngle
  };

  return (
    <CompassContext.Provider value={value}>
      {children}
    </CompassContext.Provider>
  );
};