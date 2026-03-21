const bcrypt = require("bcryptjs");
const { signAccessToken } = require("../utils/jwt");
const { supabaseAdmin } = require("../config/db");
const { findByEmail, findById, createUser } = require("../models/userModel");

async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await findByEmail(email);

    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
      name,
      email,
      phone,
      passwordHash,
      role: "citizen"
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully. Please login to continue.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAccessToken(user);

    res.cookie("ccrp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const user = await findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "citizen") {
      const { data: reports, error } = await supabaseAdmin
        .from("reports")
        .select("report_id, status, crime_type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) return next(new Error(error.message));

      const statusCounts = {};
      for (const report of reports || []) {
        statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
      }

      return res.json({
        user,
        stats: {
          totalCasesFiled: (reports || []).length,
          statusCounts,
          recentCases: (reports || []).slice(0, 5)
        }
      });
    }

    const [assignedRes, notesRes] = await Promise.all([
      supabaseAdmin
        .from("reports")
        .select("report_id, status, crime_type, updated_at")
        .eq("assigned_investigator_id", user.id)
        .order("updated_at", { ascending: false }),
      supabaseAdmin
        .from("case_notes")
        .select("note_id", { count: "exact", head: true })
        .eq("investigator_id", user.id)
    ]);

    if (assignedRes.error) return next(new Error(assignedRes.error.message));
    if (notesRes.error) return next(new Error(notesRes.error.message));

    const assignedReports = assignedRes.data || [];
    const statusCounts = {};
    for (const report of assignedReports) {
      statusCounts[report.status] = (statusCounts[report.status] || 0) + 1;
    }

    return res.json({
      user,
      stats: {
        totalAssignedCases: assignedReports.length,
        totalNotesAdded: notesRes.count || 0,
        statusCounts,
        recentAssignedCases: assignedReports.slice(0, 5)
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  res.clearCookie("ccrp_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  return res.json({ message: "Logged out successfully" });
}

module.exports = {
  register,
  login,
  me,
  logout
};
