const axios = require('axios');
const logger = require('../utils/logger');

const ipCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

const getGeoIpData = async (ipAddress) => {
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
    return null;
  }

  // Check cache first
  const cached = ipCache.get(ipAddress);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    // ipapi.co allows free lookups without an API key for limited volumes
    const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`, {
      timeout: 3000 // Ensure we don't block requests for long
    });

    if (response.data && !response.data.error) {
      const geoData = {
        country: response.data.country_name,
        region: response.data.region,
        city: response.data.city,
        timezone: response.data.timezone,
        latitude: response.data.latitude,
        longitude: response.data.longitude,
        isp: response.data.org,
        asn: response.data.asn
      };

      // Cache the successful result
      ipCache.set(ipAddress, {
        timestamp: Date.now(),
        data: geoData
      });

      return geoData;
    }
  } catch (error) {
    logger.error('GeoIP lookup failed', {
      ip: ipAddress,
      error: error.message
    });
  }

  return null;
};

module.exports = {
  getGeoIpData
};
