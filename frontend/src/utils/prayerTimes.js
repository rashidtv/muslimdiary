// ===========================================================
// ✅ NEW FRONTEND PRAYER TIME ENGINE (FULLY BACKEND-DRIVEN)
//    Works with official JAKIM zones (SGR01, WLY01, etc.).
//    Removes invalid zones like WLY02 completely.
// ===========================================================

// Centralized API configuration
const API_CONFIG = {
  development: {
    baseURL: "http://localhost:5000",
    timeout: 15000,
  },
  production: {
    baseURL: "https://muslimdiarybackend.onrender.com",
    timeout: 20000,
  },
};

const getApiConfig = () => {
  const isDev =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  return isDev ? API_CONFIG.development : API_CONFIG.production;
};

// Generic API fetch with retry logic
const makeApiRequest = async (url, options = {}, retryCount = 0) => {
  try {
    const defaultOptions = {
      signal: AbortSignal.timeout(getApiConfig().timeout),
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (
      (error.name === "TimeoutError" ||
        error.message.includes("Failed to fetch")) &&
      retryCount < 2
    ) {
      console.log(`🔄 API retry ${retryCount + 1}/3`);
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (retryCount + 1))
      );
      return makeApiRequest(url, options, retryCount + 1);
    }
    throw error;
  }
};

// ✅ Get display location name from backend proxy
export const getLocationName = async (latitude, longitude, zoneCode = "Unknown") => {
  const API_BASE =
    process.env.REACT_APP_API_BASE_URL ||
    "https://muslimdiarybackend.onrender.com";

  try {
    const response = await fetch(
      `${API_BASE}/api/nominatim-proxy?lat=${latitude}&lon=${longitude}`
    );

    if (!response.ok) throw new Error("Proxy request failed");
    const data = await response.json();
    return data.display_name || `Zone ${zoneCode}`;
  } catch (error) {
    console.warn("Failed to fetch human-readable location.");
    return `Zone ${zoneCode}`;
  }
};

// ✅ MAIN PRAYER TIME FUNCTION
export const calculatePrayerTimes = async (latitude, longitude) => {
  try {
    console.log(`📍 Getting prayer times for: ${latitude}, ${longitude}`);
    const apiConfig = getApiConfig();

    let zoneCode = null;
    let locationName = null;

    // =======================================================
    // ✅ Step 1: ALWAYS rely on backend zone detection
    // =======================================================
    try {
      const zoneData = await makeApiRequest(
        `${apiConfig.baseURL}/api/prayertimes/coordinates/${latitude}/${longitude}`
      );

      if (zoneData.success && zoneData.data.zone) {
        zoneCode = zoneData.data.zone;
        locationName = zoneData.data.locationName;

        // ✅ Store only VALID JAKIM zones (SGR01 etc.)
        localStorage.setItem("lastKnownZone", zoneCode);

        console.log(`✅ Backend zone: ${zoneCode} - ${locationName}`);
      }
    } catch (e) {
      console.warn("Backend zone detection failed:", e.message);
    }

    // =======================================================
    // ✅ Step 2: Fallback zone (ONLY IF BACKEND REALLY FAILED)
    // =======================================================
    if (!zoneCode) {
      const storedZone = localStorage.getItem("lastKnownZone");

      if (storedZone) {
        console.log(`📍 Using stored zone: ${storedZone}`);
        zoneCode = storedZone;
      } else {
        console.warn("⚠️ NO valid zone available — defaulting safely to WLY01");
        zoneCode = "WLY01"; // KL/Putrajaya (safe fallback)
      }
    }

    // =======================================================
    // ✅ Step 3: Fetch prayer times from backend
    // =======================================================
    const prayerData = await makeApiRequest(
      `${apiConfig.baseURL}/api/prayertimes/${zoneCode}`
    );

    if (prayerData.success && prayerData.data) {
      const times = prayerData.data;

      const result = {
        fajr: formatTimeFromString(times.fajr),
        sunrise: calculateSunriseTime(times.fajr),
        dhuhr: formatTimeFromString(times.dhuhr),
        asr: formatTimeFromString(times.asr),
        maghrib: formatTimeFromString(times.maghrib),
        isha: formatTimeFromString(times.isha),
        method: `JAKIM ${times.zone}`,
        location: { latitude, longitude },
        date: times.date || new Date().toISOString().split("T")[0],
        calculated: true,
        success: true,
        source: times.source,
        zone: times.zone,
        locationName: locationName || times.locationName,
      };

      console.log("✅ Prayer times fetched:", {
        zone: result.zone,
        source: result.source,
      });

      return result;
    }

    throw new Error(prayerData.error || "Prayer time fetch failed");
  } catch (error) {
    console.error("❌ Calculation error:", error.message);
    return await getFinalFallback(latitude, longitude);
  }
};


// ✅ FINAL FALLBACK — simple static WLY01 times
const getFinalFallback = async (latitude, longitude) => {
  console.log("⚠️ Using static fallback for KL (WLY01)");

  return {
    fajr: "5:49 AM",
    sunrise: "7:09 AM",
    dhuhr: "1:00 PM",
    asr: "4:19 PM",
    maghrib: "6:59 PM",
    isha: "8:10 PM",
    method: "JAKIM WLY01 (Static)",
    location: { latitude, longitude },
    date: new Date().toISOString().split("T")[0],
    calculated: false,
    success: true,
    source: "static-fallback",
    zone: "WLY01",
    locationName: "Kuala Lumpur, Putrajaya",
  };
};


// ✅ Sunrise estimation
const calculateSunriseTime = (fajrTime) => {
  if (!fajrTime) return "7:00 AM";

  try {
    const [hours, minutes] = fajrTime.split(":");
    let hour = parseInt(hours);
    let minute = parseInt(minutes);
    minute += 80;
    if (minute >= 60) {
      hour += 1;
      minute -= 60;
    }
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  } catch {
    return "7:00 AM";
  }
};

// ✅ Format HH:mm:ss → 12 hour
const formatTimeFromString = (str) => {
  if (!str) return "12:00 PM";
  try {
    const [h, m] = str.split(":");
    const hour = parseInt(h);
    const minute = parseInt(m);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  } catch {
    return "12:00 PM";
  }
};

// ✅ Get GPS coordinates
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
      },
      (error) => {
        reject(
          new Error(
            {
              1: "Location permission denied",
              2: "Location unavailable",
              3: "Location timeout",
            }[error.code] || "Failed to get location"
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 600000,
      }
    );
  });
};

export const storeLastKnownZone = (z) => {
  if (z) {
    localStorage.setItem("lastKnownZone", z);
    console.log(`💾 Stored zone: ${z}`);
  }
};

// Backwards compatibility exports
export { calculatePrayerTimes as calculatePrayerTimesLocal };
export { calculatePrayerTimes as calculatePrayerTimesAPI };