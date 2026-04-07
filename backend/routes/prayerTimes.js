// =========================================================
// ✅ Muslim    • Uses DB as primary source (fast + stable)// ✅ Muslim Diary – Prayer Times API (Final Production Version)
//    • JAKIM monthly sync handled via cron (jakimCron.js)
//    • Daily live fetch used ONLY if DB missing
//    • Full JAKIM zone architecture
// =========================================================

const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");

const PrayerCache = require("../models/PrayerCache");
const detectJakimZone = require("../utils/zoneDetector");
const { fetchDaily } = require("../utils/jakimClient");   // live fallback only

const router = express.Router();

// ✅ RAM cache for 1 hour
const ramCache = new NodeCache({ stdTTL: 3600 });


// =========================================================
// ✅ 1. Coordinates → Zone (Official JAKIM zones via zoneDetector)
// =========================================================
router.get("/coordinates/:lat/:lng", async (req, res) => {
  const { lat, lng } = req.params;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;

    const response = await axios.get(url, {
      headers: { "User-Agent": "MuslimDiary/3.0" },
      timeout: 10000
    });

    const addr = response.data.address;
    const zone = detectJakimZone(addr);
    const locationName = response.data.display_name;

    return res.json({
      success: true,
      data: { zone, locationName }
    });

  } catch (err) {
    console.error("❌ Reverse geocode error:", err.message);

    return res.json({
      success: false,
      data: {
        zone: "WLY01",
        locationName: "Kuala Lumpur (Fallback)"
      }
    });
  }
});


// =========================================================
// ✅ 2. Debug Endpoint – Force-JAKIM Save (Optional for Testing)
// =========================================================
router.get("/debug/save/:zone", async (req, res) => {
  const zone = req.params.zone;

  try {
    const record = await fetchDaily(zone);      // live JAKIM call
    await PrayerCache.findOneAndUpdate(
      { zone, date: record.date },
      record,
      { upsert: true }
    );

    return res.json({
      success: true,
      message: `✅ Forced save for ${zone}`,
      data: record
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// =========================================================
// ✅ Helper: Load DB fallback (today → 7 days back)
// =========================================================
async function dbFallback(zone) {
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today - i * 86400000)
      .toISOString().split("T")[0];

    const record = await PrayerCache.findOne({ zone, date });

    if (record) {
      console.log(`✅ DB fallback used for ${zone} (${date})`);
      return {
        ...record.toObject(),
        source: "db-fallback"
      };
    }
  }

  console.log(`❌ No DB fallback for ${zone}`);
  return null;
}


// =========================================================
// ✅ 3. PRIMARY ROUTE: /api/prayertimes/:zone
//     Uses DB only → fallback to live JAKIM → then DB fallback
// =========================================================
router.get("/:zone", async (req, res) => {
  const zone = req.params.zone;
  const today = new Date().toISOString().split("T")[0];

  try {
    // ✅ 1. RAM cache (fastest)
    const ram = ramCache.get(zone);
    if (ram) {
      return res.json({
        success: true,
        data: ram,
        source: ram.source
      });
    }

    // ✅ 2. DB primary lookup
    let record = await PrayerCache.findOne({ zone, date: today });

    if (record) {
      record = record.toObject();
      record.source = "db-today";
      ramCache.set(zone, record);

      return res.json({
        success: true,
        data: record,
        source: record.source
      });
    }

    console.warn(`⚠️ No DB for ${zone}, trying live JAKIM daily fetch...`);

    // ✅ 3. LAST RESORT: Try daily JAKIM fetch
    try {
      const live = await fetchDaily(zone);
      await PrayerCache.findOneAndUpdate(
        { zone, date: live.date },
        live,
        { upsert: true }
      );

      ramCache.set(zone, live);

      return res.json({
        success: true,
        data: live,
        source: "jakim-live"
      });

    } catch (err) {
      console.warn(`❌ Live JAKIM failed: ${err.message}`);
    }

    // ✅ 4. DB fallback (yesterday → last week)
    const fallback = await dbFallback(zone);

    if (fallback) {
      ramCache.set(zone, fallback);
      return res.json({
        success: true,
        data: fallback,
        source: fallback.source
      });
    }

    // ✅ Nothing worked → total fail
    return res.status(503).json({
      success: false,
      error: "No prayer data available (live & DB failed).",
      source: "no-data"
    });

  } catch (err) {
    console.error("💥 prayerTimes route error:", err);

    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error"
    });
  }
});


// =========================================================
module.exports = router;
