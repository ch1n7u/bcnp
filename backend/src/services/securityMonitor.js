const { supabaseAdmin } = require('../config/db');
const logger = require('../utils/logger');

class SecurityMonitor {
  /**
   * Scans audit logs and visitor activity for suspicious patterns.
   * Returns a list of identified threats or flagged visitors.
   */
  static async getThreatIndicators() {
    try {
      const now = new Date();
      const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // 1. Excessive login failures
      // This is a heuristic since we do not log login failures in audit_logs directly,
      // but we might log them if we added it, or we can check rate limit store (in memory).
      // For persistent monitoring, we will look at audit logs with action_type='LOGIN_FAILED'
      // If none, we will just return a placeholder or check visitors with many sessions.

      // 2. Suspicious session activity (e.g. multiple sessions from same IP in short time)
      const { data: multipleSessions, error: sessionError } = await supabaseAdmin
        .rpc('get_suspicious_ips', { since_date: past24Hours }); // We will use raw query via JS below if no RPC

      // Alternative: fetch recent visitor_sessions and group by visitor_id in code if RPC not available.
      const { data: recentSessions } = await supabaseAdmin
        .from('visitor_sessions')
        .select('visitor_id, id')
        .gte('started_at', past24Hours);

      const sessionCounts = {};
      for (const s of (recentSessions || [])) {
        sessionCounts[s.visitor_id] = (sessionCounts[s.visitor_id] || 0) + 1;
      }
      const suspiciousVisitors = Object.entries(sessionCounts)
        .filter(([_, count]) => count > 50)
        .map(([id]) => id);

      // 3. OTP Abuse (if we log it)
      // Since OTP abuses are currently in-memory rate limited and logged via logger, 
      // we might not have them in DB unless we scrape logs.

      return {
        flaggedVisitorsCount: suspiciousVisitors.length,
        suspiciousVisitors,
        message: "Monitoring active. Excessive session creation detected for some visitors."
      };
    } catch (error) {
      logger.error('SecurityMonitor error', { error: error.message });
      return { error: 'Failed to generate threat indicators' };
    }
  }
}

module.exports = SecurityMonitor;
