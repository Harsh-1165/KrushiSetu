/**
 * Geographic Utilities
 * Distance calculations and location helpers
 */

/**
 * Earth radius in kilometers
 */
const EARTH_RADIUS_KM = 6371
const EARTH_RADIUS_MILES = 3959

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180)
}

/**
 * Convert radians to degrees
 */
const toDegrees = (radians) => {
  return radians * (180 / Math.PI)
}

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @param {string} unit - Unit of measurement ('km' or 'miles')
 * @returns {number} Distance between points
 */
const calculateDistance = (lat1, lng1, lat2, lng2, unit = "km") => {
  const R = unit === "miles" ? EARTH_RADIUS_MILES : EARTH_RADIUS_KM

  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Calculate bearing between two points
 * @returns {number} Bearing in degrees (0-360)
 */
const calculateBearing = (lat1, lng1, lat2, lng2) => {
  const dLng = toRadians(lng2 - lng1)
  const lat1Rad = toRadians(lat1)
  const lat2Rad = toRadians(lat2)

  const x = Math.sin(dLng) * Math.cos(lat2Rad)
  const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

  const bearing = toDegrees(Math.atan2(x, y))
  return (bearing + 360) % 360
}

/**
 * Get cardinal direction from bearing
 */
const getCardinalDirection = (bearing) => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const index = Math.round(bearing / 45) % 8
  return directions[index]
}

/**
 * Calculate destination point given start, bearing and distance
 * @param {number} lat - Starting latitude
 * @param {number} lng - Starting longitude
 * @param {number} bearing - Bearing in degrees
 * @param {number} distance - Distance in km
 * @returns {Object} Destination coordinates
 */
const calculateDestination = (lat, lng, bearing, distance) => {
  const R = EARTH_RADIUS_KM
  const d = distance / R

  const lat1 = toRadians(lat)
  const lng1 = toRadians(lng)
  const bearingRad = toRadians(bearing)

  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearingRad))

  const lng2 =
    lng1 +
    Math.atan2(Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2))

  return {
    lat: toDegrees(lat2),
    lng: toDegrees(lng2),
  }
}

/**
 * Get bounding box for a center point and radius
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radius - Radius in km
 * @returns {Object} Bounding box coordinates
 */
const getBoundingBox = (lat, lng, radius) => {
  const R = EARTH_RADIUS_KM
  const latRad = toRadians(lat)

  const deltaLat = radius / R
  const deltaLng = radius / (R * Math.cos(latRad))

  return {
    minLat: lat - toDegrees(deltaLat),
    maxLat: lat + toDegrees(deltaLat),
    minLng: lng - toDegrees(deltaLng),
    maxLng: lng + toDegrees(deltaLng),
  }
}

/**
 * Check if point is within radius of center
 */
const isWithinRadius = (centerLat, centerLng, pointLat, pointLng, radius, unit = "km") => {
  const distance = calculateDistance(centerLat, centerLng, pointLat, pointLng, unit)
  return distance <= radius
}

/**
 * Sort locations by distance from point
 * @param {number} lat - Reference latitude
 * @param {number} lng - Reference longitude
 * @param {Array} locations - Array of locations with lat/lng
 * @returns {Array} Sorted locations with distance
 */
const sortByDistance = (lat, lng, locations) => {
  return locations
    .map((location) => ({
      ...location,
      distance: calculateDistance(
        lat,
        lng,
        location.lat || location.latitude || location.location?.coordinates?.[1],
        location.lng || location.longitude || location.location?.coordinates?.[0],
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
}

/**
 * Format distance for display
 */
const formatDistance = (distance, unit = "km") => {
  if (unit === "km") {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`
    }
    return `${distance.toFixed(1)} km`
  }
  return `${distance.toFixed(1)} miles`
}

/**
 * Validate coordinates
 */
const isValidCoordinates = (lat, lng) => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

/**
 * Parse coordinates from various formats
 * @param {string|Object} input - Coordinates in various formats
 * @returns {Object|null} Parsed coordinates or null
 */
const parseCoordinates = (input) => {
  // Object format
  if (typeof input === "object" && input !== null) {
    const lat = input.lat || input.latitude
    const lng = input.lng || input.longitude || input.lon

    if (isValidCoordinates(lat, lng)) {
      return { lat: Number.parseFloat(lat), lng: Number.parseFloat(lng) }
    }

    // GeoJSON format
    if (Array.isArray(input.coordinates)) {
      const [longitude, latitude] = input.coordinates
      if (isValidCoordinates(latitude, longitude)) {
        return { lat: latitude, lng: longitude }
      }
    }
  }

  // String format: "lat,lng" or "lat lng"
  if (typeof input === "string") {
    const parts = input.split(/[,\s]+/).map(Number.parseFloat)
    if (parts.length === 2 && isValidCoordinates(parts[0], parts[1])) {
      return { lat: parts[0], lng: parts[1] }
    }
  }

  return null
}

/**
 * Convert to GeoJSON Point
 */
const toGeoJSONPoint = (lat, lng) => {
  return {
    type: "Point",
    coordinates: [lng, lat], // GeoJSON is [longitude, latitude]
  }
}

/**
 * MongoDB $geoNear stage builder
 */
const buildGeoNearStage = (lat, lng, options = {}) => {
  const { maxDistance = 50000, minDistance = 0, distanceField = "distance", spherical = true } = options

  return {
    $geoNear: {
      near: toGeoJSONPoint(lat, lng),
      distanceField,
      maxDistance: maxDistance * 1000, // Convert km to meters
      minDistance: minDistance * 1000,
      spherical,
    },
  }
}

/**
 * Indian states with approximate center coordinates
 */
const INDIAN_STATES = {
  "Andhra Pradesh": { lat: 15.9129, lng: 79.74 },
  Bihar: { lat: 25.0961, lng: 85.3131 },
  Gujarat: { lat: 22.2587, lng: 71.1924 },
  Karnataka: { lat: 15.3173, lng: 75.7139 },
  "Madhya Pradesh": { lat: 22.9734, lng: 78.6569 },
  Maharashtra: { lat: 19.7515, lng: 75.7139 },
  Punjab: { lat: 31.1471, lng: 75.3412 },
  Rajasthan: { lat: 27.0238, lng: 74.2179 },
  "Tamil Nadu": { lat: 11.1271, lng: 78.6569 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
  "West Bengal": { lat: 22.9868, lng: 87.855 },
}

/**
 * Get state center coordinates
 */
const getStateCenter = (stateName) => {
  return INDIAN_STATES[stateName] || null
}

module.exports = {
  EARTH_RADIUS_KM,
  EARTH_RADIUS_MILES,
  toRadians,
  toDegrees,
  calculateDistance,
  calculateBearing,
  getCardinalDirection,
  calculateDestination,
  getBoundingBox,
  isWithinRadius,
  sortByDistance,
  formatDistance,
  isValidCoordinates,
  parseCoordinates,
  toGeoJSONPoint,
  buildGeoNearStage,
  INDIAN_STATES,
  getStateCenter,
}
