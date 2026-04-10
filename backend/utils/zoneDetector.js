const jakimZones = require("./jakimZones");

function norm(v) {
  return (v || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function extractCandidates(address) {
  return [
    address.suburb,
    address.neighbourhood,
    address.village,
    address.city,
    address.town,
    address.city_district,
    address.county,
    address.state_district,
    address.state,
  ]
    .filter(Boolean)
    .map(norm);
}

function detectJakimZone(address) {
  if (!address) return null;

  const candidates = extractCandidates(address);

  // 1️⃣ Try exact district match (preferred)
  for (const stateKey of Object.keys(jakimZones)) {
    const zones = jakimZones[stateKey];

    for (const zoneCode of Object.keys(zones)) {
      for (const district of zones[zoneCode]) {
        const d = norm(district);
        if (candidates.some(c => c.includes(d))) {
          return zoneCode;
        }
      }
    }
  }

  // 2️⃣ Fallback: state-level default (data-driven)
  const stateName = norm(address.state);

  for (const stateKey of Object.keys(jakimZones)) {
    if (norm(stateKey).includes(stateName)) {
      const zones = jakimZones[stateKey];
      return Object.keys(zones)[0]; // first zone defined for that state
    }
  }

  // 3️⃣ Absolute last resort
  return null;
}

module.exports = detectJakimZone;
