const { supabaseAdmin } = require("../config/db");
const logger = require("../utils/logger");

function getClientIpAddress(req) {
  if (!req) return null;

  const forwardedFor = req.headers?.["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
}

async function logCaseEvent({ reportId, actionType, actorId = null, actorRole = null, metadata = {}, req }) {
  if (!reportId || !actionType) return null;

  const payload = {
    report_id: reportId,
    action_type: actionType,
    actor_id: actorId || null,
    actor_role: actorRole || null,
    metadata: metadata || {},
    ip_address: getClientIpAddress(req),
    user_agent: req?.headers?.["user-agent"] || null
  };

  const { data, error } = await supabaseAdmin.from("case_timeline").insert(payload).select().single();

  if (error) {
    // Timeline writes should never block core case operations.
    logger.error("case_timeline write failed", error, { reportId, actionType }, req ? req.correlationId : null);
    return null;
  }

  return data;
}

async function getCaseTimelineEntries(reportId) {
  const { data, error } = await supabaseAdmin
    .from("case_timeline")
    .select("timeline_id, report_id, action_type, actor_id, actor_role, metadata, ip_address, user_agent, created_at, actor:users(name, email, role)")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((entry) => ({
    ...entry,
    actor_name: entry.actor?.name || null,
    actor_email: entry.actor?.email || null
  }));
}

module.exports = {
  logCaseEvent,
  getCaseTimelineEntries
};
