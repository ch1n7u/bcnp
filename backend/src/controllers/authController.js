const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const env = require("../config/env");
const { signAccessToken } = require("../utils/jwt");
const { supabaseAdmin } = require("../config/db");
const { findByEmail, findById, createUser } = require("../models/userModel");
const { otpStore, rateLimitStore } = require("../utils/store");
const { sendOtpEmail, sendWelcomeEmail, sendLoginAlertEmail } = require("../utils/mailer");
const logger = require("../utils/logger");
const AuditLogger = require("../services/auditLogger");

function maskEmail(email) {
  if (!email || typeof email !== "string") return "***";
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `*@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

async function sendOtp(req, res, next) {
  try {
    const { email } = req.body;
    const correlationId = req.correlationId;

    // Rate limiting check
    let rateData = rateLimitStore.get(email) || { count: 0, blockedUntil: 0, nextAllowedAt: 0 };
    const now = Date.now();

    if (rateData.blockedUntil > now || rateData.count >= 4) {
      if (rateData.count >= 4 && rateData.blockedUntil === 0) {
        rateData.blockedUntil = now + 6 * 60 * 60 * 1000;
        rateLimitStore.set(email, rateData, 6 * 60 * 60);
      }
      logger.warn(`SECURITY_AUDIT: Registration OTP rate limit blocked for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    if (rateData.nextAllowedAt > now) {
      logger.warn(`SECURITY_AUDIT: Registration OTP requested too quickly for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    // Check if email already registered (Mitigate Username/Email Enumeration)
    const existing = await findByEmail(email);
    if (existing) {
      logger.warn(`SECURITY_AUDIT: Registration attempt for already registered email: ${maskEmail(email)}`, {}, correlationId);
      // Return 200 with dummy success to avoid disclosing whether account exists
      return res.status(200).json({
        status: "success",
        message: "OTP sent to email successfully. Please verify it.",
        waitLimit: 30
      });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in memory
    otpStore.set(email, { 
      email,
      verified: false,
      otpCode
    }, 300); // 5 min TTL

    await sendOtpEmail(email, otpCode);

    // Update rate limit counts
    rateData.count += 1;
    let waitLimit = 30;
    if (rateData.count === 1) {
      rateData.nextAllowedAt = now + 30 * 1000;
    } else if (rateData.count === 2) {
      rateData.nextAllowedAt = now + 30 * 1000;
    } else if (rateData.count === 3) {
      rateData.nextAllowedAt = now + 60 * 1000;
    } else if (rateData.count === 4) {
      rateData.nextAllowedAt = now + 120 * 1000;
    }
    
    rateLimitStore.set(email, rateData, 6 * 60 * 60);

    return res.status(200).json({
      status: "success",
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
    const correlationId = req.correlationId;

    const data = otpStore.get(email);
    if (!data) {
      logger.warn(`SECURITY_AUDIT: OTP verification failed (expired or not requested) for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    if (data.otpCode !== otp) {
      logger.warn(`SECURITY_AUDIT: OTP verification failed (invalid code) for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    // Mark as verified
    data.verified = true;

    logger.info(`SECURITY_AUDIT: Email verification successful for email: ${maskEmail(email)}`, {}, correlationId);

    return res.status(200).json({
      status: "success",
      message: "Email verified successfully! You can now complete registration."
    });
  } catch (error) {
    return next(error);
  }
}

async function registerFinal(req, res, next) {
  try {
    const { email, name, password } = req.body;
    const correlationId = req.correlationId;

    const data = otpStore.get(email);
    if (!data || !data.verified) {
      logger.warn(`SECURITY_AUDIT: Final registration failed (email not verified) for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    // Double check email hasn't been registered in the meantime
    const existing = await findByEmail(email);
    if (existing) {
      logger.warn(`SECURITY_AUDIT: Final registration failed (email already registered) for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
      name,
      email,
      passwordHash,
      role: "citizen"
    });

    otpStore.delete(email);

    // Send welcome email asynchronously (don't await to not block the response)
    sendWelcomeEmail(user.email, user.name);

    logger.info(`SECURITY_AUDIT: User registration completed successfully for email: ${maskEmail(email)}`, {}, correlationId);
    await AuditLogger.log({ actionType: 'USER_REGISTERED', targetType: 'USER', targetId: user.id, req, metadata: { email } });

    return res.status(201).json({
      status: "success",
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
    const correlationId = req.correlationId;

    const rateKey = `reset_${email}`;
    let rateData = rateLimitStore.get(rateKey) || { count: 0, blockedUntil: 0, nextAllowedAt: 0 };
    const now = Date.now();

    if (rateData.blockedUntil > now || rateData.count >= 4) {
      if (rateData.count >= 4 && rateData.blockedUntil === 0) {
        rateData.blockedUntil = now + 6 * 60 * 60 * 1000;
        rateLimitStore.set(rateKey, rateData, 6 * 60 * 60);
      }
      logger.warn(`SECURITY_AUDIT: Forgot password OTP rate limit blocked for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    if (rateData.nextAllowedAt > now) {
      logger.warn(`SECURITY_AUDIT: Forgot password OTP requested too quickly for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    // Check if account exists (Mitigate Username/Email Enumeration)
    const user = await findByEmail(email);
    if (!user) {
      logger.warn(`SECURITY_AUDIT: Password reset requested for non-existent email: ${maskEmail(email)}`, {}, correlationId);
      // Return 200 with dummy success to avoid disclosing account existence
      return res.status(200).json({
        status: "success",
        message: "Password reset OTP sent to your email.",
        waitLimit: 30
      });
    }

    if (user.auth_provider === "google") {
      logger.warn(`SECURITY_AUDIT: Password reset requested for Google auth user: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({
        status: "error",
        message: "This account uses Google Sign-In. Password reset is not available.",
        correlationId
      });
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
    if (rateData.count === 1) {
      rateData.nextAllowedAt = now + 30 * 1000;
    } else if (rateData.count === 2) {
      rateData.nextAllowedAt = now + 30 * 1000;
    } else if (rateData.count === 3) {
      rateData.nextAllowedAt = now + 60 * 1000;
    } else if (rateData.count === 4) {
      rateData.nextAllowedAt = now + 120 * 1000;
    }

    rateLimitStore.set(rateKey, rateData, 6 * 60 * 60);

    return res.status(200).json({
      status: "success",
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
    const correlationId = req.correlationId;

    const resetKey = `reset_${email}`;
    const data = otpStore.get(resetKey);
    if (!data) {
      logger.warn(`SECURITY_AUDIT: Forgot password OTP verification failed (expired/not requested) for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    if (data.otpCode !== otp) {
      logger.warn(`SECURITY_AUDIT: Forgot password OTP verification failed (invalid OTP) for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    data.verified = true;

    logger.info(`SECURITY_AUDIT: Forgot password email verification successful for email: ${maskEmail(email)}`, {}, correlationId);

    return res.status(200).json({
      status: "success",
      message: "OTP verified. You can now set a new password."
    });
  } catch (error) {
    return next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, password } = req.body;
    const correlationId = req.correlationId;

    const resetKey = `reset_${email}`;
    const data = otpStore.get(resetKey);
    if (!data || !data.verified) {
      logger.warn(`SECURITY_AUDIT: Password reset finalization failed (not verified) for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    const user = await findByEmail(email);
    if (!user) {
      logger.warn(`SECURITY_AUDIT: Password reset finalization failed (user not found) for email: ${maskEmail(email)}`, {}, correlationId);
      return res.status(400).json({ status: "error", message: "Unable to process your request.", correlationId });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { error } = await supabaseAdmin
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("email", email.trim().toLowerCase());

    if (error) throw new Error(error.message);

    otpStore.delete(resetKey);

    logger.info(`SECURITY_AUDIT: Password reset completed successfully for email: ${maskEmail(email)}`, {}, correlationId);
    await AuditLogger.log({ actionType: 'PASSWORD_RESET', targetType: 'USER', targetId: user.id, req, metadata: { email } });

    return res.status(200).json({
      status: "success",
      message: "Password reset successfully! Please login with your new password."
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const correlationId = req.correlationId;
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Account Lockout Check
    const lockoutKey = `lockout_${normalizedEmail}`;
    let lockoutData = rateLimitStore.get(lockoutKey) || { failedAttempts: 0, lockedUntil: 0 };
    const now = Date.now();

    if (lockoutData.lockedUntil > now) {
      logger.warn(`SECURITY_AUDIT: Login blocked due to account lockout for email: ${maskEmail(email)}`, {}, correlationId);
      AuditLogger.log({ actionType: 'LOGIN_FAILED', targetType: 'USER', targetId: email, req, metadata: { reason: 'Account locked out' } });
      return res.status(401).json({ status: "error", message: "Invalid credentials.", correlationId });
    }

    const user = await findByEmail(email);

    if (!user) {
      // Increment failed attempts on email even if account does not exist to prevent timing attacks
      lockoutData.failedAttempts += 1;
      if (lockoutData.failedAttempts >= 5) {
        lockoutData.lockedUntil = now + 15 * 60 * 1000; // Lock for 15 minutes
        logger.critical(`SECURITY_AUDIT: Account locked out due to consecutive failed login attempts for email: ${maskEmail(email)}`, null, {}, correlationId);
      }
      rateLimitStore.set(lockoutKey, lockoutData, 15 * 60);

      logger.warn(`SECURITY_AUDIT: Login failed (user not found) for email: ${maskEmail(email)}`, {}, correlationId);
      AuditLogger.log({ actionType: 'LOGIN_FAILED', targetType: 'USER', targetId: email, req, metadata: { reason: 'User not found' } });
      return res.status(401).json({ status: "error", message: "Invalid credentials.", correlationId });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      lockoutData.failedAttempts += 1;
      if (lockoutData.failedAttempts >= 5) {
        lockoutData.lockedUntil = now + 15 * 60 * 1000;
        logger.critical(`SECURITY_AUDIT: Account locked out due to consecutive failed login attempts for email: ${maskEmail(email)}`, null, {}, correlationId);
      }
      rateLimitStore.set(lockoutKey, lockoutData, 15 * 60);

      logger.warn(`SECURITY_AUDIT: Login failed (incorrect password) for email: ${maskEmail(email)}`, {}, correlationId);
      AuditLogger.log({ actionType: 'LOGIN_FAILED', targetType: 'USER', targetId: user.id, req, metadata: { reason: 'Incorrect password' } });
      return res.status(401).json({ status: "error", message: "Invalid credentials.", correlationId });
    }

    // Reset lockout counters on success
    rateLimitStore.delete(lockoutKey);

    const token = signAccessToken(user);

    // Set secure HttpOnly cookie with SameSite lax setting
    res.cookie("ccrp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Lax allows cookie inclusion on cross-origin dev requests
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    logger.info(`SECURITY_AUDIT: User login successful for email: ${maskEmail(email)}`, {}, correlationId);
    req.user = user; // Set for AuditLogger
    await AuditLogger.log({ actionType: 'USER_LOGIN', targetType: 'USER', targetId: user.id, req, metadata: { email } });

    // Send login alert asynchronously
    if (user.role === "citizen") {
      sendLoginAlertEmail(user.email, user.name);
    }

    return res.json({
      status: "success",
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
    if (user) {
      user.provider = req.user.provider || "local";
    }
    const correlationId = req.correlationId;
    if (!user) {
      logger.warn(`SECURITY_AUDIT: Current user fetch failed (user not found) for id: ${req.user.id}`, {}, correlationId);
      return res.status(404).json({ status: "error", message: "Unable to process your request.", correlationId });
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
        status: "success",
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
      status: "success",
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
  const userId = req.user?.id;
  res.clearCookie("ccrp_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  logger.info(`SECURITY_AUDIT: User logged out`, {}, req.correlationId);
  await AuditLogger.log({ actionType: 'USER_LOGOUT', targetType: 'USER', targetId: userId, req });
  return res.json({ status: "success", message: "Logged out successfully" });
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
        role: "citizen",
        authProvider: "google"
      });
      
      // Send welcome email to new Google registrants
      sendWelcomeEmail(user.email, user.name);
    }

    user.provider = "google";
    const token = signAccessToken(user);

    res.cookie("ccrp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    req.user = user; // Set for AuditLogger
    await AuditLogger.log({ actionType: 'GOOGLE_OAUTH_LOGIN', targetType: 'USER', targetId: user.id, req, metadata: { email, mode } });

    // Send login alert asynchronously
    if (user.role === "citizen") {
      sendLoginAlertEmail(user.email, user.name);
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        provider: "google"
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
