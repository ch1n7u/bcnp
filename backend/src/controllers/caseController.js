const { supabaseAdmin } = require("../config/db");
const { logCaseEvent, getCaseTimelineEntries } = require("../services/caseTimelineService");

function generateProxyUrl(req, evidenceId) {
  return `${req.protocol}://${req.get("host")}/api/evidence/file/${evidenceId}`;
}

async function getAssignedCases(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("report_id, victim_name, email, phone_number, incident_datetime, crime_type, description, suspect_details, status, location, financial_loss_amount, created_at, updated_at, evidence(evidence_id, file_url, original_name, mime_type)")
      .eq("assigned_investigator_id", req.user.id)
      .order("updated_at", { ascending: false });

    if (error) return next(new Error(error.message));

    const enrichedData = (data || []).map((caseItem) => {
      const enrichedEvidence = (caseItem.evidence || []).map((ev) => ({
        ...ev,
        file_url: generateProxyUrl(req, ev.evidence_id)
      }));
      return { ...caseItem, evidence: enrichedEvidence };
    });

    return res.json(enrichedData);
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);
    const { status } = req.body;

    const { data: report, error: reportError } = await supabaseAdmin
      .from("reports")
      .select("report_id, status, assigned_investigator_id")
      .eq("report_id", reportId)
      .maybeSingle();

    if (reportError) return next(new Error(reportError.message));
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (req.user.role === "investigator") {
      if (String(report.assigned_investigator_id) !== String(req.user.id)) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("report_id", reportId)
      .select("report_id, status, updated_at")
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Report not found" });
    }

    await logCaseEvent({
      reportId,
      actionType: "STATUS_UPDATED",
      actorId: req.user.id,
      actorRole: req.user.role,
      metadata: {
        previous_status: report.status,
        new_status: status
      },
      req
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function assignInvestigator(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);
    const { investigatorId } = req.body;

    const { data: currentReport, error: currentReportError } = await supabaseAdmin
      .from("reports")
      .select("report_id, assigned_investigator_id")
      .eq("report_id", reportId)
      .maybeSingle();

    if (currentReportError) return next(new Error(currentReportError.message));
    if (!currentReport) {
      return res.status(404).json({ message: "Report not found" });
    }

    const { data: investigator } = await supabaseAdmin
      .from("users")
      .select("id, name")
      .eq("id", investigatorId)
      .in("role", ["investigator", "admin"])
      .maybeSingle();

    if (!investigator) {
      return res.status(404).json({ message: "Investigator not found" });
    }

    const { data, error } = await supabaseAdmin
      .from("reports")
      .update({
        assigned_investigator_id: investigatorId,
        status: "Under Review",
        updated_at: new Date().toISOString()
      })
      .eq("report_id", reportId)
      .select("report_id, assigned_investigator_id, status")
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "Report not found" });
    }

    await logCaseEvent({
      reportId,
      actionType: "INVESTIGATOR_ASSIGNED",
      actorId: req.user.id,
      actorRole: req.user.role,
      metadata: {
        previous_investigator_id: currentReport.assigned_investigator_id,
        new_investigator_id: investigator.id,
        new_investigator_name: investigator.name
      },
      req
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function addCaseNote(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);
    const { noteText } = req.body;

    const { data: report } = await supabaseAdmin
      .from("reports")
      .select("report_id, assigned_investigator_id")
      .eq("report_id", reportId)
      .maybeSingle();

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (req.user.role === "investigator" && String(report.assigned_investigator_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { data, error } = await supabaseAdmin
      .from("case_notes")
      .insert({ report_id: reportId, investigator_id: req.user.id, note_text: noteText })
      .select()
      .single();

    if (error) return next(new Error(error.message));

    await logCaseEvent({
      reportId,
      actionType: "CASE_NOTE_ADDED",
      actorId: req.user.id,
      actorRole: req.user.role,
      metadata: {
        note_id: data.note_id,
        note_preview: noteText.slice(0, 140)
      },
      req
    });

    return res.status(201).json(data);
  } catch (error) {
    return next(error);
  }
}

async function getCaseTimeline(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);

    const { data: report, error: reportError } = await supabaseAdmin
      .from("reports")
      .select("report_id, assigned_investigator_id")
      .eq("report_id", reportId)
      .maybeSingle();

    if (reportError) return next(new Error(reportError.message));
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (req.user.role === "investigator" && String(report.assigned_investigator_id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const timeline = await getCaseTimelineEntries(reportId);
    return res.json(timeline);
  } catch (error) {
    return next(error);
  }
}

async function getCaseNotes(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);

    if (req.user.role === "investigator") {
      const { data: report, error: reportError } = await supabaseAdmin
        .from("reports")
        .select("report_id")
        .eq("report_id", reportId)
        .eq("assigned_investigator_id", req.user.id)
        .maybeSingle();

      if (reportError) return next(new Error(reportError.message));
      if (!report) return res.status(403).json({ message: "Forbidden" });
    } else if (req.user.role === "citizen") {
      const { data: report, error: reportError } = await supabaseAdmin
        .from("reports")
        .select("report_id")
        .eq("report_id", reportId)
        .eq("user_id", req.user.id)
        .maybeSingle();

      if (reportError) return next(new Error(reportError.message));
      if (!report) return res.status(403).json({ message: "Forbidden" });
    }

    const { data: notes, error } = await supabaseAdmin
      .from("case_notes")
      .select("*, investigator:users!case_notes_investigator_id_fkey(name)")
      .eq("report_id", reportId)
      .order("created_at", { ascending: false });

    if (error) return next(new Error(error.message));

    const result = (notes || []).map((n) => ({
      ...n,
      investigator_name: n.investigator?.name
    }));

    return res.json(result);
  } catch (error) {
    return next(error);
  }
}

async function deleteCase(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const { data: existingReport, error: existingReportError } = await supabaseAdmin
      .from("reports")
      .select("report_id")
      .eq("report_id", reportId)
      .maybeSingle();

    if (existingReportError) return next(new Error(existingReportError.message));
    if (!existingReport) return res.status(404).json({ message: "Report not found" });

    await logCaseEvent({
      reportId,
      actionType: "CASE_DELETED",
      actorId: req.user.id,
      actorRole: req.user.role,
      metadata: { message: "Case deleted by admin" },
      req
    });

    const { error: notesDeleteError } = await supabaseAdmin
      .from("case_notes")
      .delete()
      .eq("report_id", reportId);

    if (notesDeleteError) return next(new Error(notesDeleteError.message));

    const { error: evidenceDeleteError } = await supabaseAdmin
      .from("evidence")
      .delete()
      .eq("report_id", reportId);

    if (evidenceDeleteError) return next(new Error(evidenceDeleteError.message));

    const { error: reportDeleteError } = await supabaseAdmin
      .from("reports")
      .delete()
      .eq("report_id", reportId);

    if (reportDeleteError) return next(new Error(reportDeleteError.message));

    return res.json({ message: "Case deleted successfully", reportId });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAssignedCases,
  updateStatus,
  assignInvestigator,
  addCaseNote,
  getCaseNotes,
  getCaseTimeline,
  deleteCase
};