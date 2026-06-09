const crypto = require('crypto');
const { supabaseAdmin } = require('../config/db');
const { getGeoIpData } = require('../services/geoIpService');
const logger = require('../utils/logger');

const getClientIp = (req) => {
  // 1. CF-Connecting-IP
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return cfIp;

  // 2. X-Forwarded-For
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    // Can be a comma-separated list, first one is the original client
    return xForwardedFor.split(',')[0].trim();
  }

  // 3. Socket Remote Address
  return req.socket.remoteAddress || req.connection.remoteAddress;
};

const parseUserAgent = (userAgentString) => {
  // Simple heuristic parsing. In production, a library like `ua-parser-js` is better,
  // but we implement basic detection here to avoid adding dependencies if possible.
  const ua = (userAgentString || '').toLowerCase();
  
  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  let deviceType = 'Desktop';
  if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) deviceType = 'Mobile';
  else if (ua.includes('ipad') || ua.includes('tablet')) deviceType = 'Tablet';

  return { browser, os, deviceType };
};

const visitorTracker = async (req, res, next) => {
  // Only track API requests or main page loads if applicable. 
  // We avoid tracking static assets if they go through this middleware.
  if (req.method === 'OPTIONS') return next();

  try {
    const ipAddress = getClientIp(req) || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const language = req.headers['accept-language']?.split(',')[0] || 'unknown';
    
    // Check if _va_session cookie exists, otherwise create one
    let sessionId = req.cookies && req.cookies._va_session;
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      // Set session cookie valid for 24 hours
      res.cookie('_va_session', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
      });
    }

    req.visitorSessionId = sessionId;

    let visitorId = null;
    let isNewVisitor = false;

    // 1. Find or create visitor synchronously (fast DB query)
    try {
      const { data: existingVisitor } = await supabaseAdmin
        .from('visitors')
        .select('id')
        .eq('ip_address', ipAddress)
        .single();

      if (existingVisitor) {
        visitorId = existingVisitor.id;
      } else {
        // Insert basic visitor info immediately to get ID
        const uaData = parseUserAgent(userAgent);
        const { data: insertedVisitor, error: insertError } = await supabaseAdmin
          .from('visitors')
          .insert([{
            ip_address: ipAddress,
            user_agent: userAgent,
            language: language,
            browser: uaData.browser,
            os: uaData.os,
            device_type: uaData.deviceType
          }])
          .select('id')
          .single();

        if (insertedVisitor) {
          visitorId = insertedVisitor.id;
          isNewVisitor = true;
        } else if (insertError && insertError.code === '23505') {
          // Concurrency: someone else inserted it
          const { data: concurrentVisitor } = await supabaseAdmin
            .from('visitors')
            .select('id')
            .eq('ip_address', ipAddress)
            .single();
          if (concurrentVisitor) visitorId = concurrentVisitor.id;
        }
      }
    } catch (err) {
      logger.error('Visitor lookup error', { error: err.message });
    }

    req.visitorId = visitorId;

    // 2. Perform slow Geo-IP lookup and session updates asynchronously (detached)
    if (visitorId) {
      (async () => {
        try {
          if (isNewVisitor) {
            const geoData = await getGeoIpData(ipAddress) || {};
            await supabaseAdmin
              .from('visitors')
              .update({
                country: geoData.country,
                region: geoData.region,
                city: geoData.city,
                timezone: geoData.timezone,
                latitude: geoData.latitude,
                longitude: geoData.longitude,
                isp: geoData.isp,
                asn: geoData.asn
              })
              .eq('id', visitorId);
          } else {
            await supabaseAdmin
              .from('visitors')
              .update({ last_seen: new Date().toISOString() })
              .eq('id', visitorId);
          }

          // Track Session
          const userId = req.user ? req.user.id : null;
          const { data: existingSession } = await supabaseAdmin
            .from('visitor_sessions')
            .select('id, started_at')
            .eq('session_id', sessionId)
            .single();

          if (existingSession) {
             const startedAt = new Date(existingSession.started_at);
             const durationSeconds = Math.floor((new Date() - startedAt) / 1000);
             const updateData = { ended_at: new Date().toISOString(), duration_seconds: durationSeconds };
             if (userId) updateData.user_id = userId;

             await supabaseAdmin.from('visitor_sessions').update(updateData).eq('session_id', sessionId);
          } else {
             await supabaseAdmin.from('visitor_sessions').insert([{
               visitor_id: visitorId,
               session_id: sessionId,
               user_id: userId
             }]);
          }
        } catch (err) {
          logger.error('Detached tracking error', { error: err.message });
        }
      })();
    }

    next();
  } catch (error) {
    logger.error('Visitor tracking error', { error: error.message });
    next(); // Ensure request continues even if tracking fails
  }
};

module.exports = visitorTracker;
