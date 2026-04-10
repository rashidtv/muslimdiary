const jakimZones = require("./jakimZones");

/**
 * Normalize string for matching
 */
function norm(value) {
  return (value || "")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

/**
 * Extract all possible location names from OSM address
 */
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

/**
 * Pure data-driven JAKIM zone detection
 * NO hardcoded zones
 */
function detectJakimZone(address) {
  if (!address) return null;

  const candidates = extractCandidates(address);

  // Iterate over ALL zones from data
  for (const stateKey of Object.keys(jakimZones)) {
    const zonesInState = jakimZones[stateKey];

    for (const zoneCode of Object.keys(zonesInState)) {
      const districtList = zonesInState[zoneCode];

      for (const district of districtList) {
        const districtNorm = norm(district);

        // Match ANY geolocation candidate
        if (candidates.some(c => c.includes(districtNorm))) {
          return zoneCode;
        }
      }
    }
  }

  // No match found
  return null;
}

module.exports = detectJakimZone;
