const { supabaseAdmin } = require('../config/db');
const logger = require('../utils/logger');

async function trackPageVisit(req, res, next) {
  try {
    const { pageUrl, pageName, route, referrer, timeSpent } = req.body;
    
    // visitorTracker middleware sets these
    const visitorId = req.visitorId;
    const sessionId = req.visitorSessionId;
    const userId = req.user ? req.user.id : null;

    if (!visitorId || !sessionId) {
      // If middleware failed or visitor wasn't created, we just skip tracking to not break frontend
      return res.status(202).json({ status: "ignored", message: "Visitor not identified" });
    }

    const { data: pageVisit, error } = await supabaseAdmin
      .from('page_visits')
      .insert({
        visitor_id: visitorId,
        session_id: sessionId,
        user_id: userId,
        page_url: pageUrl,
        page_name: pageName,
        route: route,
        referrer: referrer,
        duration_seconds: timeSpent || 0
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to insert page visit', { error: error.message });
      return res.status(500).json({ status: "error" });
    }

    return res.status(201).json({ status: "success", id: pageVisit.id });
  } catch (error) {
    logger.error('Page tracking controller error', { error: error.message });
    return res.status(500).json({ status: "error" });
  }
}

module.exports = {
  trackPageVisit
};
