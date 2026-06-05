"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const SPAM_DOMAINS = new Set([
  // Known free consumer email providers
  "yahoo.com", "yahoo.co.in", "yahoo.co.uk", "yahoo.fr", "yahoo.de",
  "yahoo.es", "yahoo.it", "yahoo.com.au", "ymail.com", "rocketmail.com",
  "hotmail.com", "hotmail.co.uk", "hotmail.fr", "hotmail.de",
  "outlook.com", "outlook.co.uk", "outlook.fr", "outlook.in",
  "live.com", "live.co.uk", "live.fr", "live.com.au", "live.in",
  "msn.com", "icloud.com", "me.com", "mac.com",
  "aol.com", "aol.co.uk", "aim.com",
  "protonmail.com", "proton.me",
  "tutanota.com", "tuta.io",
  "zohomail.com", "zoho.com",
  "gmx.com", "gmx.de", "gmx.net", "gmx.us",
  "web.de", "rediffmail.com", "inbox.com",
  "mail.com", "email.com",
  // Disposable / temp-mail providers
  "mailinator.com", "guerrillamail.com", "guerrillamail.net",
  "trashmail.com", "trashmail.net", "trashmail.me", "trashmail.at",
  "tempmail.com", "tempmail.net", "temp-mail.org", "temp-mail.io",
  "10minutemail.com", "10minutemail.net", "yopmail.com", "yopmail.fr",
  "fakeinbox.com", "mailnull.com", "spamgourmet.com", "maildrop.cc",
  "mailnesia.com", "sharklasers.com", "grr.la", "discard.email",
  "getnada.com", "tmpmail.org", "emailondeck.com", "moakt.com",
  "mailtemp.info", "tempmail.ninja", "burnermail.io", "mytemp.email",
  "dropmail.me", "armyspy.com", "dayrep.com", "einrot.com",
  "fleckens.hu", "gustr.com", "jourrapide.com", "rhyta.com",
  "superrito.com", "teleworm.us",
]);

const isSpamEmail = (email) => {
  const domain = email.toLowerCase().split("@")[1];
  if (!domain) return true;
  // Gmail is always allowed
  if (domain === "gmail.com" || domain === "googlemail.com") return false;
  // Block known free/temp domains
  return SPAM_DOMAINS.has(domain);
};

export default function AuthForm({ mode = "login" }) {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  
  const isRegister = mode === "register";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    otp: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // OTP Step State
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0); // seconds remaining for OTP validity

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpStep, setFpStep] = useState("email"); // "email" | "otp" | "newpass" | "done"
  const [fpEmail, setFpEmail] = useState("");
  const [fpOtp, setFpOtp] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpError, setFpError] = useState("");
  const [fpSuccess, setFpSuccess] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpTimer, setFpTimer] = useState(0);
  const [fpResendCountdown, setFpResendCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // OTP 5-minute validity countdown
  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpTimer]);

  // Forgot Password timers
  useEffect(() => {
    let timer;
    if (fpTimer > 0) {
      timer = setInterval(() => setFpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [fpTimer]);

  useEffect(() => {
    let timer;
    if (fpResendCountdown > 0) {
      timer = setInterval(() => setFpResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [fpResendCountdown]);

  // Lock body scroll when forgot password modal is open
  useEffect(() => {
    if (showForgotModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showForgotModal]);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleCredentialResponse = async (response) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data } = await api.post("/auth/google", { 
        credential: response.credential,
        mode: mode
      });

      if (!data?.user) {
        throw new Error("Invalid authentication response from server");
      }

      login({ user: data.user });
      setSuccess("Login successful. Redirecting...");

      const destination =
        data.user?.role === "admin"
          ? "/dashboard/admin"
          : data.user?.role === "investigator"
            ? "/dashboard"
            : "/";
      router.replace(destination);

      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname !== destination) {
          window.location.href = destination;
        }
      }, 500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Google Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || !googleClientId) return;

    const initializeGoogleSignIn = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { 
          theme: "outline", 
          size: "large", 
          shape: "pill",
          logo_alignment: "center",
          width: "100%", 
          text: isRegister ? "signup_with" : "signin_with" 
        }
      );
    };

    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          initializeGoogleSignIn();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isRegister, googleClientId]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const dest =
        user.role === "admin"
          ? "/dashboard/admin"
          : user.role === "investigator"
            ? "/dashboard"
            : "/";
      router.replace(dest);
    }
  }, [isAuthenticated, user, router]);

  const handleSendOtp = async () => {
    if (!form.email || isSpamEmail(form.email)) {
      setError("Spam mail detected, can't register.");
      return;
    }
    setForm(prev => ({ ...prev, otp: "" }));
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post("/auth/send-otp", { email: form.email });
      setSuccess("An OTP has been sent to your email.");
      setIsOtpStep(true);
      setOtpError("");
      setOtpSuccess("");
      setOtpTimer(5 * 60); // start 5 min countdown
      setShowOtpModal(true);
      if (res.data?.waitLimit) setResendCountdown(res.data.waitLimit);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!form.otp || form.otp.length !== 6) {
        setOtpError("Please enter a valid 6-digit OTP.");
        return;
    }
    setLoading(true);
    setOtpError("");
    setOtpSuccess("");
    try {
        await api.post("/auth/verify-otp", { email: form.email, otp: form.otp });
        setIsEmailVerified(true);
        setOtpSuccess("Email verified successfully!");
        setTimeout(() => setShowOtpModal(false), 1500);
    } catch (err) {
        setOtpError(err?.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (isRegister) {
      if (!isEmailVerified) {
        setError("Please verify your email address first.");
        return;
      }

      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!strongPasswordRegex.test(form.password)) {
        setError("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      // Step 3: Register Final
      setLoading(true);
      try {
        await api.post("/auth/register-final", {
          email: form.email,
          name: `${form.firstName} ${form.lastName}`.trim(),
          password: form.password
        });
        
        setSuccess("Registration completed successfully!");
        setForm({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", otp: "" });
        setIsOtpStep(false);
        setIsEmailVerified(false);
      } catch (err) {
        const data = err?.response?.data;
        setError(data?.message || err?.message || "Registration failed.");
      } finally {
        setLoading(false);
      }
      return; 
    }

    // Login Flow
    setLoading(true);
    try {
      const payload = {
        email: form.email,
        password: form.password
      };

      const { data } = await api.post("/auth/login", payload);

      if (!data?.user) {
        throw new Error("Invalid authentication response from server");
      }

      login({ user: data.user });
      setSuccess("Login successful. Redirecting...");

      const destination =
        data.user?.role === "admin"
          ? "/dashboard/admin"
          : data.user?.role === "investigator"
            ? "/dashboard"
            : "/";
      router.replace(destination);

      setTimeout(() => {
        if (typeof window !== "undefined" && window.location.pathname !== destination) {
          window.location.href = destination;
        }
      }, 500);
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors?.length) {
        setError(data.errors.map((e) => e.message).join(" · "));
      } else if (err?.message === "Network Error") {
        setError("Unable to reach server. Ensure backend is running and Nginx proxy is configured for /api.");
      } else {
        setError(data?.message || err?.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const formEl = e.target.form;
      if (!formEl) return;

      // Find all visible, enabled inputs in the form
      const inputs = Array.from(formEl.elements).filter(
        (el) => el.tagName === "INPUT" && !el.disabled && el.type !== "hidden"
      );

      const currentIndex = inputs.indexOf(e.target);
      const nextInput = inputs[currentIndex + 1];

      if (nextInput) {
        // Move focus to the next input field
        nextInput.focus();
      } else {
        // Last input — submit the form
        formEl.requestSubmit();
      }
    }
  };

  // ── Forgot Password Handlers ──
  const handleFpSendOtp = async () => {
    if (!fpEmail) return;
    setFpLoading(true);
    setFpError("");
    setFpSuccess("");
    setFpOtp("");
    try {
      const res = await api.post("/auth/forgot-password/send-otp", { email: fpEmail });
      setFpSuccess("OTP sent to your email.");
      setFpStep("otp");
      setFpTimer(5 * 60);
      if (res.data?.waitLimit) setFpResendCountdown(res.data.waitLimit);
    } catch (err) {
      setFpError(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpVerifyOtp = async () => {
    if (fpOtp.length !== 6) return;
    setFpLoading(true);
    setFpError("");
    setFpSuccess("");
    try {
      await api.post("/auth/forgot-password/verify-otp", { email: fpEmail, otp: fpOtp });
      setFpSuccess("Email verified! Set your new password.");
      setFpStep("newpass");
    } catch (err) {
      setFpError(err?.response?.data?.message || "Invalid OTP.");
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpResetPassword = async () => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPasswordRegex.test(fpNewPassword)) {
      setFpError("Password must meet all requirements listed below.");
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpError("Passwords do not match.");
      return;
    }
    setFpLoading(true);
    setFpError("");
    setFpSuccess("");
    try {
      await api.post("/auth/forgot-password/reset", { email: fpEmail, password: fpNewPassword });
      setFpStep("done");
      setFpSuccess("Password reset successfully!");
    } catch (err) {
      setFpError(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setFpLoading(false);
    }
  };


  return (
    <div className="relative">
      {/* Blur the login form when forgot password is active */}
      <form suppressHydrationWarning onSubmit={submit} className={`glass mx-auto w-full max-w-xl rounded-2xl p-5 shadow-lg sm:p-6 transition-all duration-300 ${showForgotModal ? "pointer-events-none select-none blur-sm" : ""}`}>
      <h1 className="font-display text-2xl font-bold sm:text-3xl">
        {isRegister ? (isEmailVerified ? "Ready to Register!" : "Create Account") : "Welcome Back"}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {isRegister 
            ? (isEmailVerified ? "Your email is verified. Please finish creating your account." : isOtpStep ? "Check your email for the 6-digit confirmation code" : "Create your citizen account to file and track complaints") 
            : "Log in to access your portal"}
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-700 break-words border border-red-100 shadow-sm">{error}</p>}
      {success && !isRegister && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-800 border border-emerald-100 shadow-sm">{success}</p>}
      {success && isRegister && isOtpStep && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold text-emerald-800 border border-emerald-100 shadow-sm">{success}</p>}

      <div className="mt-5 space-y-4">
        {isRegister && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
              <input placeholder="e.g. Aman" disabled={isOtpStep}
                className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-ocean/50 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                onKeyDown={handleKeyDown}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
              <input placeholder="e.g. Thakur" disabled={isOtpStep}
                className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-ocean/50 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                onKeyDown={handleKeyDown}
                required
              />
            </div>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                suppressHydrationWarning
                type="email" placeholder="e.g. citizen@gmail.com" disabled={isOtpStep || isEmailVerified}
                className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-ocean/50 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={handleKeyDown}
                required
              />
              {isEmailVerified && (
                <div className="absolute right-3 top-3 text-emerald-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </div>
            
            {isRegister && !isEmailVerified && !isOtpStep && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !form.email}
                className="whitespace-nowrap rounded-lg bg-ocean w-full sm:w-auto px-6 py-3 sm:py-2 text-sm font-bold text-white shadow-sm hover:bg-ocean/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Send OTP
              </button>
            )}
          </div>
        </div>

        {showOtpModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Verify Your Email</h3>
                <p className="mt-2 text-sm text-slate-600 px-4">
                  We've sent a 6-digit code to <br/><span className="font-semibold text-slate-800">{form.email}</span>
                </p>

                {/* OTP Timer */}
                {!isEmailVerified && (
                  <div className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                    otpTimer <= 0 ? "bg-red-100 text-red-600" :
                    otpTimer <= 60 ? "bg-orange-100 text-orange-600" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {otpTimer <= 0
                      ? "OTP Expired — please resend"
                      : `Expires in ${Math.floor(otpTimer / 60)}:${String(otpTimer % 60).padStart(2, "0")}`
                    }
                  </div>
                )}
              </div>

              {otpError && (
                <div className="mt-4 rounded-lg bg-red-50 p-2 text-[13px] font-bold text-red-600 text-center border border-red-100 animate-in fade-in slide-in-from-top-1">
                  {otpError}
                </div>
              )}
              
              {otpSuccess && (
                <div className="mt-4 rounded-lg bg-emerald-50 p-2 text-[13px] font-bold text-emerald-700 text-center border border-emerald-100 animate-in fade-in slide-in-from-top-1">
                  {otpSuccess}
                </div>
              )}

              <div className="mt-6 flex flex-col items-center">
                <input
                  type="text" placeholder="- - - - - -" autoFocus
                  className="w-full rounded-xl border-2 border-slate-200 p-4 text-center text-2xl tracking-[0.3em] sm:text-3xl sm:tracking-[0.5em] font-bold focus:border-ocean focus:outline-none transition-all"
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleVerifyOtp();
                    }
                  }}
                  maxLength={6}
                />
                
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || form.otp.length !== 6 || isEmailVerified}
                  className="mt-6 w-full rounded-xl bg-ocean p-4 font-bold text-white shadow-lg hover:bg-ocean/90 disabled:opacity-50 transition-all"
                >
                  {loading ? "Verifying..." : isEmailVerified ? "Verified!" : "Verify OTP"}
                </button>

                {!isEmailVerified && (
                  <div className="mt-8 flex flex-col gap-3 w-full">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || resendCountdown > 0}
                      className="w-full rounded-xl bg-emerald-50 py-3 text-sm font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 transition-all"
                    >
                      {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : "Resend OTP"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtpModal(false);
                        setIsOtpStep(false);
                        setOtpError("");
                        setOtpSuccess("");
                      }}
                      className="w-full py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      Change Email Address
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}




        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} placeholder="••••••••" disabled={isOtpStep && !isEmailVerified}
              className="w-full rounded-lg border p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-ocean/50 disabled:bg-slate-100 disabled:text-slate-500 transition-colors"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={handleKeyDown}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              )}
            </button>
          </div>
          {isRegister && (
            <div className="mt-2 text-[13px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="font-medium text-slate-700 mb-2">Password requirements:</p>
              <ul className="space-y-1.5">
                {[
                  { label: "At least 8 characters", met: form.password.length >= 8 },
                  { label: "1 uppercase letter", met: /[A-Z]/.test(form.password) },
                  { label: "1 lowercase letter", met: /[a-z]/.test(form.password) },
                  { label: "1 number", met: /\d/.test(form.password) },
                  { label: "1 special character", met: /[\W_]/.test(form.password) },
                ].map((rule, idx) => (
                  <li key={idx} className={`flex items-center space-x-2 transition-colors ${rule.met ? "text-emerald-600 font-medium" : "text-slate-500"}`}>
                    {rule.met ? (
                      <svg className="h-4 w-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0"></div>
                    )}
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {isRegister && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" disabled={isOtpStep && !isEmailVerified}
                className={`w-full rounded-lg border p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-ocean/50 disabled:bg-slate-100 disabled:text-slate-500 transition-colors ${form.confirmPassword.length > 0 ? (form.password === form.confirmPassword ? "border-emerald-500 focus:ring-emerald-500/50" : "border-red-400 focus:ring-red-400/50") : ""}`}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                onKeyDown={handleKeyDown}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                )}
              </button>
            </div>
          </div>
        )}

      </div>

      <button
        disabled={loading || (isRegister && !isEmailVerified)}
        className="mt-8 w-full rounded-xl bg-ocean p-4 font-bold tracking-wide text-white shadow hover:bg-ocean/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
      </button>

      {googleClientId && (
        <>
          <div className="relative my-6 flex items-center justify-center">
            <hr className="w-full border-slate-200" />
            <span className="absolute bg-[#f9f6f0] px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Or</span>
          </div>
          <div className="flex justify-center">
            <div id="google-signin-btn" className="w-full max-w-[400px]"></div>
          </div>
        </>
      )}

      {!isRegister && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setShowForgotModal(true);
              setFpStep("email");
              setFpEmail("");
              setFpOtp("");
              setFpNewPassword("");
              setFpConfirmPassword("");
              setFpError("");
              setFpSuccess("");
              setFpTimer(0);
              setFpResendCountdown(0);
            }}
            className="text-sm font-semibold text-ocean hover:underline underline-offset-2"
          >
            Forgot your password?
          </button>
        </div>
      )}

      <div className="mt-5 text-center text-sm">
        <Link href="/report" className="font-semibold text-ocean underline-offset-2 hover:underline">
          Continue anonymously to report a complaint
        </Link>
      </div>

      {success && isRegister && !isOtpStep && success === "Registration completed successfully!" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm scale-100 rounded-3xl bg-white p-8 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="mt-5 text-center font-display text-2xl font-bold text-slate-800">Registration Successful!</h3>
            <p className="mt-3 text-center text-[15px] font-medium text-slate-600 leading-relaxed text-balance">
              Your citizen account has been created. You can now log in securely to track and file your cases.
            </p>
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                className="w-full rounded-xl bg-ocean px-8 py-3.5 font-bold text-white shadow-md shadow-ocean/20 transition hover:bg-ocean/90 focus:outline-none focus:ring-4 focus:ring-ocean/20"
                onClick={() => {
                  setSuccess("");
                  router.push("/login");
                }}
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </form>

    {/* Forgot Password — overlaid on top of blurred login form */}
    {showForgotModal && (
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/60">
          <div className="text-center">
            <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
              fpStep === "done" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
            }`}>
              {fpStep === "done" ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              )}
            </div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl text-slate-800">
              {fpStep === "email" && "Reset Your Password"}
              {fpStep === "otp" && "Verify Your Email"}
              {fpStep === "newpass" && "Set New Password"}
              {fpStep === "done" && "Password Reset!"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {fpStep === "email" && "Enter your registered email to receive a verification code."}
              {fpStep === "otp" && <span>We've sent a 6-digit code to <strong>{fpEmail}</strong></span>}
              {fpStep === "newpass" && "Create a strong new password for your account."}
              {fpStep === "done" && "Your password has been updated. You can now login."}
            </p>
          </div>

          {fpError && (
            <div className="mt-4 rounded-lg bg-red-50 p-2 text-[13px] font-bold text-red-600 text-center border border-red-100">
              {fpError}
            </div>
          )}
          {fpSuccess && fpStep !== "done" && (
            <div className="mt-4 rounded-lg bg-emerald-50 p-2 text-[13px] font-bold text-emerald-700 text-center border border-emerald-100">
              {fpSuccess}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4">
            {fpStep === "email" && (
              <>
                <input
                  type="email" placeholder="Enter your email" autoFocus
                  className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-ocean focus:outline-none transition-all"
                  value={fpEmail}
                  onChange={(e) => setFpEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFpSendOtp(); } }}
                />
                <button
                  type="button"
                  onClick={handleFpSendOtp}
                  disabled={fpLoading || !fpEmail}
                  className="w-full rounded-xl bg-ocean p-3 font-bold text-white shadow-lg hover:bg-ocean/90 disabled:opacity-50 transition-all"
                >
                  {fpLoading ? "Sending..." : "Send OTP"}
                </button>
              </>
            )}

            {fpStep === "otp" && (
              <>
                {fpTimer > 0 ? (
                  <div className={`text-center text-xs font-bold rounded-full px-3 py-1 mx-auto inline-flex items-center gap-1.5 ${
                    fpTimer <= 60 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-600"
                  }`}>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Expires in {Math.floor(fpTimer / 60)}:{String(fpTimer % 60).padStart(2, "0")}
                  </div>
                ) : (
                  <div className="text-center text-xs font-bold text-red-600 bg-red-100 px-3 py-1 mx-auto rounded-full">
                    OTP Expired — please resend
                  </div>
                )}
                <input
                  type="text" placeholder="- - - - - -" autoFocus
                  className="w-full rounded-xl border-2 border-slate-200 p-4 text-center text-2xl tracking-[0.3em] sm:text-3xl sm:tracking-[0.5em] font-bold focus:border-ocean focus:outline-none transition-all"
                  value={fpOtp}
                  onChange={(e) => setFpOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFpVerifyOtp(); } }}
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={handleFpVerifyOtp}
                  disabled={fpLoading || fpOtp.length !== 6}
                  className="w-full rounded-xl bg-ocean p-3 font-bold text-white shadow-lg hover:bg-ocean/90 disabled:opacity-50 transition-all"
                >
                  {fpLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={handleFpSendOtp}
                  disabled={fpLoading || fpResendCountdown > 0}
                  className="w-full rounded-xl bg-emerald-50 py-2 text-sm font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 transition-all"
                >
                  {fpResendCountdown > 0 ? `Resend OTP in ${fpResendCountdown}s` : "Resend OTP"}
                </button>
              </>
            )}

            {fpStep === "newpass" && (
              <>
                <input
                  type="password" placeholder="New Password" autoFocus
                  className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-ocean focus:outline-none transition-all"
                  value={fpNewPassword}
                  onChange={(e) => setFpNewPassword(e.target.value)}
                />
                <input
                  type="password" placeholder="Confirm New Password"
                  className={`w-full rounded-xl border-2 p-3 text-sm focus:outline-none transition-all ${
                    fpConfirmPassword.length > 0
                      ? (fpNewPassword === fpConfirmPassword ? "border-emerald-400 focus:border-emerald-500" : "border-red-300 focus:border-red-400")
                      : "border-slate-200 focus:border-ocean"
                  }`}
                  value={fpConfirmPassword}
                  onChange={(e) => setFpConfirmPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleFpResetPassword(); } }}
                />
                <div className="text-[12px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="font-medium text-slate-700 mb-1">Password requirements:</p>
                  <ul className="space-y-1">
                    {[
                      { label: "At least 8 characters", met: fpNewPassword.length >= 8 },
                      { label: "1 uppercase letter", met: /[A-Z]/.test(fpNewPassword) },
                      { label: "1 lowercase letter", met: /[a-z]/.test(fpNewPassword) },
                      { label: "1 number", met: /\d/.test(fpNewPassword) },
                      { label: "1 special character", met: /[\W_]/.test(fpNewPassword) },
                    ].map((rule, idx) => (
                      <li key={idx} className={`flex items-center gap-1.5 ${rule.met ? "text-emerald-600 font-medium" : "text-slate-500"}`}>
                        {rule.met ? (
                          <svg className="h-3.5 w-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-slate-300 shrink-0"></div>
                        )}
                        <span>{rule.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={handleFpResetPassword}
                  disabled={fpLoading || !fpNewPassword || fpNewPassword !== fpConfirmPassword}
                  className="w-full rounded-xl bg-ocean p-3 font-bold text-white shadow-lg hover:bg-ocean/90 disabled:opacity-50 transition-all"
                >
                  {fpLoading ? "Resetting..." : "Reset Password"}
                </button>
              </>
            )}

            {fpStep === "done" && (
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-full rounded-xl bg-ocean p-3 font-bold text-white shadow-lg hover:bg-ocean/90 transition-all"
              >
                Back to Login
              </button>
            )}

            {fpStep !== "done" && (
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                Back to Login
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
