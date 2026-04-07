const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const PrayerCache = require('../models/PrayerCache');
const detectJakimZone = require('../utils/zoneDetector');

const router = express.Router();

// 1-hour RAM cache
const prayerCache = new NodeCache({ stdTTL: 3600 });


// ============================================
//  Fetch JAKIM timetable (Robust version)
// ============================================
async function fetchJAKIM(zoneCode) {
  const today = new Date();
  const date = today.toISOString().split("T")[0];

  const url =
    `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat` +
    `&period=date&zone=${zoneCode}&date=${date}`;

  console.log(`🌙 Fetching JAKIM for ${zoneCode}`);

  try {
    const res = await axios.get(url, {
      timeout: 12000,
      validateStatus: () => true, 
      headers: {
        "User-Agent": "Mozilla/5.0 (MuslimDiary/RenderServer)",
        "Accept": "application/json"
      }
    });

    console.log(`📦 Raw JAKIM response for ${zoneCode}:`, res.data);

    // Validate structure
    if (
      !res.data ||
      typeof res.data !== "object" ||
      !Array.isArray(res.data.prayerTime) ||
      res.data.prayerTime.length === 0
    ) {
      throw new Error("Invalid JAKIM structure");
    }

    const p = res.data.prayerTime[0];

    return {
      fajr: p.fajr,
      dhuhr: p.dhuhr,
      asr: p.asr,
      maghrib: p.maghrib,
      isha: p.isha,
      date,
      zone: zoneCode,
      source: "jakim"
    };
  } catch (error) {
    console.error(`💥 JAKIM failed for ${zoneCode}:`, error.message);
    throw new Error("JAKIM-Failed");
  }
}


// ============================================
//   DB fallback logic (today → yesterday → 5 days back)
// ============================================
async function loadDBFallback(zone) {
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today - i * 86400000).toISOString().split("T")[0];
    const doc = await PrayerCache.findOne({ zone, date: d });

    if (doc) {
      console.log(`✅ DB fallback using ${d} for ${zone}`);
      return { ...doc.toObject(), source: "db-fallback" };
    }
  }

  console.log("❌ No DB fallback available for", zone);
  return null;
}


// ============================================
//   Save to DB
// ============================================
async function saveToDB(zone, data) {
  await PrayerCache.findOneAndUpdate(
    { zone, date: data.date },
    data,
    { upsert: true, new: true }
  );

  console.log(`💾 Saved ${zone} ${data.date} to DB`);
}



// ============================================
//   DEBUG ENDPOINT — Force-Save JAKIM to DB
// ============================================
router.get('/debug/save/:zone', async (req, res) => {
  const zone = req.params.zone;

  try {
    const data = await fetchJAKIM(zone);
    await saveToDB(zone, data);

    res.json({
      success: true,
      message: `✅ Saved fresh JAKIM for ${zone}`,
      data
    });
  } catch (e) {
    res.status(500).json({
      success: false,
      error: e.message
    });
  }
});



// ============================================
//  Coordinates → Zone (Official)
// ============================================
router.get('/coordinates/:lat/:lng', async (req, res) => {
  const { lat, lng } = req.params;

  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      { headers: { "User-Agent": "MuslimDiary/3.0" } }
    );

    const addr = response.data.address;
    const zone = detectJakimZone(addr);

    res.json({
      success: true,
      data: {
        zone,
        locationName: response.data.display_name
      }
    });

  } catch (error) {
    console.error("Reverse geocode failed:", error.message);

    res.json({
      success: false,
      data: {
        zone: "WLY01",
        locationName: "Kuala Lumpur (fallback)"
      }
    });
  }
});



// ============================================
//  Main endpoint: /api/prayertimes/:zone
// ============================================
router.get('/:zone', async (req, res) => {
  const zone = req.params.zone;

  try {
    // 1) RAM Cache
    const cached = prayerCache.get(zone);
    if (cached) {
      return res.json({
        success: true,
        data: cached,
        source: cached.source
      });
    }

    let result;

    // 2) Try JAKIM
    try {
      result = await fetchJAKIM(zone);
      await saveToDB(zone, result);
      prayerCache.set(zone, result);
    } catch (err) {
      console.log(`⚠️ JAKIM failed for ${zone}, using DB fallback`);
      result = await loadDBFallback(zone);

      if (!result) {
        return res.status(503).json({
          success: false,
          error: "No JAKIM data available (live or cached).",
          source: "no-fallback"
        });
      }

      prayerCache.set(zone, result);
    }

    return res.json({
      success: true,
      data: result,
      source: result.source
    });

  } catch (error) {
    console.error("💥 PrayerTimes route error:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;