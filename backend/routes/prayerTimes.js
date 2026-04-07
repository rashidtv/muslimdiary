const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const router = express.Router();

// Cache prayer times for 1 hour
const prayerCache = new NodeCache({ stdTTL: 3600 });

// ✅ Malaysia JAKIM Zones
const MALAYSIA_ZONES = {
  "Kuala Lumpur": "WLY01",
  "Putrajaya": "WLY01",
  "Selangor": "WLY02",
  "Johor": "JHR01",
  "Kedah": "KDH01",
  "Kelantan": "KTN01",
  "Melaka": "MLK01",
  "Negeri Sembilan": "NGS01",
  "Pahang": "PHG01",
  "Perak": "PRK01",
  "Perlis": "PLS01",
  "Pulau Pinang": "PNG01",
  "Penang": "PNG01",
  "Sabah": "SBH01",
  "Sarawak": "SWK01",
  "Terengganu": "TRG01",
  "Labuan": "LBN01"
};

// ✅ Detect zone from OpenStreetMap reverse geocode
function detectZone(address) {
  const state = address.state || address.city || address.region;
  if (!state) return "WLY01";

  for (const key of Object.keys(MALAYSIA_ZONES)) {
    if (state.includes(key)) {
      return MALAYSIA_ZONES[key];
    }
  }
  return "WLY01"; // KL fallback
}

// ✅ NEW ENDPOINT: Detect zone by coordinates
router.get('/coordinates/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;

    console.log(`📍 Reverse geocoding for: ${lat}, ${lng}`);

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { "User-Agent": "MuslimDiary/3.0" } }
    );

    const data = response.data;
    const zone = detectZone(data.address || {});
    const locationName = data.display_name || `Zone ${zone}`;

    console.log(`✅ Detected zone: ${zone}`);

    return res.json({ success: true, data: { zone, locationName } });

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

// ✅ Enhanced JAKIM API
async function fetchJAKIM(zoneCode) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

  const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=date&zone=${zoneCode}&date=${dateStr}`;

  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        "User-Agent": "Mozilla/5.0 (MuslimDiary/3.0 RenderServer)",
        "Accept": "application/json"
      }
    });

    if (response.data?.prayerTime?.[0]) {
      console.log(`✅ JAKIM OK: ${zoneCode}`);
      return { ...response.data.prayerTime[0], source: "jakim" };
    }

    throw new Error("Invalid JAKIM response");

  } catch (err) {
    throw new Error("JAKIM-Failed");
  }
}

// ✅ Fallback to AlAdhan API
async function fetchAlAdhan(zoneCode) {
  console.log(`⚠️ Using AlAdhan fallback for ${zoneCode}`);

  const response = await axios.get(
    `https://api.aladhan.com/v1/timingsByAddress?address=${zoneCode},Malaysia&method=3`
  );

  const data = response.data.data.timings;

  return {
    fajr: data.Fajr,
    dhuhr: data.Dhuhr,
    asr: data.Asr,
    maghrib: data.Maghrib,
    isha: data.Isha,
    date: new Date().toISOString().split("T")[0],
    source: "aladahn"
  };
}

// ✅ Combined fetcher (JAKIM → fallback to AlAdhan)
async function fetchPrayerTimes(zoneCode) {
  try {
    return await fetchJAKIM(zoneCode);
  } catch {
    return await fetchAlAdhan(zoneCode);
  }
}

// ✅ Main endpoint — Get prayer times by zone
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

    const times = await fetchPrayerTimes(zoneCode);

    prayerCache.set(cacheKey, times);

    res.json({
      success: true,
      data: times,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ Failed to fetch prayer times for ${zoneCode}:`, error.message);

    res.status(500).json({
      success: false,
      error: "Unable to fetch prayer times",
      source: "server"
    });
  }
});

module.exports = router;