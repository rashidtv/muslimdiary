// backend/utils/jakimCron.js
const cron = require("node-cron");
const PrayerCache = require("../models/PrayerCache");
const { fetchMonthly } = require("./jakimClient");
const zones = require("./jakimZones");

async function syncZone(zone) {
  try {
    console.log(`🔄 Syncing JAKIM monthly for ${zone}...`);
    const records = await fetchMonthly(zone);

    for (const r of records) {
      await PrayerCache.findOneAndUpdate(
        { zone: r.zone, date: r.date },
        r,
        { upsert: true }
      );
    }

    console.log(`✅ Saved ${records.length} records for ${zone}`);
  } catch (err) {
    console.error(`❌ Sync failed for ${zone}:`, err.message);
  }
}

function startJakimCron() {
  // ✅ TEMPORARY: run every minute
  cron.schedule("* * * * *", async () => {
    console.log("⏳ Running JAKIM sync (every minute)");

    const allZones = [];
    for (const group of Object.values(zones)) {
      for (const zoneCode of Object.keys(group)) {
        allZones.push(zoneCode);
      }
    }

    for (const zone of allZones) {
      await syncZone(zone);
    }

    console.log("✅ JAKIM sync cycle finished");
  });
}

module.exports = startJakimCron;