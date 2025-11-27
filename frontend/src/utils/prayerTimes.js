// Centralized configuration
const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:5000',
    timeout: 15000
  },
  production: {
    baseURL: 'https://muslimdiarybackend.onrender.com',
    timeout: 20000
  }
};

const getApiConfig = () => {
  const isDevelopment = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
  return isDevelopment ? API_CONFIG.development : API_CONFIG.production;
};

// Enhanced API client with retry logic
const makeApiRequest = async (url, options = {}, retryCount = 0) => {
  try {
    const defaultOptions = {
      signal: AbortSignal.timeout(getApiConfig().timeout)
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Retry on timeout or network errors
    if ((error.name === 'TimeoutError' || error.message.includes('Failed to fetch')) && retryCount < 2) {
      console.log(`🔄 API request failed, retry ${retryCount + 1}/3...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return makeApiRequest(url, options, retryCount + 1);
    }
    throw error;
  }
};

// Main prayer times calculation function
export const calculatePrayerTimes = async (latitude, longitude) => {
  try {
    console.log(`📍 Getting prayer times for coordinates: ${latitude}, ${longitude}`);
    
    const apiConfig = getApiConfig();
    let zoneCode, locationName;

    // Step 1: Get zone from coordinates
    try {
      const zoneData = await makeApiRequest(
        `${apiConfig.baseURL}/api/prayertimes/coordinates/${latitude}/${longitude}`
      );

      if (zoneData.success && zoneData.data) {
        zoneCode = zoneData.data.zone;
        locationName = zoneData.data.locationName;
        console.log(`📍 Coordinates → Zone: ${zoneCode} - ${locationName}`);
        
        // Store for future fallback
        localStorage.setItem('lastKnownZone', zoneCode);
      }
    } catch (zoneError) {
      console.log('Zone detection failed, using fallback:', zoneError.message);
    }

    // Step 2: Fallback zone detection
    if (!zoneCode) {
      zoneCode = await getFallbackZone(latitude, longitude);
      locationName = `Zone ${zoneCode}`;
      console.log(`📍 Using fallback zone: ${zoneCode}`);
    }

    // Step 3: Get prayer times for the zone
    const prayerData = await makeApiRequest(
      `${apiConfig.baseURL}/api/prayertimes/${zoneCode}`
    );
    
    if (prayerData.success && prayerData.data) {
      const times = prayerData.data;
      
      // Validate required prayer times
      if (!times.fajr || !times.dhuhr || !times.asr || !times.maghrib || !times.isha) {
        throw new Error('Incomplete prayer times data received');
      }

      const result = {
        fajr: formatTimeFromString(times.fajr),
        sunrise: calculateSunriseTime(times.fajr),
        dhuhr: formatTimeFromString(times.dhuhr),
        asr: formatTimeFromString(times.asr),
        maghrib: formatTimeFromString(times.maghrib),
        isha: formatTimeFromString(times.isha),
        method: `JAKIM ${times.zone}`,
        location: { latitude, longitude },
        date: times.date || new Date().toISOString().split('T')[0],
        calculated: true,
        success: true,
        source: times.source || 'jakim-official',
        zone: times.zone,
        locationName: times.locationName || locationName
      };

      console.log('✅ Prayer times fetched successfully:', {
        zone: result.zone,
        location: result.locationName,
        source: result.source
      });

      return result;
    } else {
      throw new Error(prayerData.error || 'Failed to fetch prayer times');
    }

  } catch (error) {
    console.error('❌ Prayer times calculation failed:', error.message);
    
    // Final fallback with static times
    return await getFinalFallback(latitude, longitude);
  }
};

// Get fallback zone with multiple strategies
const getFallbackZone = async (latitude, longitude) => {
  // Strategy 1: Last known zone from localStorage
  const lastZone = localStorage.getItem('lastKnownZone');
  if (lastZone) {
    console.log(`📍 Using last known zone: ${lastZone}`);
    return lastZone;
  }

  // Strategy 2: Try backend coordinate lookup
  try {
    const apiConfig = getApiConfig();
    const response = await makeApiRequest(
      `${apiConfig.baseURL}/api/prayertimes/coordinates/${latitude}/${longitude}`
    );

    if (response.success && response.data) {
      const zone = response.data.zone;
      localStorage.setItem('lastKnownZone', zone);
      return zone;
    }
  } catch (error) {
    console.log('Backend zone detection failed:', error.message);
  }

  // Strategy 3: Default to Kuala Lumpur
  console.log('📍 Using default zone: WLY01');
  return 'WLY01';
};

// Final fallback with static prayer times
const getFinalFallback = async (latitude, longitude) => {
  try {
    const zoneCode = await getFallbackZone(latitude, longitude);
    
    // Try one more time with the zone
    const apiConfig = getApiConfig();
    const response = await makeApiRequest(
      `${apiConfig.baseURL}/api/prayertimes/${zoneCode}`
    );

    if (response.success && response.data) {
      const times = response.data;
      return {
        fajr: formatTimeFromString(times.fajr),
        sunrise: calculateSunriseTime(times.fajr),
        dhuhr: formatTimeFromString(times.dhuhr),
        asr: formatTimeFromString(times.asr),
        maghrib: formatTimeFromString(times.maghrib),
        isha: formatTimeFromString(times.isha),
        method: `JAKIM ${times.zone} (Fallback)`,
        location: { latitude, longitude },
        date: times.date || new Date().toISOString().split('T')[0],
        calculated: true,
        success: true,
        source: 'jakim-fallback',
        zone: times.zone,
        locationName: times.locationName || `Zone ${times.zone}`
      };
    }
  } catch (error) {
    console.error('Final fallback failed:', error.message);
  }

  // Absolute last resort: Static times for WLY01
  console.log('⚠️ Using static fallback times for WLY01');
  return {
    fajr: '5:49 AM',
    sunrise: '7:09 AM',
    dhuhr: '1:00 PM',
    asr: '4:19 PM',
    maghrib: '6:59 PM',
    isha: '8:10 PM',
    method: 'JAKIM WLY01 (Static)',
    location: { latitude, longitude },
    date: new Date().toISOString().split('T')[0],
    calculated: false,
    success: true,
    source: 'static-fallback',
    zone: 'WLY01',
    locationName: 'Kuala Lumpur, Putrajaya'
  };
};

// Estimate sunrise based on Fajr time (JAKIM method)
const calculateSunriseTime = (fajrTime) => {
  if (!fajrTime || typeof fajrTime !== 'string') {
    return '7:00 AM';
  }
  
  try {
    const [hours, minutes] = fajrTime.split(':');
    let hour = parseInt(hours);
    let minute = parseInt(minutes);
    
    if (isNaN(hour) || isNaN(minute)) {
      return '7:00 AM';
    }
    
    // JAKIM sunrise is typically about 1 hour 20 minutes after Fajr
    minute += 80;
    if (minute >= 60) {
      hour += 1;
      minute -= 60;
    }
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    return '7:00 AM';
  }
};

// Format JAKIM time string (HH:MM:SS) to display format (HH:MM AM/PM)
const formatTimeFromString = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') {
    return '12:00 PM';
  }
  
  try {
    // Handle JAKIM format: "05:49:00"
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const minute = minutes ? parseInt(minutes) : 0;
    
    if (isNaN(hour) || isNaN(minute)) {
      return '12:00 PM';
    }
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  } catch (error) {
    return '12:00 PM';
  }
};

// Location service with enhanced error handling
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => { 
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    console.log('📍 Requesting current location...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        console.log('📍 Location obtained:', location);
        resolve(location);
      },
      (error) => {
        console.error('📍 Location error:', error);
        
        let errorMessage = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 600000 // 10 minutes
      }
    );
  });
};

// Store last known zone for future use
export const storeLastKnownZone = (zoneCode) => {
  if (zoneCode && typeof zoneCode === 'string') {
    localStorage.setItem('lastKnownZone', zoneCode);
    console.log(`💾 Stored last known zone: ${zoneCode}`);
  }
};

// Export aliases for backward compatibility
export { calculatePrayerTimes as calculatePrayerTimesLocal };
export { calculatePrayerTimes as calculatePrayerTimesAPI };