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
        { zone, date: r.date },
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
  cron.schedule("1 0 * * *", async () => {
    console.log("⏳ Running nightly JAKIM sync...");

    const allZones = [];

    for (const group of Object.values(zones)) {
      for (const zoneCode of Object.keys(group)) {
        allZones.push(zoneCode);
      }
    }

    for (const z of allZones) {
      await syncZone(z);
    }

    console.log("✅ JAKIM sync complete");
  });
}

module.exports = startJakimCron;