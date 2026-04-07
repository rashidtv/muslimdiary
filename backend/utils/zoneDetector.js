// =====================================
//  zoneDetector.js (Corrected & Robust)
//  GPS → OSM → District → Official JAKIM Zone
// =====================================

const zones = require("./jakimZones");

// Normalize string
const norm = (v) => (v ? v.toString().trim().toLowerCase() : "");

// Extract possible district keywords from OSM
function extractParts(address) {
  return [
    address.suburb,
    address.neighbourhood,
    address.city_district,
    address.city,
    address.town,
    address.village,
    address.state_district,
    address.county,
    address.region,
    address.state
  ].map(norm).filter(Boolean);
}

// State → zone group map
const STATE_MAP = {
  "selangor": "SELANGOR",
  "wilayah persekutuan": "WILAYAH",
  "kuala lumpur": "WILAYAH",
  "putrajaya": "WILAYAH",
  "johor": "JOHOR",
  "kedah": "KEDAH",
  "kelantan": "KELANTAN",
  "melaka": "MELAKA",
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

// Detect zone
function detectJakimZone(address) {
  if (!address) return "WLY01";

  const parts = extractParts(address);
  const state = norm(address.state);
  const groupKey = STATE_MAP[state];

  // ----------------------------------------
  // ✅ PRIORITY 1: Match districts under state
  // ----------------------------------------
  if (groupKey && zones[groupKey]) {
    for (const [zoneCode, districtList] of Object.entries(zones[groupKey])) {
      for (const district of districtList) {
        const d = norm(district);
        if (parts.some((p) => p.includes(d))) {
          console.log(`✅ ZoneDetector: ${district} → ${zoneCode}`);
          return zoneCode;
        }
      }
    }
  }

  // ----------------------------------------
  // ✅ PRIORITY 2: Global fallback match
  // ----------------------------------------
  for (const zoneGroup of Object.values(zones)) {
    for (const [zoneCode, districtList] of Object.entries(zoneGroup)) {
      for (const district of districtList) {
        const d = norm(district);
        if (parts.some((p) => p.includes(d))) {
          console.log(`✅ Fallback match: ${district} → ${zoneCode}`);
          return zoneCode;
        }
      }
    }
  }

  // ----------------------------------------
  // ✅ FINAL: Safe fallback
  // ----------------------------------------
  console.warn("⚠️ ZoneDetector: no match. Defaulting to WLY01.");
  return "WLY01";
}

module.exports = detectJakimZone;