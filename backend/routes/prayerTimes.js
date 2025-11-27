const express = require('express');
const router = express.Router();
const axios = require('axios');

// Configuration constants
const JAKIM_CONFIG = {
  BASE_URL: 'https://www.e-solat.gov.my/index.php',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1000,
  HEADERS: {
    'User-Agent': 'MuslimDiaryApp/2.4.0 (https://muslimdiary-whur.onrender.com)',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9'
  }
};

// Enhanced Malaysia coordinate to zone mapping
const MALAYSIA_ZONES = [
  // Johor
  { code: 'JHR01', latMin: 2.0, latMax: 2.8, lngMin: 103.8, lngMax: 104.5, state: 'Johor', name: 'Pulau Aur dan Pulau Pemanggil' },
  { code: 'JHR02', latMin: 1.4, latMax: 2.0, lngMin: 103.5, lngMax: 104.2, state: 'Johor', name: 'Johor Bahru, Kota Tinggi, Mersing, Kulai' },
  { code: 'JHR03', latMin: 1.8, latMax: 2.3, lngMin: 102.8, lngMax: 103.5, state: 'Johor', name: 'Kluang, Pontian' },
  { code: 'JHR04', latMin: 1.8, latMax: 2.5, lngMin: 102.5, lngMax: 103.2, state: 'Johor', name: 'Batu Pahat, Muar, Segamat, Gemas Johor, Tangkak' },

  // Kedah
  { code: 'KDH01', latMin: 5.8, latMax: 6.5, lngMin: 100.1, lngMax: 100.6, state: 'Kedah', name: 'Kota Setar, Kubang Pasu, Pokok Sena' },
  { code: 'KDH02', latMin: 5.6, latMax: 6.0, lngMin: 100.3, lngMax: 100.8, state: 'Kedah', name: 'Kuala Muda, Yan, Pendang' },
  { code: 'KDH03', latMin: 6.0, latMax: 6.5, lngMin: 100.6, lngMax: 101.0, state: 'Kedah', name: 'Padang Terap, Sik' },
  { code: 'KDH04', latMin: 5.6, latMax: 6.0, lngMin: 100.8, lngMax: 101.2, state: 'Kedah', name: 'Baling' },
  { code: 'KDH05', latMin: 5.3, latMax: 5.7, lngMin: 100.5, lngMax: 100.9, state: 'Kedah', name: 'Bandar Baharu, Kulim' },
  { code: 'KDH06', latMin: 6.2, latMax: 6.5, lngMin: 99.7, lngMax: 100.0, state: 'Kedah', name: 'Langkawi' },
  { code: 'KDH07', latMin: 5.8, latMax: 6.0, lngMin: 100.6, lngMax: 100.8, state: 'Kedah', name: 'Puncak Gunung Jerai' },

  // Kelantan
  { code: 'KTN01', latMin: 5.5, latMax: 6.2, lngMin: 101.8, lngMax: 102.5, state: 'Kelantan', name: 'Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku' },
  { code: 'KTN02', latMin: 4.5, latMax: 5.5, lngMin: 101.5, lngMax: 102.5, state: 'Kelantan', name: 'Gua Musang, Jeli, Jajahan Kecil Lojing' },

  // Melaka
  { code: 'MLK01', latMin: 2.1, latMax: 2.5, lngMin: 102.1, lngMax: 102.4, state: 'Melaka', name: 'SELURUH NEGERI MELAKA' },

  // Negeri Sembilan
  { code: 'NGS01', latMin: 2.4, latMax: 2.8, lngMin: 102.1, lngMax: 102.5, state: 'Negeri Sembilan', name: 'Tampin, Jempol' },
  { code: 'NGS02', latMin: 2.6, latMax: 3.1, lngMin: 101.9, lngMax: 102.3, state: 'Negeri Sembilan', name: 'Jelebu, Kuala Pilah, Rembau' },
  { code: 'NGS03', latMin: 2.4, latMax: 2.8, lngMin: 101.7, lngMax: 102.1, state: 'Negeri Sembilan', name: 'Port Dickson, Seremban' },

  // Pahang
  { code: 'PHG01', latMin: 2.7, latMax: 2.9, lngMin: 104.1, lngMax: 104.3, state: 'Pahang', name: 'Pulau Tioman' },
  { code: 'PHG02', latMin: 3.4, latMax: 4.0, lngMin: 102.9, lngMax: 103.6, state: 'Pahang', name: 'Kuantan, Pekan, Muadzam Shah' },
  { code: 'PHG03', latMin: 3.2, latMax: 4.0, lngMin: 102.0, lngMax: 103.0, state: 'Pahang', name: 'Jerantut, Temerloh, Maran, Bera, Chenor, Jengka' },
  { code: 'PHG04', latMin: 3.3, latMax: 4.0, lngMin: 101.5, lngMax: 102.3, state: 'Pahang', name: 'Bentong, Lipis, Raub' },
  { code: 'PHG05', latMin: 3.2, latMax: 3.4, lngMin: 101.7, lngMax: 101.9, state: 'Pahang', name: 'Genting Sempah, Janda Baik, Bukit Tinggi' },
  { code: 'PHG06', latMin: 4.3, latMax: 4.7, lngMin: 101.3, lngMax: 101.5, state: 'Pahang', name: 'Cameron Highlands, Genting Highlands, Bukit Fraser' },
  { code: 'PHG07', latMin: 2.5, latMax: 3.2, lngMin: 103.0, lngMax: 103.8, state: 'Pahang', name: 'Zon Khas Daerah Rompin' },

  // Perlis
  { code: 'PLS01', latMin: 6.3, latMax: 6.7, lngMin: 100.1, lngMax: 100.4, state: 'Perlis', name: 'Kangar, Padang Besar, Arau' },

  // Pulau Pinang
  { code: 'PNG01', latMin: 5.1, latMax: 5.5, lngMin: 100.2, lngMax: 100.5, state: 'Pulau Pinang', name: 'Seluruh Negeri Pulau Pinang' },

  // Perak
  { code: 'PRK01', latMin: 3.8, latMax: 4.3, lngMin: 101.0, lngMax: 101.5, state: 'Perak', name: 'Tapah, Slim River, Tanjung Malim' },
  { code: 'PRK02', latMin: 4.3, latMax: 5.0, lngMin: 100.8, lngMax: 101.3, state: 'Perak', name: 'Kuala Kangsar, Sg. Siput, Ipoh, Batu Gajah, Kampar' },
  { code: 'PRK03', latMin: 5.0, latMax: 5.8, lngMin: 100.8, lngMax: 101.3, state: 'Perak', name: 'Lenggong, Pengkalan Hulu, Grik' },
  { code: 'PRK04', latMin: 5.3, latMax: 5.8, lngMin: 101.1, lngMax: 101.5, state: 'Perak', name: 'Temengor, Belum' },
  { code: 'PRK05', latMin: 3.8, latMax: 4.5, lngMin: 100.6, lngMax: 101.1, state: 'Perak', name: 'Kg Gajah, Teluk Intan, Bagan Datuk, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor' },
  { code: 'PRK06', latMin: 4.7, latMax: 5.2, lngMin: 100.5, lngMax: 100.9, state: 'Perak', name: 'Selama, Taiping, Bagan Serai, Parit Buntar' },
  { code: 'PRK07', latMin: 4.8, latMax: 5.0, lngMin: 100.8, lngMax: 101.0, state: 'Perak', name: 'Bukit Larut' },

  // Sabah
  { code: 'SBH01', latMin: 5.5, latMax: 6.5, lngMin: 117.5, lngMax: 119.0, state: 'Sabah', name: 'Sandakan, Bukit Garam, Semawang, Temanggong, Tambisan' },
  { code: 'SBH02', latMin: 5.0, latMax: 6.0, lngMin: 116.5, lngMax: 118.0, state: 'Sabah', name: 'Beluran, Telupid, Pinangah, Terusan, Kuamut' },
  { code: 'SBH03', latMin: 4.0, latMax: 5.5, lngMin: 117.5, lngMax: 119.0, state: 'Sabah', name: 'Lahad Datu, Silabukan, Kunak, Sahabat, Sempurna, Tungku' },
  { code: 'SBH04', latMin: 4.0, latMax: 5.0, lngMin: 117.0, lngMax: 118.5, state: 'Sabah', name: 'Tawau, Balong, Merotai, Kalabakan' },
  { code: 'SBH05', latMin: 6.5, latMax: 7.5, lngMin: 116.5, lngMax: 117.5, state: 'Sabah', name: 'Kudat, Kota Marudu, Pitas, Pulau Banggi' },
  { code: 'SBH06', latMin: 5.8, latMax: 6.5, lngMin: 116.0, lngMax: 116.8, state: 'Sabah', name: 'Gunung Kinabalu' },
  { code: 'SBH07', latMin: 5.5, latMax: 6.5, lngMin: 115.5, lngMax: 116.5, state: 'Sabah', name: 'Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan' },
  { code: 'SBH08', latMin: 4.5, latMax: 6.0, lngMin: 115.5, lngMax: 117.0, state: 'Sabah', name: 'Pensiangan, Keningau, Tambunan, Nabawan' },
  { code: 'SBH09', latMin: 5.0, latMax: 5.8, lngMin: 115.0, lngMax: 116.0, state: 'Sabah', name: 'Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pasia, Membakut, Weston' },

  // Sarawak
  { code: 'SWK01', latMin: 4.5, latMax: 5.0, lngMin: 114.8, lngMax: 115.5, state: 'Sarawak', name: 'Limbang, Lawas, Sundar, Trusan' },
  { code: 'SWK02', latMin: 3.5, latMax: 4.5, lngMin: 113.5, lngMax: 114.5, state: 'Sarawak', name: 'Miri, Niah, Bekenu, Sibuti, Marudi' },
  { code: 'SWK03', latMin: 2.5, latMax: 3.5, lngMin: 112.5, lngMax: 114.0, state: 'Sarawak', name: 'Pandan, Belaga, Suai, Tatau, Sebauh, Bintulu' },
  { code: 'SWK04', latMin: 1.5, latMax: 2.5, lngMin: 111.0, lngMax: 113.5, state: 'Sarawak', name: 'Sibu, Mukah, Dalat, Song, Igan, Oya, Balingian, Kanowit, Kapit' },
  { code: 'SWK05', latMin: 1.5, latMax: 2.5, lngMin: 110.5, lngMax: 112.0, state: 'Sarawak', name: 'Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai' },
  { code: 'SWK06', latMin: 1.0, latMax: 2.0, lngMin: 110.5, lngMax: 111.5, state: 'Sarawak', name: 'Lubok Antu, Sri Aman, Roban, Debak, Kabong, Lingga, Engkelili, Betong, Spaoh, Pusa, Saratok' },
  { code: 'SWK07', latMin: 1.0, latMax: 1.8, lngMin: 110.0, lngMax: 111.0, state: 'Sarawak', name: 'Serian, Simunjan, Samarahan, Sebuyau, Meludam' },
  { code: 'SWK08', latMin: 1.0, latMax: 2.0, lngMin: 109.5, lngMax: 110.5, state: 'Sarawak', name: 'Kuching, Bau, Lundu, Sematan' },
  { code: 'SWK09', latMin: 1.5, latMax: 2.0, lngMin: 111.5, lngMax: 112.0, state: 'Sarawak', name: 'Zon Khas (Kampung Patarikan)' },

  // Selangor
  { code: 'SGR01', latMin: 2.8, latMax: 3.4, lngMin: 101.4, lngMax: 101.9, state: 'Selangor', name: 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, S.Alam' },
  { code: 'SGR02', latMin: 3.4, latMax: 3.8, lngMin: 101.0, lngMax: 101.6, state: 'Selangor', name: 'Kuala Selangor, Sabak Bernam' },
  { code: 'SGR03', latMin: 2.7, latMax: 3.1, lngMin: 101.3, lngMax: 101.6, state: 'Selangor', name: 'Klang, Kuala Langat' },

  // Terengganu
  { code: 'TRG01', latMin: 5.0, latMax: 5.5, lngMin: 102.8, lngMax: 103.3, state: 'Terengganu', name: 'Kuala Terengganu, Marang, Kuala Nerus' },
  { code: 'TRG02', latMin: 5.5, latMax: 6.0, lngMin: 102.4, lngMax: 103.0, state: 'Terengganu', name: 'Besut, Setiu' },
  { code: 'TRG03', latMin: 4.5, latMax: 5.5, lngMin: 102.5, lngMax: 103.2, state: 'Terengganu', name: 'Hulu Terengganu' },
  { code: 'TRG04', latMin: 4.0, latMax: 5.0, lngMin: 103.0, lngMax: 103.8, state: 'Terengganu', name: 'Dungun, Kemaman' },

  // Wilayah Persekutuan
  { code: 'WLY01', latMin: 2.9, latMax: 3.3, lngMin: 101.6, lngMax: 101.8, state: 'Wilayah Persekutuan', name: 'Kuala Lumpur, Putrajaya' },
  { code: 'WLY02', latMin: 5.2, latMax: 5.4, lngMin: 115.1, lngMax: 115.3, state: 'Wilayah Persekutuan', name: 'Labuan' }
];

// Zone to location name mapping
const ZONE_NAME_MAP = {
  // Johor
  'JHR01': 'Pulau Aur dan Pulau Pemanggil',
  'JHR02': 'Johor Bahru, Kota Tinggi, Mersing, Kulai',
  'JHR03': 'Kluang, Pontian',
  'JHR04': 'Batu Pahat, Muar, Segamat, Gemas Johor, Tangkak',
  
  // Kedah
  'KDH01': 'Kota Setar, Kubang Pasu, Pokok Sena',
  'KDH02': 'Kuala Muda, Yan, Pendang',
  'KDH03': 'Padang Terap, Sik',
  'KDH04': 'Baling',
  'KDH05': 'Bandar Baharu, Kulim',
  'KDH06': 'Langkawi',
  'KDH07': 'Puncak Gunung Jerai',
  
  // Kelantan
  'KTN01': 'Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat, Kuala Krai, Mukim Chiku',
  'KTN02': 'Gua Musang, Jeli, Jajahan Kecil Lojing',
  
  // Melaka
  'MLK01': 'SELURUH NEGERI MELAKA',
  
  // Negeri Sembilan
  'NGS01': 'Tampin, Jempol',
  'NGS02': 'Jelebu, Kuala Pilah, Rembau',
  'NGS03': 'Port Dickson, Seremban',
  
  // Pahang
  'PHG01': 'Pulau Tioman',
  'PHG02': 'Kuantan, Pekan, Muadzam Shah',
  'PHG03': 'Jerantut, Temerloh, Maran, Bera, Chenor, Jengka',
  'PHG04': 'Bentong, Lipis, Raub',
  'PHG05': 'Genting Sempah, Janda Baik, Bukit Tinggi',
  'PHG06': 'Cameron Highlands, Genting Highlands, Bukit Fraser',
  'PHG07': 'Zon Khas Daerah Rompin',
  
  // Perlis
  'PLS01': 'Kangar, Padang Besar, Arau',
  
  // Pulau Pinang
  'PNG01': 'Seluruh Negeri Pulau Pinang',
  
  // Perak
  'PRK01': 'Tapah, Slim River, Tanjung Malim',
  'PRK02': 'Kuala Kangsar, Sg. Siput, Ipoh, Batu Gajah, Kampar',
  'PRK03': 'Lenggong, Pengkalan Hulu, Grik',
  'PRK04': 'Temengor, Belum',
  'PRK05': 'Kg Gajah, Teluk Intan, Bagan Datuk, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor',
  'PRK06': 'Selama, Taiping, Bagan Serai, Parit Buntar',
  'PRK07': 'Bukit Larut',
  
  // Sabah
  'SBH01': 'Sandakan, Bukit Garam, Semawang, Temanggong, Tambisan',
  'SBH02': 'Beluran, Telupid, Pinangah, Terusan, Kuamut',
  'SBH03': 'Lahad Datu, Silabukan, Kunak, Sahabat, Sempurna, Tungku',
  'SBH04': 'Tawau, Balong, Merotai, Kalabakan',
  'SBH05': 'Kudat, Kota Marudu, Pitas, Pulau Banggi',
  'SBH06': 'Gunung Kinabalu',
  'SBH07': 'Kota Kinabalu, Ranau, Kota Belud, Tuaran, Penampang, Papar, Putatan',
  'SBH08': 'Pensiangan, Keningau, Tambunan, Nabawan',
  'SBH09': 'Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pasia, Membakut, Weston',
  
  // Selangor
  'SGR01': 'Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, S.Alam',
  'SGR02': 'Kuala Selangor, Sabak Bernam',
  'SGR03': 'Klang, Kuala Langat',
  
  // Sarawak
  'SWK01': 'Limbang, Lawas, Sundar, Trusan',
  'SWK02': 'Miri, Niah, Bekenu, Sibuti, Marudi',
  'SWK03': 'Pandan, Belaga, Suai, Tatau, Sebauh, Bintulu',
  'SWK04': 'Sibu, Mukah, Dalat, Song, Igan, Oya, Balingian, Kanowit, Kapit',
  'SWK05': 'Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai',
  'SWK06': 'Lubok Antu, Sri Aman, Roban, Debak, Kabong, Lingga, Engkelili, Betong, Spaoh, Pusa, Saratok',
  'SWK07': 'Serian, Simunjan, Samarahan, Sebuyau, Meludam',
  'SWK08': 'Kuching, Bau, Lundu, Sematan',
  'SWK09': 'Zon Khas (Kampung Patarikan)',
  
  // Terengganu
  'TRG01': 'Kuala Terengganu, Marang, Kuala Nerus',
  'TRG02': 'Besut, Setiu',
  'TRG03': 'Hulu Terengganu',
  'TRG04': 'Dungun, Kemaman',
  
  // Wilayah Persekutuan
  'WLY01': 'Kuala Lumpur, Putrajaya',
  'WLY02': 'Labuan'
};

// Fallback prayer times for when JAKIM API fails
const FALLBACK_PRAYER_TIMES = {
  'WLY01': { fajr: '05:49', dhuhr: '13:00', asr: '16:19', maghrib: '18:59', isha: '20:10' },
  'SGR01': { fajr: '05:45', dhuhr: '13:05', asr: '16:25', maghrib: '19:05', isha: '20:15' },
  'SGR02': { fajr: '05:50', dhuhr: '13:10', asr: '16:30', maghrib: '19:10', isha: '20:20' },
  'SGR03': { fajr: '05:47', dhuhr: '13:07', asr: '16:27', maghrib: '19:07', isha: '20:17' }
};

// Utility functions
const findZoneFromCoordinates = (lat, lng) => {
  // Find exact match first
  for (const zone of MALAYSIA_ZONES) {
    if (lat >= zone.latMin && lat <= zone.latMax && 
        lng >= zone.lngMin && lng <= zone.lngMax) {
      console.log(`📍 Coordinates ${lat}, ${lng} → ${zone.state} ${zone.code}`);
      return zone.code;
    }
  }

  // Find closest zone by distance
  const closestZone = findClosestZoneByDistance(lat, lng);
  console.log(`📍 No exact match for ${lat}, ${lng} → Using closest: ${closestZone}`);
  return closestZone;
};

const findClosestZoneByDistance = (lat, lng) => {
  let closestZone = 'WLY01';
  let shortestDistance = Number.MAX_SAFE_INTEGER;

  MALAYSIA_ZONES.forEach(zone => {
    const zoneCenterLat = (zone.latMin + zone.latMax) / 2;
    const zoneCenterLng = (zone.lngMin + zone.lngMax) / 2;
    
    // Haversine distance calculation
    const R = 6371;
    const dLat = (zoneCenterLat - lat) * Math.PI / 180;
    const dLng = (zoneCenterLng - lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat * Math.PI / 180) * Math.cos(zoneCenterLat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestZone = zone.code;
    }
  });

  console.log(`📍 Using nearest zone: ${closestZone} (${Math.round(shortestDistance)}km away)`);
  return closestZone;
};

const getLocationNameFromZone = (zoneCode) => {
  return ZONE_NAME_MAP[zoneCode] || `Zone ${zoneCode}`;
};

const getFallbackPrayerTimes = (zoneCode) => {
  const times = FALLBACK_PRAYER_TIMES[zoneCode] || FALLBACK_PRAYER_TIMES['WLY01'];
  const locationName = getLocationNameFromZone(zoneCode);
  
  return {
    ...times,
    date: new Date().toISOString().split('T')[0],
    zone: zoneCode,
    locationName: locationName,
    source: 'fallback-cached',
    cached: true
  };
};

// Enhanced JAKIM API caller with retry logic
const fetchFromJAKIM = async (zoneCode, attempt = 0) => {
  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    const response = await axios.get(JAKIM_CONFIG.BASE_URL, {
      params: {
        r: 'esolatApi/takwimsolat',
        period: 'date',
        zone: zoneCode,
        date: dateStr
      },
      timeout: JAKIM_CONFIG.TIMEOUT,
      headers: JAKIM_CONFIG.HEADERS
    });

    if (response.data.prayerTime && response.data.prayerTime.length > 0) {
      return response.data.prayerTime[0];
    }
    
    throw new Error('No prayer times data in response');

  } catch (error) {
    if (attempt < JAKIM_CONFIG.RETRY_ATTEMPTS) {
      console.log(`🔄 Retrying JAKIM API (attempt ${attempt + 1})...`);
      await new Promise(resolve => setTimeout(resolve, JAKIM_CONFIG.RETRY_DELAY * (attempt + 1)));
      return fetchFromJAKIM(zoneCode, attempt + 1);
    }
    throw error;
  }
};

// ==================== ROUTES ====================

// Get zone from coordinates
router.get('/coordinates/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    console.log(`📍 Getting zone for coordinates: ${latitude}, ${longitude}`);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < 0.5 || latitude > 7.5 || 
        longitude < 99.0 || longitude > 120.0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Must be within Malaysia boundaries.'
      });
    }

    const zoneCode = findZoneFromCoordinates(latitude, longitude);
    const locationName = getLocationNameFromZone(zoneCode);
    
    console.log(`✅ Coordinates ${latitude}, ${longitude} → Zone ${zoneCode}: ${locationName}`);

    res.json({
      success: true,
      data: {
        zone: zoneCode,
        locationName: locationName,
        coordinates: { latitude, longitude }
      }
    });
  } catch (error) {
    console.error('Coordinate to zone conversion error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to convert coordinates to zone: ' + error.message
    });
  }
});

// Get prayer times from coordinates
router.get('/coordinates-prayer/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    console.log(`📍 Getting prayer times for coordinates: ${latitude}, ${longitude}`);

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < 0.5 || latitude > 7.5 || 
        longitude < 99.0 || longitude > 120.0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid coordinates. Must be within Malaysia boundaries.'
      });
    }

    const zoneCode = findZoneFromCoordinates(latitude, longitude);
    const locationName = getLocationNameFromZone(zoneCode);
    
    console.log(`✅ Coordinates ${latitude}, ${longitude} → Zone ${zoneCode}: ${locationName}`);

    let prayerTimes;
    let source = 'jakim-official';

    try {
      const jakimData = await fetchFromJAKIM(zoneCode);
      prayerTimes = {
        fajr: jakimData.fajr,
        dhuhr: jakimData.dhuhr,
        asr: jakimData.asr,
        maghrib: jakimData.maghrib,
        isha: jakimData.isha,
        date: jakimData.date,
        hijri: jakimData.hijri
      };
    } catch (error) {
      console.log('JAKIM API failed, using fallback:', error.message);
      prayerTimes = getFallbackPrayerTimes(zoneCode);
      source = 'fallback-cached';
    }

    res.json({
      success: true,
      data: {
        ...prayerTimes,
        zone: zoneCode,
        locationName: locationName,
        coordinates: { latitude, longitude }
      },
      source: source
    });
  } catch (error) {
    console.error('Coordinate prayer time error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prayer times from coordinates: ' + error.message
    });
  }
});

// Zone-based prayer times route
router.get('/:zoneCode', async (req, res) => {
  try {
    const { zoneCode } = req.params;
    
    if (!zoneCode || zoneCode.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid zone code format'
      });
    }

    const locationName = getLocationNameFromZone(zoneCode);
    console.log(`🕌 Fetching prayer times for ${locationName} (${zoneCode})`);

    let prayerTimes;
    let source = 'jakim-official';

    try {
      const jakimData = await fetchFromJAKIM(zoneCode);
      prayerTimes = {
        fajr: jakimData.fajr,
        dhuhr: jakimData.dhuhr,
        asr: jakimData.asr,
        maghrib: jakimData.maghrib,
        isha: jakimData.isha,
        date: jakimData.date,
        hijri: jakimData.hijri,
        day: jakimData.day,
        zone: zoneCode,
        locationName: locationName
      };
      
      console.log(`✅ JAKIM prayer times for ${zoneCode}:`, {
        fajr: prayerTimes.fajr,
        dhuhr: prayerTimes.dhuhr,
        asr: prayerTimes.asr,
        maghrib: prayerTimes.maghrib,
        isha: prayerTimes.isha
      });
    } catch (error) {
      console.log('JAKIM API failed, using fallback:', error.message);
      prayerTimes = getFallbackPrayerTimes(zoneCode);
      source = 'fallback-cached';
    }

    res.json({
      success: true,
      data: prayerTimes,
      source: source,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Prayer times fetch error:', error);
    
    if (error.code === 'ECONNABORTED') {
      res.status(504).json({
        success: false,
        error: 'JAKIM API timeout - please try again',
        fallback: true
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch prayer times: ' + error.message,
        fallback: true
      });
    }
  }
});

// Get location name from zone
router.get('/location/:zoneCode', async (req, res) => {
  try {
    const { zoneCode } = req.params;
    
    if (!zoneCode) {
      return res.status(400).json({
        success: false,
        error: 'Zone code is required'
      });
    }

    const locationName = getLocationNameFromZone(zoneCode);
    
    res.json({
      success: true,
      data: {
        zone: zoneCode,
        locationName: locationName
      }
    });
  } catch (error) {
    console.error('Location name error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get location name: ' + error.message
    });
  }
});

// Test endpoint
router.get('/test/:zoneCode', async (req, res) => {
  try {
    const { zoneCode } = req.params;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    
    const apiUrl = `${JAKIM_CONFIG.BASE_URL}?r=esolatApi/takwimsolat&period=date&zone=${zoneCode}&date=${dateStr}`;
    const locationName = getLocationNameFromZone(zoneCode);
    
    console.log('🔗 Testing JAKIM API URL:', apiUrl);
    
    const response = await axios.get(apiUrl, { 
      timeout: JAKIM_CONFIG.TIMEOUT,
      headers: JAKIM_CONFIG.HEADERS
    });
    
    res.json({
      success: true,
      apiUrl: apiUrl,
      response: response.data,
      zone: zoneCode,
      locationName: locationName,
      date: dateStr
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      apiUrl: `${JAKIM_CONFIG.BASE_URL}?r=esolatApi/takwimsolat&period=date&zone=${req.params.zoneCode}&date=...`
    });
  }
});

module.exports = router;