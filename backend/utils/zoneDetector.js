// =====================================
//  zoneDetector.js
//  Detect correct JAKIM zone from OSM address
// =====================================

const zones = require('./jakimZones');

// Normalize strings for safer matching
function normalize(str) {
  return str ? str.toString().trim().toLowerCase() : "";
}

function extractAddressParts(address) {
  return [
    normalize(address.city),
    normalize(address.town),
    normalize(address.village),
    normalize(address.suburb),
    normalize(address.county),
    normalize(address.state_district),
    normalize(address.region),
    normalize(address.state)
  ].filter(Boolean);
}

function detectJakimZone(address) {
  if (!address) return "WLY01";

  // Flatten and normalize district keywords
  const parts = extractAddressParts(address);

  // --- 1) MATCH BY STATE FIRST -------------------
  const state = normalize(address.state);

  // Map OSM state name → group name in jakimZones.js
  const STATE_MAP = {
    "selangor": "SELANGOR",
    "wilayah persekutuan": "WILAYAH",
    "kuala lumpur": "WILAYAH",
    "putrajaya": "WILAYAH",
    "johor": "JOHOR",
    "kedah": "KEDAH",
    "kelantan": "KELANTAN",
    "melaka": "MELAKA",
    "melacca": "MELAKA",
    "malacca": "MELAKA",
    "negeri sembilan": "NEGERI_SEMBILAN",
    "pahang": "PAHANG",
    "perlis": "PERLIS",
    "pulau pinang": "PULAU_PINANG",
    "penang": "PULAU_PINANG",
    "perak": "PERAK",
    "sabah": "SABAH",
    "sarawak": "SARAWAK",
    "terengganu": "TERENGGANU"
  };

  const groupKey = STATE_MAP[state];

  // --- 2) If state recognized → attempt district → zone mapping
  if (groupKey && zones[groupKey]) {
    const zoneGroup = zones[groupKey];

    for (const [zoneCode, districtList] of Object.entries(zoneGroup)) {
      for (const district of districtList) {
        const d = normalize(district);

        if (parts.some(p => p.includes(d))) {
          console.log(`✅ ZoneDetector: Matched district '${district}' → ${zoneCode}`);
          return zoneCode;
        }
      }
    }
  }

  // --- 3) Try GLOBAL catch-all matching (in case state missing in OSM)
  for (const zoneGroup of Object.values(zones)) {
    for (const [zoneCode, districtList] of Object.entries(zoneGroup)) {
      for (const district of districtList) {
        const d = normalize(district);
        if (parts.some(p => p.includes(d))) {
          console.log(`✅ ZoneDetector: Fallback matched '${district}' → ${zoneCode}`);
          return zoneCode;
        }
      }
    }
  }

  // --- 4) Last–resort fallback
  console.warn("⚠️ ZoneDetector: No match found. Using fallback WLY01");
  return "WLY01";
}

module.exports = detectJakimZone;