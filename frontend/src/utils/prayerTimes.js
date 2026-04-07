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
  const isDevelopment =
    window.location.hostname === 'localhost' ||
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
    if (
      (error.name === 'TimeoutError' ||
        error.message.includes('Failed to fetch')) &&
      retryCount < 2
    ) {
      console.log(`🔄 API request failed, retry ${retryCount + 1}/3...`);
      await new Promise(resolve =>
        setTimeout(resolve, 1000 * (retryCount + 1))
      );
      return makeApiRequest(url, options, retryCount + 1);
    }
    throw error;
  }
};

/**
 * ✅ FIXED: Added zoneCode parameter to avoid undefined variable errors
 * Used safe fallback to prevent React ESLint build failure.
 */
export const getLocationName = async (
  latitude,
  longitude,
  zoneCode = 'Unknown'
) => {
  const API_BASE =
    process.env.REACT_APP_API_BASE_URL ||
    'https://muslimdiarybackend.onrender.com';

  try {
    const response = await fetch(
      `${API_BASE}/api/nominatim-proxy?lat=${latitude}&lon=${longitude}`
    );

    if (!response.ok) throw new Error('Proxy request failed');

    const data = await response.json();
    return data.display_name || `Zone ${zoneCode}`;
  } catch (error) {
    console.warn(
      'Location name fetch failed, using zone as fallback:',
      error.message
    );
    return `Zone ${zoneCode}`;
  }
};

// Main prayer times function
export const calculatePrayerTimes = async (latitude, longitude) => {
  try {
    console.log(
      `📍 Getting prayer times for coordinates: ${latitude}, ${longitude}`
    );

    const apiConfig = getApiConfig();
    let zoneCode = null,
      locationName = null;

    // Step 1: Detect zone from coordinates
    try {
      const zoneData = await makeApiRequest(
        `${apiConfig.baseURL}/api/prayertimes/coordinates/${latitude}/${longitude}`
      );

      if (zoneData.success && zoneData.data) {
        zoneCode = zoneData.data.zone;
        locationName = zoneData.data.locationName;

        console.log(`📍 Coordinates → Zone: ${zoneCode} - ${locationName}`);

        localStorage.setItem('lastKnownZone', zoneCode);
      }
    } catch (zoneError) {
      console.log('Zone detection failed:', zoneError.message);
    }

    // Step 2: Fallback zone
    if (!zoneCode) {
      zoneCode = await getFallbackZone(latitude, longitude);
      locationName = `Zone ${zoneCode}`;
      console.log(`📍 Using fallback zone: ${zoneCode}`);
    }

    // Step 3: Fetch prayer times for the zone
    const prayerData = await makeApiRequest(
      `${apiConfig.baseURL}/api/prayertimes/${zoneCode}`
    );

    if (prayerData.success && prayerData.data) {
      const times = prayerData.data;

      if (
        !times.fajr ||
        !times.dhuhr ||
        !times.asr ||
        !times.maghrib ||
        !times.isha
      ) {
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

      console.log('✅ Prayer times fetched:', {
        zone: result.zone,
        location: result.locationName,
        source: result.source
      });

      return result;
    } else {
      throw new Error(prayerData.error || 'Prayer time fetch failed');
    }
  } catch (error) {
    console.error('❌ Prayer times calculation failed:', error.message);
    return await getFinalFallback(latitude, longitude);
  }
};

// Fallback zone detection
const getFallbackZone = async (latitude, longitude) => {
  const lastZone = localStorage.getItem('lastKnownZone');

  if (lastZone) {
    console.log(`📍 Using last known zone: ${lastZone}`);
    return lastZone;
  }

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
    console.log('Backend zone fallback failed:', error.message);
  }

  console.log('📍 Defaulting to WLY01');
  return 'WLY01';
};

// Final fallback (static times)
const getFinalFallback = async (latitude, longitude) => {
  try {
    const zoneCode = await getFallbackZone(latitude, longitude);
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
    console.error('Final fallback error:', error.message);
  }

  console.log('⚠️ Using static fallback for WLY01');
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

// Sunrise calculation
const calculateSunriseTime = fajrTime => {
  if (!fajrTime) return '7:00 AM';

  try {
    const [hours, minutes] = fajrTime.split(':');
    let hour = parseInt(hours);
    let minute = parseInt(minutes);

    minute += 80;
    if (minute >= 60) {
      hour += 1;
      minute -= 60;
    }

    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  } catch {
    return '7:00 AM';
  }
};

const formatTimeFromString = timeStr => {
  if (!timeStr) return '12:00 PM';

  try {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const minute = parseInt(minutes);

    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  } catch {
    return '12:00 PM';
  }
};

// Get user device location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      error => {
        reject(
          new Error(
            {
              1: 'Location permission denied',
              2: 'Location unavailable',
              3: 'Location timeout'
            }[error.code] || 'Failed to get location'
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 600000
      }
    );
  });
};

// Save last zone
export const storeLastKnownZone = zoneCode => {
  if (zoneCode) {
    localStorage.setItem('lastKnownZone', zoneCode);
    console.log(`💾 Stored zone: ${zoneCode}`);
  }
};

// Alias exports for backward compatibility
export { calculatePrayerTimes as calculatePrayerTimesLocal };
export { calculatePrayerTimes as calculatePrayerTimesAPI };