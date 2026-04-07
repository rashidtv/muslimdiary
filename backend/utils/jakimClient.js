// =======================================================
// ✅ jakimClient.js
//    Fetch daily or monthly prayer times from JAKIM
//    Clean, safe, syntax-correct version
// =======================================================

const axios = require("axios");

// -------------------------------------------------------
// ✅ Fetch DAILY prayer times from JAKIM
// -------------------------------------------------------
async function fetchDaily(zone) {
  const today = new Date().toISOString().split("T")[0];

  const url =
    `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat` +
    `&period=date&zone=${zone}&date=${today}`;

  console.log(`🌙 JAKIM daily fetch for ${zone}`);

  try {
    const res = await axios.get(url, {
      timeout: 15000,
      validateStatus: () => true,
      headers: {
        "User-Agent": "Mozilla/5.0 (MuslimDiaryCron/1.0)",
        Accept: "application/json",
      },
    });

    if (
      !res.data ||
      typeof res.data !== "object" ||
      !Array.isArray(res.data.prayerTime) ||
      res.data.prayerTime.length === 0
    ) {
      throw new Error("Invalid JAKIM response");
    }

    const p = res.data.prayerTime[0];

    return {
      fajr: p.fajr,
      dhuhr: p.dhuhr,
      asr: p.asr,
      maghrib: p.maghrib,
      isha: p.isha,
      date: today,
      zone,
      source: "jakim-live",
    };
  } catch (err) {
    console.error(`❌ JAKIM daily fetch FAILED for ${zone}:`, err.message);
    throw err;
  }
}

// -------------------------------------------------------
// ✅ Fetch MONTHLY prayer times from JAKIM
// -------------------------------------------------------
async function fetchMonthly(zone) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const url =
    `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat` +
    `&period=month&zone=${zone}&month=${month}&year=${year}`;

  console.log(`📅 JAKIM monthly fetch for ${zone}`);

  try {
    const res = await axios.get(url, {
      timeout: 20000,
      validateStatus: () => true,
      headers: {
        "User-Agent": "Mozilla/5.0 (MuslimDiaryCron/1.0)",
        Accept: "application/json",
      },
    });

    if (!res.data || !Array.isArray(res.data.prayerTime)) {
      throw new Error("Invalid JAKIM monthly format");
    }

    return res.data.prayerTime.map((p) => ({
      fajr: p.fajr,
      dhuhr: p.dhuhr,
      asr: p.asr,
      maghrib: p.maghrib,
      isha: p.isha,
      date: p.date,
      zone,
      source: "jakim-monthly",
    }));
  } catch (err) {
    console.error(`❌ JAKIM monthly fetch FAILED for ${zone}:`, err.message);
    throw err;
  }
}

module.exports = { fetchDaily, fetchMonthly };
``