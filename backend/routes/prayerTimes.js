const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const PrayerCache = require('../models/PrayerCache');

const router = express.Router();

// In-memory cache (1 hour)
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

// ✅ Detect JAKIM zone from reverse geocode
function detectZone(address) {
  const state = address.state || address.city || address.region;
  if (!state) return "WLY01";

  for (const key of Object.keys(MALAYSIA_ZONES)) {
    if (state.includes(key)) return MALAYSIA_ZONES[key];
  }

  return "WLY01"; // Default KL
}

// ✅ Coordinates → Zone detection
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

    return res.json({
      success: true,
      data: { zone, locationName }
    });

  } catch (error) {
    console.error("❌ Coordinate lookup failed:", error.message);

    return res.json({
      success: false,
      data: { zone: "WLY01", locationName: "Kuala Lumpur (Fallback)" }
    });
  }
});

// ✅ Fetch from JAKIM (with full safety)
async function fetchJAKIM(zoneCode) {
  const today = new Date();
  const d = today.toISOString().split("T")[0];

  const url =
    `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat` +
    `&period=date&zone=${zoneCode}&date=${d}`;

  console.log(`🌙 Fetching JAKIM times for ${zoneCode}`);

  try {
    const response = await axios.get(url, {
      timeout: 8000,
      validateStatus: () => true, // ✅ VERY IMPORTANT
      headers: {
        "User-Agent": "Mozilla/5.0 (MuslimDiary/RenderServer)",
        "Accept": "application/json"
      }
    });

    console.log(`📦 Raw JAKIM response for ${zoneCode}:`, response.data);

    // ✅ Validate data structure
    if (
      !response.data ||
      typeof response.data !== "object" ||
      !Array.isArray(response.data.prayerTime) ||
      response.data.prayerTime.length === 0
    ) {
      throw new Error("JAKIM returned invalid or empty data");
    }

    const pt = response.data.prayerTime[0];

    return {
      fajr: pt.fajr,
      dhuhr: pt.dhuhr,
      asr: pt.asr,
      maghrib: pt.maghrib,
      isha: pt.isha,
      date: d,
      source: "jakim"
    };

  } catch (error) {
    console.error(`💥 JAKIM API failure for ${zoneCode}:`, error.message);
    throw new Error("JAKIM-Failed");
  }
}

// ✅ DB fallback: today → yesterday
async function loadDBFallback(zoneCode) {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString().split("T")[0];

  console.log(`📚 Loading DB fallback for ${zoneCode}`);

  let record = await PrayerCache.findOne({ zone: zoneCode, date: today });
  if (record) {
    console.log("✅ Using today's DB cache");
    return { ...record.toObject(), source: "db-today" };
  }

  record = await PrayerCache.findOne({ zone: zoneCode, date: yesterday });
  if (record) {
    console.log("✅ Using yesterday's DB cache");
    return { ...record.toObject(), source: "db-yesterday" };
  }

  console.log("❌ No DB fallback found");
  return null;
}

// ✅ Save to DB
async function saveToDB(zoneCode, data) {
  await PrayerCache.findOneAndUpdate(
    { zone: zoneCode, date: data.date },
    data,
    { upsert: true, new: true }
  );

  console.log(`💾 Saved JAKIM data for ${zoneCode} to DB`);
}

// ✅ Main prayer times endpoint
router.get('/:zoneCode', async (req, res) => {
  const { zoneCode } = req.params;

  try {
    // ✅ RAM Cache
    const ram = prayerCache.get(zoneCode);
    if (ram) {
      return res.json({ success: true, data: ram, source: ram.source });
    }

    let result;

    // ✅ 1. Try JAKIM first
    try {
      result = await fetchJAKIM(zoneCode);
      await saveToDB(zoneCode, result);
      prayerCache.set(zoneCode, result);
    } catch (jakimError) {
      console.warn(`⚠️ JAKIM failed for ${zoneCode}, using DB fallback`);

      // ✅ 2. Use database fallback
      const db = await loadDBFallback(zoneCode);
      if (db) {
        prayerCache.set(zoneCode, db);
        return res.json({ success: true, data: db, source: db.source });
      }

      // ✅ 3. No DB data → hard fail
      return res.status(503).json({
        success: false,
        error: "No JAKIM data available (live or cached).",
        source: "fallback-failed"
      });
    }

    // ✅ Success
    return res.json({ success: true, data: result, source: result.source });

  } catch (error) {
    console.error("💥 PrayerTimes route error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

module.exports = router;

//test