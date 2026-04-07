// backend/utils/jakimClient.js
const axios = require("axios");

=${today}`;async function fetchDaily(zone) {

  try {
    const res = await axios.get(url, {
      timeout: 12000,
      validateStatus: () => true,
      headers: {
        "User-Agent": "Mozilla/5.0 (MuslimDiaryCron/1.0)",
        "Accept": "application/json",
      },
    });

    if (
      !res.data ||
      !Array.isArray(res.data.prayerTime) ||
      res.data.prayerTime.length === 0
    ) {
      throw new Error("Invalid JAKIM format");
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
    console.error(`❌ JAKIM daily fetch failed for ${zone}:`, err.message);
    throw err;
  }
}

async function fetchMonthly(zone) {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const url =
    `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat` +
    `&period=month&zone=${zone}&month=${month}&year=${year}`;

  try {
    const res = await axios.get(url, {
      timeout: 15000,
      validateStatus: () => true,
      headers: {
        "User-Agent": "Mozilla/5.0 (MuslimDiaryCron/1.0)",
        "Accept": "application/json",
      },
    });

    if (!res.data || !Array.isArray(res.data.prayerTime)) {
      throw new Error("Invalid JAKIM monthly structure");
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
    console.error(`❌ JAKIM monthly fetch FAILED for ${zone}`, err.message);
    throw err;
  }
}

module.exports = { fetchDaily, fetchMonthly };
  const today = new Date().toISOString().split("T")[0];

  const url =
    `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat` +
