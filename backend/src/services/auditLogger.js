const { supabaseAdmin } = require('../config/db');
const logger = require('../utils/logger');

class AuditLogger {
  /**
   * Log an action to the audit_logs table
   * @param {Object} params
   * @param {string} params.actionType - The type of action (e.g., 'LOGIN', 'REPORT_SUBMITTED')
   * @param {string} [params.targetType] - The entity type affected (e.g., 'REPORT', 'USER')
   * @param {string} [params.targetId] - The ID of the affected entity
   * @param {Object} [params.metadata] - Additional JSON metadata
   * @param {Object} [req] - Express request object to extract context (user, visitor, ip)
   */
  static async log({ actionType, targetType = null, targetId = null, metadata = {}, req = null }) {
    try {
      let userId = null;
      let visitorId = null;
      let sessionId = null;
      let ipAddress = null;

      if (req) {
        userId = req.user?.id || null;
        visitorId = req.visitorId || null;
        sessionId = req.visitorSessionId || req.cookies?._va_session || null;
        ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                    req.headers['cf-connecting-ip'] || 
                    req.socket?.remoteAddress || 
                    'unknown';
      }

      const logEntry = {
        action_type: actionType,
        target_type: targetType,
        target_id: targetId?.toString(),
        metadata,
        user_id: userId,
        visitor_id: visitorId,
        session_id: sessionId,
        ip_address: ipAddress
      };

      // Non-blocking insert
      supabaseAdmin
        .from('audit_logs')
        .insert([logEntry])
        .then(({ error }) => {
          if (error) {
            logger.error('Failed to insert audit log', { error: error.message, logEntry });
          }
        });

    } catch (error) {
      logger.error('AuditLogger error', { error: error.message });
    }
  }
}

module.exports = AuditLogger;
