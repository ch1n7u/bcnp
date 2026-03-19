const { supabaseAdmin } = require("../config/db");
const { getAnonymousReporterId } = require("../utils/anonymousReporter");
const { PAYMENT_APPS, INDIAN_STATES_AND_UTS } = require("../config/reportMetadata");
const { logCaseEvent } = require("../services/caseTimelineService");

const ANONYMOUS_ALLOWED_CRIME_TYPES = new Set([
  "Fake websites",
  "Phishing",
  "Social media harassment"
]);

async function createReport(req, res, next) {
  try {
    const {
      victimName, email, phoneNumber, crimeType, description,
      incidentDateTime, suspectDetails, financialLossAmount, location, status
    } = req.body;

    if (!req.user && !ANONYMOUS_ALLOWED_CRIME_TYPES.has(crimeType)) {
      return res.status(403).json({
        message:
          "Please log in to report this scam type. Anonymous reporting is limited to Fake websites, Phishing, and social media harassment."
      });
    }

    const reporterId = req.user?.id || (await getAnonymousReporterId());

    const { data: report, error } = await supabaseAdmin
      .from("reports")
      .insert({
        user_id: reporterId,
        victim_name: victimName,
        email,
        phone_number: phoneNumber,
        crime_type: crimeType,
        description,
        incident_datetime: incidentDateTime,
        suspect_details: suspectDetails || null,
        financial_loss_amount: financialLossAmount,
        location,
        status: status || "Submitted"
      })
      .select()
      .single();

    if (error) return next(new Error(error.message));

    await logCaseEvent({
      reportId: report.report_id,
      actionType: "CASE_CREATED",
      actorId: req.user?.id || null,
      actorRole: req.user?.role || "anonymous",
      metadata: {
        crime_type: report.crime_type,
        initial_status: report.status,
        location: report.location
      },
      req
    });

    return res.status(201).json(report);
  } catch (error) {
    return next(error);
  }
}

function getReportOptions(_req, res) {
  return res.json({
    paymentApps: PAYMENT_APPS,
    states: INDIAN_STATES_AND_UTS
  });
}

async function getMyReports(req, res, next) {
  try {
    const { data: reports, error } = await supabaseAdmin
      .from("reports")
      .select("report_id, crime_type, status, location, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) return next(new Error(error.message));
    return res.json(reports || []);
  } catch (error) {
    return next(error);
  }
}

async function getReports(req, res, next) {
  try {
    const { crimeType, status, investigatorId } = req.query;

    let query = supabaseAdmin
      .from("reports")
      .select("*, citizen:users!reports_user_fk(name), investigator:users!reports_investigator_fk(name)")
      .order("created_at", { ascending: false });

    if (crimeType) query = query.eq("crime_type", crimeType);
    if (status) query = query.eq("status", status);
    if (investigatorId) query = query.eq("assigned_investigator_id", investigatorId);

    const { data: reports, error } = await query;
    if (error) return next(new Error(error.message));

    const result = (reports || []).map((r) => ({
      ...r,
      citizen_name: r.citizen?.name,
      investigator_name: r.investigator?.name
    }));

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function getReportById(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);

    const { data: report, error } = await supabaseAdmin
      .from("reports")
      .select("*, citizen:users!reports_user_fk(name), investigator:users!reports_investigator_fk(name)")
      .eq("report_id", reportId)
      .maybeSingle();

    if (error || !report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (req.user.role === "citizen" && String(report.user_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({
      ...report,
      citizen_name: report.citizen?.name,
      investigator_name: report.investigator?.name
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createReport, getReportOptions, getMyReports, getReports, getReportById };