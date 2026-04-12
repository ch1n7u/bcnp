const bcrypt = require("bcryptjs");
const { supabaseAdmin } = require("../config/db");
const { createUser, findByEmail, listUsers } = require("../models/userModel");

async function getUsers(req, res, next) {
  try {
    const users = await listUsers();
    return res.json({ success: true, users });
  } catch (error) {
    return next(error);
  }
}

async function getInvestigators(req, res, next) {
  try {
    const [investigatorsResult, reportsResult] = await Promise.all([
      supabaseAdmin
        .from("users")
        .select("id, name, email, created_at")
        .eq("role", "investigator")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("reports")
        .select("assigned_investigator_id, status")
        .not("assigned_investigator_id", "is", null)
    ]);

    if (investigatorsResult.error) {
      return next(new Error(investigatorsResult.error.message));
    }

    if (reportsResult.error) {
      return next(new Error(reportsResult.error.message));
    }

    const loadByInvestigator = new Map();
    for (const report of reportsResult.data || []) {
      const investigatorId = report.assigned_investigator_id;
      const current = loadByInvestigator.get(investigatorId) || {
        totalAssignedCases: 0,
        activeAssignedCases: 0,
        resolvedCases: 0
      };

      current.totalAssignedCases += 1;
      if (["Submitted", "Under Review", "Investigation"].includes(report.status)) {
        current.activeAssignedCases += 1;
      }
      if (["Resolved", "Closed"].includes(report.status)) {
        current.resolvedCases += 1;
      }

      loadByInvestigator.set(investigatorId, current);
    }

    const investigators = (investigatorsResult.data || []).map((investigator) => {
      const stats = loadByInvestigator.get(investigator.id) || {
        totalAssignedCases: 0,
        activeAssignedCases: 0,
        resolvedCases: 0
      };

      return {
        ...investigator,
        ...stats,
        currentStatus: stats.activeAssignedCases > 0 ? "Busy" : "Available"
      };
    });

    return res.json({ success: true, investigators });
  } catch (error) {
    return next(error);
  }
}

async function createInvestigator(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await findByEmail(email);

    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const investigator = await createUser({
      name,
      email,
      phone: "",
      passwordHash,
      role: "investigator"
    });

    return res.status(201).json({
      success: true,
      investigator,
      message: "Investigator created successfully. Share credentials securely."
    });
  } catch (error) {
    return next(error);
  }
}

async function updateInvestigator(req, res, next) {
  try {
    const { investigatorId } = req.params;
    const { name, email, password } = req.body;

    const { data: investigator, error: findError } = await supabaseAdmin
      .from("users")
      .select("id, email, role")
      .eq("id", investigatorId)
      .eq("role", "investigator")
      .maybeSingle();

    if (findError) {
      return next(new Error(findError.message));
    }

    if (!investigator) {
      return res.status(404).json({ message: "Investigator not found" });
    }

    if (email && email.trim().toLowerCase() !== investigator.email) {
      const existing = await findByEmail(email);
      if (existing && String(existing.id) !== String(investigatorId)) {
        return res.status(409).json({ message: "Email already registered" });
      }
    }

    const updatePayload = {};
    if (name) updatePayload.name = name.trim();
    if (email) updatePayload.email = email.trim().toLowerCase();
    if (password) {
      updatePayload.password_hash = await bcrypt.hash(password, 12);
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("users")
      .update(updatePayload)
      .eq("id", investigatorId)
      .eq("role", "investigator")
      .select("id, name, email, role, created_at")
      .single();

    if (updateError || !updated) {
      return res.status(404).json({ message: "Investigator not found" });
    }

    return res.json({
      success: true,
      investigator: updated,
      message: password
        ? "Investigator updated successfully. Password was changed and should be shared securely."
        : "Investigator updated successfully."
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteInvestigator(req, res, next) {
  try {
    const { investigatorId } = req.params;

    const { data: deleted, error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("id", investigatorId)
      .eq("role", "investigator")
      .select("id, name, email")
      .maybeSingle();

    if (error) {
      return next(new Error(error.message));
    }

    if (!deleted) {
      return res.status(404).json({ message: "Investigator not found" });
    }

    return res.json({ success: true, investigator: deleted });
  } catch (error) {
    return next(error);
  }
}

async function assignInvestigatorByAdmin(req, res, next) {
  try {
    const { reportId, investigatorId } = req.body;

    const { data: investigator, error: investigatorError } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("id", investigatorId)
      .eq("role", "investigator")
      .maybeSingle();

    if (investigatorError) {
      return next(new Error(investigatorError.message));
    }

    if (!investigator) {
      return res.status(404).json({ message: "Investigator not found" });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("reports")
      .update({
        assigned_investigator_id: investigatorId,
        status: "Under Review",
        updated_at: new Date().toISOString()
      })
      .eq("report_id", reportId)
      .select("report_id, assigned_investigator_id, status")
      .single();

    if (updateError || !updated) {
      return res.status(404).json({ message: "Report not found" });
    }

    return res.json({ success: true, report: updated });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getUsers,
  getInvestigators,
  assignInvestigatorByAdmin,
  createInvestigator,
  updateInvestigator,
  deleteInvestigator
};
