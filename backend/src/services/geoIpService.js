const axios = require('axios');
const logger = require('../utils/logger');

const ipCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

const getGeoIpData = async (ipAddress) => {
  if (!ipAddress) return null;

  // Handle local/private IPs for testing purposes
  const isLocal = ipAddress === '127.0.0.1' || 
                  ipAddress === '::1' || 
                  ipAddress.startsWith('192.168.') || 
                  ipAddress.startsWith('10.') || 
                  ipAddress.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./);

  if (isLocal) {
    return {
      country: "India",
      region: "Delhi",
      city: "New Delhi",
      timezone: "Asia/Kolkata",
      latitude: 28.6139,
      longitude: 77.2090,
      isp: "Local Network",
      asn: "AS00000"
    };
  }

  // Check cache first
  const cached = ipCache.get(ipAddress);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    // ip-api.com allows free lookups without an API key
    const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
      timeout: 3000
    });

    if (response.data && response.data.status === "success") {
      const geoData = {
        country: response.data.country,
        region: response.data.regionName,
        city: response.data.city,
        timezone: response.data.timezone,
        latitude: response.data.lat,
        longitude: response.data.lon,
        isp: response.data.isp,
        asn: response.data.as
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
