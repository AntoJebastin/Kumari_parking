/**
 * Format an amount strictly in Indian Rupees (INR / ₹).
 * Never formats in USD or any other currency.
 */
export function formatINR(amount) {
  const num = Number(amount);
  if (Number.isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: num % 1 === 0 ? 0 : 2,
  }).format(num);
}

/**
 * Format distance in meters (< 1 km) or kilometers.
 */
export function formatDistance(distanceKm) {
  if (distanceKm === null || distanceKm === undefined || Number.isNaN(Number(distanceKm))) {
    return null;
  }
  const km = Number(distanceKm);
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Client-side Haversine helper (used for instant UI sorting when GPS coordinates are captured;
 * authoritative distance sorting is performed on the FastAPI backend in Phase 7).
 */
export function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
