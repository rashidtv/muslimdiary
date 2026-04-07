const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const router = express.Router();

// Cache prayer times for 1 hour
const prayerCache = new NodeCache({ stdTTL: 3600 });

// ✅ Malaysia Zone Mapping (JAKIM)
const MALAYSIA_ZONES = {
  "Kuala Lumpur": "WLY01",
  "Putrajaya": "WLY01",
  "Selangor": "WLY02",
  "Johor": "JHR01",
  "Kedah": "KDH01",
  "Kelantan": "KTN01",
  "Melaka": "MLK01",
  "N. Sembilan": "NGS01",
  "Pahang": "PHG01",
  "Perak": "PRK01",
  "Perlis": "PLS01",
  "Penang": "PNG01",
  "Sabah": "SBH01",
  "Sarawak": "SWK01",
  "Terengganu": "TRG01",
  "Labuan": "LBN01"
};

// ✅ Helper: Determine JAKIM zone from OpenStreetMap result
function detectZone(address) {
  const state = address.state || address.city || address.region;
  if (!state) return "WLY01";

  for (const key of Object.keys(MALAYSIA_ZONES)) {
    if (state.includes(key)) {
      return MALAYSIA_ZONES[key];
    }
  }

  // Default zone (KL)
  return "WLY01";
}

// ✅ ✅ NEW ROUTE — Detect zone by coordinates
router.get('/coordinates/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;

    console.log(`📍 Reverse geocoding: ${lat}, ${lng}`);

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      {
        headers: { "User-Agent": "MuslimDiary/3.0" }
      }
    );

    const data = response.data;
    const zone = detectZone(data.address || {});
    const locationName = data.display_name || `Zone ${zone}`;

    console.log(`✅ Coordinates detected zone: ${zone}`);

    return res.json({
      success: true,
      data: {
        zone,
        locationName
      }
    });

  } catch (error) {
    console.error("❌ Coordinate lookup failed:", error.message);

    return res.json({
      success: false,
      data: {
        zone: "WLY01",
        locationName: "Kuala Lumpur (Fallback)"
      }
    });
  }
});

// ✅ Enhanced JAKIM API settings
const JAKIM_CONFIG = {
  timeout: 8000,
  retries: 2,
  retryDelay: 1000
};

async function fetchPrayerTimesFromJakim(zoneCode) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

  const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat`;
  const params = `&period=date&zone=${zoneCode}&date=${dateStr}`;

  for (let attempt = 1; attempt <= JAKIM_CONFIG.retries + 1; attempt++) {
    try {
      const response = await axios.get(url + params, {
        timeout: JAKIM_CONFIG.timeout,
        headers: {
          "User-Agent": "Mozilla/5.0 (MuslimDiary/3.0)",
          "Accept": "application/json"
        },
      });

      if (response.data?.prayerTime?.[0]) {
        console.log(`✅ JAKIM response OK for ${zoneCode}`);
        return response.data.prayerTime[0];
      }

      throw new Error("Invalid JAKIM response structure");

    } catch (error) {
      console.warn(`❌ JAKIM attempt ${attempt} failed:`, error.message);

      if (attempt <= JAKIM_CONFIG.retries) {
        await new Promise(r => setTimeout(r, JAKIM_CONFIG.retryDelay * attempt));
        continue;
      }

      throw error;
    }
  }
}

// ✅ Main prayer times endpoint
router.get('/:zoneCode', async (req, res) => {
  const { zoneCode } = req.params;

  try {
    const cacheKey = `prayer-${zoneCode}`;
    const cached = prayerCache.get(cacheKey);

    if (cached) {
      return res.json({
        success: true,
        data: cached,
        source: "cache",
        timestamp: new Date().toISOString()
      });
    }

    // Fetch from JAKIM
    const jakim = await fetchPrayerTimesFromJakim(zoneCode);

    const prayerTimes = {
      fajr: jakim.fajr,
      dhuhr: jakim.dhuhr,
      asr: jakim.asr,
      maghrib: jakim.maghrib,
      isha: jakim.isha,
      date: jakim.date,
      zone: zoneCode
    };

    prayerCache.set(cacheKey, prayerTimes);

    res.json({
      success: true,
      data: prayerTimes,
      source: "jakim-api",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Failed JAKIM fetch for ${zoneCode}:`, error.message);

    res.status(503).json({
      success: false,
      error: "Unable to fetch prayer times.",
      source: "jakim-error"
    });
  }
});

module.exports = router;