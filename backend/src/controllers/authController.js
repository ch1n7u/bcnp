const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const env = require("../config/env");
const { signAccessToken } = require("../utils/jwt");
const { supabaseAdmin } = require("../config/db");
const { findByEmail, findById, createUser } = require("../models/userModel");
const { otpStore, rateLimitStore } = require("../utils/store");
const { sendOtpEmail } = require("../utils/mailer");

async function sendOtp(req, res, next) {
  try {
    const { email } = req.body;

    // Rate limiting check
    let rateData = rateLimitStore.get(email) || { count: 0, blockedUntil: 0, nextAllowedAt: 0 };
    const now = Date.now();

    if (rateData.blockedUntil > now) {
        return res.status(429).json({ message: "You have exceeded the maximum resend attempts. Please try again after 6 hours." });
    }

    if (rateData.count >= 4) {
        rateData.blockedUntil = now + 6 * 60 * 60 * 1000;
        rateLimitStore.set(email, rateData, 6 * 60 * 60);
        return res.status(429).json({ message: "You have exceeded the maximum resend attempts. Please try again after 6 hours." });
    }

    if (rateData.nextAllowedAt > now) {
        const waitSeconds = Math.ceil((rateData.nextAllowedAt - now) / 1000);
        return res.status(429).json({ message: `Please wait ${waitSeconds} seconds before requesting a new OTP.` });
    }

    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in memory with verify status and the code itself
    otpStore.set(email, { 
      email,
      verified: false,
      otpCode
    }, 300); // 5 min TTL

    await sendOtpEmail(email, otpCode);

    // Update rate limit counts
    rateData.count += 1;
    let waitLimit = 30; // Default
    if (rateData.count === 1) {
        waitLimit = 30;
        rateData.nextAllowedAt = now + 30 * 1000;
    } else if (rateData.count === 2) {
        waitLimit = 30;
        rateData.nextAllowedAt = now + 30 * 1000;
    } else if (rateData.count === 3) {
        waitLimit = 60;
        rateData.nextAllowedAt = now + 60 * 1000;
    } else if (rateData.count === 4) {
        waitLimit = 120;
        rateData.nextAllowedAt = now + 120 * 1000;
    }
    
    rateLimitStore.set(email, rateData, 6 * 60 * 60);

    return res.status(200).json({
      success: true,
      message: "OTP sent to email successfully. Please verify it.",
      waitLimit
    });
  } catch (error) {
    return next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    const data = otpStore.get(email);
    if (!data) {
      return res.status(400).json({ message: "OTP has expired or not requested." });
    }

    if (data.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Mark as verified!
    data.verified = true;
    // Re-save with updated status (maintains same expiry)
    // Actually our MemoryStore get returns the live object, so we can just modify it.

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now complete registration.",
    });

  } catch (error) {
    return next(error);
  }
}

async function registerFinal(req, res, next) {
  try {
    const { email, name, password } = req.body;

    const data = otpStore.get(email);
    if (!data || !data.verified) {
      return res.status(400).json({ message: "Please verify your email with OTP first." });
    }

    // Double check email hasn't been registered in the meantime
    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
      name,
      email,
      passwordHash,
      role: "citizen"
    });

    otpStore.delete(email);

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

async function forgotPasswordSendOtp(req, res, next) {
  try {
    const { email } = req.body;

    const rateKey = `reset_${email}`;
    let rateData = rateLimitStore.get(rateKey) || { count: 0, blockedUntil: 0, nextAllowedAt: 0 };
    const now = Date.now();

    if (rateData.blockedUntil > now) {
      return res.status(429).json({ message: "Too many attempts. Please try again after 6 hours." });
    }

    if (rateData.count >= 4) {
      rateData.blockedUntil = now + 6 * 60 * 60 * 1000;
      rateLimitStore.set(rateKey, rateData, 6 * 60 * 60);
      return res.status(429).json({ message: "Too many attempts. Please try again after 6 hours." });
    }

    if (rateData.nextAllowedAt > now) {
      const waitSeconds = Math.ceil((rateData.nextAllowedAt - now) / 1000);
      return res.status(429).json({ message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`, waitLimit: waitSeconds });
    }

    const user = await findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const resetKey = `reset_${email}`;
    otpStore.set(resetKey, {
      email,
      verified: false,
      otpCode
    }, 300); // 5 min TTL

    await sendOtpEmail(email, otpCode, "reset");

    rateData.count += 1;
    let waitLimit = 30;
    if (rateData.count === 1) { waitLimit = 30; rateData.nextAllowedAt = now + 30 * 1000; }
    else if (rateData.count === 2) { waitLimit = 30; rateData.nextAllowedAt = now + 30 * 1000; }
    else if (rateData.count === 3) { waitLimit = 60; rateData.nextAllowedAt = now + 60 * 1000; }
    else if (rateData.count === 4) { waitLimit = 120; rateData.nextAllowedAt = now + 120 * 1000; }

    rateLimitStore.set(rateKey, rateData, 6 * 60 * 60);

    return res.status(200).json({
      success: true,
      message: "Password reset OTP sent to your email.",
      waitLimit
    });
  } catch (error) {
    return next(error);
  }
}

async function forgotPasswordVerifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    const resetKey = `reset_${email}`;
    const data = otpStore.get(resetKey);
    if (!data) {
      return res.status(400).json({ message: "OTP has expired or not requested." });
    }

    if (data.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    data.verified = true;

    return res.status(200).json({
      success: true,
      message: "OTP verified. You can now set a new password."
    });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, password } = req.body;

    const resetKey = `reset_${email}`;
    const data = otpStore.get(resetKey);
    if (!data || !data.verified) {
      return res.status(400).json({ message: "Please verify your email with OTP first." });
    }

    const user = await findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: "No account found with this email." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { error } = await supabaseAdmin
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", email.trim().toLowerCase());

    if (error) throw new Error(error.message);

    otpStore.delete(resetKey);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully! Please login with your new password."
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

async function googleLogin(req, res, next) {
  try {
    const { credential, mode } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    if (!env.googleClientId) {
      return res.status(500).json({ message: "Google Client ID is not configured on the server" });
    }

    const client = new OAuth2Client(env.googleClientId);
    
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: env.googleClientId,
      });
      payload = ticket.getPayload();
    } catch (err) {
      return res.status(401).json({ message: "Invalid Google credential" });
    }

    const { email, name } = payload;
    if (!email) {
      return res.status(400).json({ message: "Email not provided by Google account" });
    }

    // Check if user exists
    let user = await findByEmail(email);
    
    if (!user) {
      if (mode === "login") {
        return res.status(404).json({ message: "No account found with this Google email. Please register first." });
      }

      // Create user
      const secureRandomPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(secureRandomPassword, 12);
      
      user = await createUser({
        name: name || email.split("@")[0],
        email: email,
        passwordHash: passwordHash,
        role: "citizen"
      });
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

module.exports = {
  sendOtp,
  verifyOtp,
  registerFinal,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  resetPassword,
  login,
  me,
  logout,
  googleLogin
};
