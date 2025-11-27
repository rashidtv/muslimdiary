const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const router = express.Router();

// Cache prayer times for 1 hour (adjust TTL as needed)
const prayerCache = new NodeCache({ stdTTL: 3600 });

// Enhanced JAKIM API client with timeout and retries
const JAKIM_CONFIG = {
  timeout: 8000, // 8 second timeout
  retries: 2,
  retryDelay: 1000,
};

async function fetchPrayerTimesFromJakim(zoneCode) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const url = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&period=date&zone=${zoneCode}&date=${dateStr}`;

  for (let attempt = 1; attempt <= JAKIM_CONFIG.retries + 1; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout: JAKIM_CONFIG.timeout,
        headers: {
          'User-Agent': 'MuslimDiaryApp/1.0',
          'Accept': 'application/json',
        },
      });

      if (response.data?.prayerTime?.[0]) {
        console.log(`✅ JAKIM API success for ${zoneCode} on attempt ${attempt}`);
        return response.data.prayerTime[0];
      }
      throw new Error('Invalid response structure from JAKIM API');

    } catch (error) {
      console.warn(`❌ JAKIM API attempt ${attempt} failed for ${zoneCode}:`, error.message);
      
      if (attempt <= JAKIM_CONFIG.retries) {
        await new Promise(resolve => setTimeout(resolve, JAKIM_CONFIG.retryDelay * attempt));
        continue; // Retry
      }
      throw error; // All retries failed
    }
  }
}

// Main prayer times endpoint with caching
router.get('/:zoneCode', async (req, res) => {
  const { zoneCode } = req.params;
  
  try {
    // 1. Try to get from cache first
    const cacheKey = `prayer-${zoneCode}`;
    const cachedTimes = prayerCache.get(cacheKey);
    
    if (cachedTimes) {
      console.log(`📦 Serving cached prayer times for ${zoneCode}`);
      return res.json({
        success: true,
        data: cachedTimes,
        source: 'cache',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Fetch from JAKIM API
    console.log(`🔄 Fetching fresh prayer times for ${zoneCode} from JAKIM`);
    const jakimData = await fetchPrayerTimesFromJakim(zoneCode);
    
    const prayerTimes = {
      fajr: jakimData.fajr,
      dhuhr: jakimData.dhuhr,
      asr: jakimData.asr,
      maghrib: jakimData.maghrib,
      isha: jakimData.isha,
      date: jakimData.date,
      zone: zoneCode
    };

    // 3. Cache successful response
    prayerCache.set(cacheKey, prayerTimes);
    
    // 4. Return to client
    res.json({
      success: true,
      data: prayerTimes,
      source: 'jakim-api',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ All prayer time fetch attempts failed for ${zoneCode}:`, error.message);
    
    res.status(503).json({
      success: false,
      error: 'Temporarily unable to fetch prayer times. Please try again shortly.',
      source: 'error'
    });
  }
});

module.exports = router;