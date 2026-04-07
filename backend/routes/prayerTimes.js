const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const PrayerCache = require('../models/PrayerCache');

const router = express.Router();

// Cache Prayer Times (RAM-level, 1 hour)
const prayerCache = new NodeCache({ stdTTL: 3600 });

// Malaysia Zone Mapping
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

// Detect JAKIM zone from OpenStreetMap state/city
function detectZone(address) {
  const state = address.state || address.city || address.region;
  if (!state) return "WLY01";

  for (const key of Object.keys(MALAYSIA_ZONES)) {
    if (state.includes(key)) {
      return MALAYSIA_ZONES[key];
    }
  }
  return "WLY01";
}

// ✅ Route: Determine zone from coordinates
router.get('/coordinates/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;

    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      { headers: { "User-Agent": "MuslimDiary/3.0" } }
    );

    const data = response.data;
    const zone = detectZone(data.address || {});

    return res.json({
      success: true,
      data: {
        zone,
        locationName: data.display_name || `Zone ${zone}`
      }
    });

  } catch {
    return res.json({
      success: false,
      data: {
        zone: "WLY01",
        locationName: "Kuala Lumpur"
      }
    });
  }
});

// ✅ Fetch from JAKIM API
async function fetchJAKIM(zoneCode) {
  const today = new Date();
  const d = today.toISOString().split("T")[0];

  const url =
    `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat` +
    `&period=date&zone=${zoneCode}&date=${d}`;

  const response = await axios.get(url, {
    timeout: 6000,
    headers: {
      "User-Agent": "Mozilla/5.0 (MuslimDiary/RenderServer)",
      "Accept": "application/json"
    }
  });

  if (!response.data?.prayerTime?.[0]) {
    throw new Error("Invalid JAKIM format");
  }

  return { ...response.data.prayerTime[0], date: d, source: "jakim" };
}

// ✅ Fallback: Load previous stored JAKIM from DB
async function loadDBFallback(zoneCode) {
  const today = new Date().toISOString().split("T")[0];

  // Try today
  let record = await PrayerCache.findOne({ zone: zoneCode, date: today });
  if (record) return { ...record.toObject(), source: "db-today" };

  // Try yesterday
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString().split("T")[0];

  record = await PrayerCache.findOne({ zone: zoneCode, date: yesterday });
  if (record) return { ...record.toObject(), source: "db-yesterday" };

  return null;
}

// ✅ Save JAKIM times to DB
async function saveToDB(zoneCode, data) {
  const doc = await PrayerCache.findOneAndUpdate(
    { zone: zoneCode, date: data.date },
    data,
    { upsert: true, new: true }
  );
  return doc;
}

// ✅ Main endpoint
router.get('/:zoneCode', async (req, res) => {
  const { zoneCode } = req.params;

  try {
    // 1. Check RAM cache
    const cached = prayerCache.get(zoneCode);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        source: cached.source,
      });
    }

    let result;

    // 2. Try JAKIM
    try {
      result = await fetchJAKIM(zoneCode);
      await saveToDB(zoneCode, result);
      prayerCache.set(zoneCode, result);
    } catch (err) {
      // 3. Fallback: DB
      const dbData = await loadDBFallback(zoneCode);
      if (dbData) {
        prayerCache.set(zoneCode, dbData);
        return res.json({ success: true, data: dbData, source: dbData.source });
      }

      throw new Error("No data available");
    }

    // ✅ Successful JAKIM
    return res.json({ success: true, data: result, source: result.source });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Unable to fetch prayer times",
    });
  }
});

module.exports = router;