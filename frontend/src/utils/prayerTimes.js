// Use only JAKIM API with proper fallback to nearest zone
export const calculatePrayerTimes = async (latitude, longitude) => {
  try {
    console.log(`📍 Getting JAKIM prayer times for: ${latitude}, ${longitude}`);
    
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000' 
      : 'https://muslimdailybackend.onrender.com';

    // Try coordinates API first
    let zoneCode, locationName;
    
    try {
      const zoneResponse = await fetch(
        `${API_BASE}/api/prayertimes/coordinates/${latitude}/${longitude}`
      );

      if (zoneResponse.ok) {
        const zoneData = await zoneResponse.json();
        if (zoneData.success && zoneData.data) {
          zoneCode = zoneData.data.zone;
          locationName = zoneData.data.locationName;
          console.log(`📍 Coordinates → Zone: ${zoneCode} - ${locationName}`);
        }
      }
    } catch (zoneError) {
      console.log('Zone detection failed, using fallback:', zoneError);
    }

    // If zone detection failed, use last known zone or nearest fallback
    if (!zoneCode) {
      zoneCode = await getFallbackZone(latitude, longitude);
      locationName = `Zone ${zoneCode}`;
      console.log(`📍 Using fallback zone: ${zoneCode}`);
    }

    // Get prayer times using the zone
    const prayerResponse = await fetch(`${API_BASE}/api/prayertimes/${zoneCode}`);
    
    if (!prayerResponse.ok) {
      throw new Error(`Prayer API failed: ${prayerResponse.status}`);
    }

    const prayerData = await prayerResponse.json();
    
    if (!prayerData.success || !prayerData.data) {
      throw new Error('No prayer times data received from JAKIM');
    }

    const times = prayerData.data;

    // Validate prayer times
    if (!times.fajr || !times.dhuhr || !times.asr || !times.maghrib || !times.isha) {
      throw new Error('Incomplete prayer times from JAKIM');
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
      date: times.date || new Date().toDateString(),
      calculated: true,
      success: true,
      source: 'jakim-official',
      zone: times.zone,
      locationName: times.locationName || locationName
    };

    console.log('✅ JAKIM prayer times success:', {
      zone: result.zone,
      location: result.locationName,
      times: {
        fajr: result.fajr,
        dhuhr: result.dhuhr,
        asr: result.asr,
        maghrib: result.maghrib,
        isha: result.isha
      }
    });

    return result;

  } catch (error) {
    console.error('❌ JAKIM API failed:', error.message);
    
    // Final fallback - use last known zone or default
    return await getFinalFallback(latitude, longitude);
  }
};

// Get fallback zone from last known location or calculate nearest
const getFallbackZone = async (latitude, longitude) => {
  try {
    // Try to get last known zone from localStorage
    const lastZone = localStorage.getItem('lastKnownZone');
    if (lastZone) {
      console.log(`📍 Using last known zone: ${lastZone}`);
      return lastZone;
    }

    // Try to calculate zone from coordinates via backend
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000' 
      : 'https://muslimdailybackend.onrender.com';

    const response = await fetch(
      `${API_BASE}/api/prayertimes/coordinates/${latitude}/${longitude}`
    );

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        // Store for future use
        localStorage.setItem('lastKnownZone', data.data.zone);
        return data.data.zone;
      }
    }
  } catch (error) {
    console.log('Fallback zone detection failed:', error);
  }

  // Ultimate fallback - use WLY01 (Kuala Lumpur)
  console.log('📍 Using default zone: WLY01');
  return 'WLY01';
};

// Final fallback using zone-based API
const getFinalFallback = async (latitude, longitude) => {
  try {
    const zoneCode = await getFallbackZone(latitude, longitude);
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000' 
      : 'https://muslimdailybackend.onrender.com';

    const response = await fetch(`${API_BASE}/api/prayertimes/${zoneCode}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        const times = data.data;
        
        return {
          fajr: formatTimeFromString(times.fajr),
          sunrise: calculateSunriseTime(times.fajr),
          dhuhr: formatTimeFromString(times.dhuhr),
          asr: formatTimeFromString(times.asr),
          maghrib: formatTimeFromString(times.maghrib),
          isha: formatTimeFromString(times.isha),
          method: `JAKIM ${times.zone} (Fallback)`,
          location: { latitude, longitude },
          date: times.date || new Date().toDateString(),
          calculated: true,
          success: true,
          source: 'jakim-fallback',
          zone: times.zone,
          locationName: times.locationName || `Zone ${times.zone}`
        };
      }
    }
  } catch (error) {
    console.error('Final fallback failed:', error);
  }

  // Absolute last resort - static times for WLY01
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
    date: new Date().toDateString(),
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

// Location service
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => { 
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        console.log('📍 Location obtained:', location);
        resolve(location);
      },
      (error) => {
        console.error('📍 Location error:', error);
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 600000
      }
    );
  });
};

// Store last known zone when prayer times are successfully fetched
export const storeLastKnownZone = (zoneCode) => {
  if (zoneCode) {
    localStorage.setItem('lastKnownZone', zoneCode);
    console.log(`💾 Stored last known zone: ${zoneCode}`);
  }
};

// Export aliases for backward compatibility
export { calculatePrayerTimes as calculatePrayerTimesLocal };
export { calculatePrayerTimes as calculatePrayerTimesAPI };