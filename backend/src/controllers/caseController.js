const { supabaseAdmin } = require("../config/db");

async function getAssignedCases(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("report_id, victim_name, crime_type, status, location, financial_loss_amount, created_at, updated_at")
      .eq("assigned_investigator_id", req.user.id)
      .order("updated_at", { ascending: false });

    if (error) return next(new Error(error.message));
    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);
    const { status } = req.body;

    if (req.user.role === "investigator") {
      const { data: report, error: reportError } = await supabaseAdmin
        .from("reports")
        .select("report_id")
        .eq("report_id", reportId)
        .eq("assigned_investigator_id", req.user.id)
        .maybeSingle();

      if (reportError) return next(new Error(reportError.message));
      if (!report) return res.status(403).json({ message: "Forbidden" });
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

    return res.json(data);
  } catch (error) {
    return next(error);
  }
}

async function assignInvestigator(req, res, next) {
  try {
    const reportId = Number(req.params.reportId);
    const { investigatorId } = req.body;

    const { data: investigator } = await supabaseAdmin
      .from("users")
      .select("id")
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
    return res.status(201).json(data);
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

module.exports = { getAssignedCases, updateStatus, assignInvestigator, addCaseNote, getCaseNotes };