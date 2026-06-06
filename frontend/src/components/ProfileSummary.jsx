"use client";

import { useEffect, useState } from "react";
import api from "../lib/api";

export default function ProfileSummary() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [rpStep, setRpStep] = useState("confirm"); // "confirm" | "otp" | "newpass" | "done"
  const [rpOtp, setRpOtp] = useState("");
  const [rpNewPassword, setRpNewPassword] = useState("");
  const [rpConfirmPassword, setRpConfirmPassword] = useState("");
  const [rpError, setRpError] = useState("");
  const [rpSuccess, setRpSuccess] = useState("");
  const [rpLoading, setRpLoading] = useState(false);
  const [rpTimer, setRpTimer] = useState(0);
  const [rpResendCountdown, setRpResendCountdown] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await api.get("/auth/me");
        setProfile(data);
      } catch (err) {
        setError(err?.response?.data?.message || "Unable to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // OTP validity timer
  useEffect(() => {
    let timer;
    if (rpTimer > 0) {
      timer = setInterval(() => setRpTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [rpTimer]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (rpResendCountdown > 0) {
      timer = setInterval(() => setRpResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [rpResendCountdown]);

  // Lock body scroll when reset modal is open
  useEffect(() => {
    if (showResetModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showResetModal]);

  const openResetModal = () => {
    setShowResetModal(true);
    setRpStep("confirm");
    setRpOtp("");
    setRpNewPassword("");
    setRpConfirmPassword("");
    setRpError("");
    setRpSuccess("");
    setRpTimer(0);
    setRpResendCountdown(0);
  };

  const handleRpSendOtp = async () => {
    const email = profile?.user?.email;
    if (!email) return;
    setRpLoading(true);
    setRpError("");
    setRpSuccess("");
    setRpOtp("");
    try {
      const res = await api.post("/auth/forgot-password/send-otp", { email });
      setRpSuccess("OTP sent to your registered email.");
      setRpStep("otp");
      setRpTimer(5 * 60);
      if (res.data?.waitLimit) setRpResendCountdown(res.data.waitLimit);
    } catch (err) {
      setRpError(err?.response?.data?.message || "Failed to send OTP.");
    } finally {
      setRpLoading(false);
    }
  };

  const handleRpVerifyOtp = async () => {
    if (rpOtp.length !== 6) return;
    const email = profile?.user?.email;
    setRpLoading(true);
    setRpError("");
    setRpSuccess("");
    try {
      await api.post("/auth/forgot-password/verify-otp", { email, otp: rpOtp });
      setRpSuccess("OTP verified! Set your new password.");
      setRpStep("newpass");
    } catch (err) {
      setRpError(err?.response?.data?.message || "Invalid OTP.");
    } finally {
      setRpLoading(false);
    }
  };

  const handleRpResetPassword = async () => {
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!strongPasswordRegex.test(rpNewPassword)) {
      setRpError("Password must meet all requirements.");
      return;
    }
    if (rpNewPassword !== rpConfirmPassword) {
      setRpError("Passwords do not match.");
      return;
    }
    const email = profile?.user?.email;
    setRpLoading(true);
    setRpError("");
    setRpSuccess("");
    try {
      await api.post("/auth/forgot-password/reset", { email, password: rpNewPassword });
      setRpStep("done");
      setRpSuccess("Password updated successfully!");
    } catch (err) {
      setRpError(err?.response?.data?.message || "Failed to reset password.");
    } finally {
      setRpLoading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-600">Loading profile...</p>;
  }

  if (error) {
    return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  }

  const user = profile?.user;
  const stats = profile?.stats || {};
  const statusCounts = stats.statusCounts || {};
  const statusEntries = Object.entries(statusCounts);

  return (
    <div className="relative">
      <div className={`space-y-6 ${showResetModal ? "pointer-events-none select-none blur-sm" : ""}`}>
        <div className="glass rounded-2xl p-6 shadow-md">
        <h1 className="font-display text-3xl font-bold">My Profile</h1>
        <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          {(user?.role === "admin" || user?.role === "investigator") && (
            <p><strong>User ID:</strong> {user?.id}</p>
          )}
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Joined:</strong> {user?.created_at ? new Date(user.created_at).toLocaleString() : "-"}</p>
        </div>

        {/* Reset Password Button */}
        {user?.provider !== "google" && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={openResetModal}
              className="inline-flex items-center gap-2 rounded-xl bg-ocean/10 px-5 py-2.5 text-sm font-bold text-ocean border border-ocean/20 hover:bg-ocean hover:text-white transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              Reset Password
            </button>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6 shadow-md">
        <h2 className="font-display text-2xl font-bold">Case Overview</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {user?.role === "investigator" ? (
            <>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Assigned Cases</p>
                <p className="mt-1 text-2xl font-bold">{stats.totalAssignedCases || 0}</p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-slate-500">Notes Added</p>
                <p className="mt-1 text-2xl font-bold">{stats.totalNotesAdded || 0}</p>
              </div>
            </>
          ) : (
            <div className="rounded-xl bg-white p-4">
              <p className="text-sm text-slate-500">Cases Filed</p>
              <p className="mt-1 text-2xl font-bold">{stats.totalCasesFiled || 0}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="font-semibold">Status Breakdown</h3>
          {statusEntries.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No cases yet.</p>
          ) : (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {statusEntries.map(([status, count]) => (
                <li key={status} className="rounded-lg bg-white p-3 text-sm">
                  <strong>{status}:</strong> {count}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 shadow-md">
        <h2 className="font-display text-2xl font-bold">Recent Cases</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Case ID</th>
                <th className="p-2">Crime Type</th>
                <th className="p-2">Status</th>
                <th className="p-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recentCases || stats.recentAssignedCases || []).map((caseItem) => (
                <tr key={caseItem.report_id} className="border-t">
                  <td className="p-2">{caseItem.report_id}</td>
                  <td className="p-2">{caseItem.crime_type}</td>
                  <td className="p-2">{caseItem.status}</td>
                  <td className="p-2">{new Date(caseItem.updated_at || caseItem.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="glass w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white/60 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
                rpStep === "done" ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
              }`}>
                {rpStep === "done" ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                {rpStep === "confirm" && "Reset Password"}
                {rpStep === "otp" && "Verify Your Email"}
                {rpStep === "newpass" && "Set New Password"}
                {rpStep === "done" && "Password Updated!"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {rpStep === "confirm" && <span>We'll send an OTP to <strong>{user?.email}</strong> to verify your identity.</span>}
                {rpStep === "otp" && <span>Enter the 6-digit code sent to <strong>{user?.email}</strong></span>}
                {rpStep === "newpass" && "Create a strong new password for your account."}
                {rpStep === "done" && "Your password has been updated successfully."}
              </p>
            </div>

            {rpError && (
              <div className="mt-4 rounded-lg bg-red-50 p-2 text-[13px] font-bold text-red-600 text-center border border-red-100">
                {rpError}
              </div>
            )}
            {rpSuccess && rpStep !== "done" && (
              <div className="mt-4 rounded-lg bg-emerald-50 p-2 text-[13px] font-bold text-emerald-700 text-center border border-emerald-100">
                {rpSuccess}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4">
              {/* Step 1: Confirm */}
              {rpStep === "confirm" && (
                <button
                  type="button"
                  onClick={handleRpSendOtp}
                  disabled={rpLoading}
                  className="w-full rounded-xl bg-ocean p-3 font-bold text-white shadow-lg hover:bg-ocean/90 disabled:opacity-50 transition-all"
                >
                  {rpLoading ? "Sending OTP..." : "Send Verification OTP"}
                </button>
              )}

              {/* Step 2: OTP Verification */}
              {rpStep === "otp" && (
                <>
                  {rpTimer > 0 ? (
                    <div className={`text-center text-xs font-bold rounded-full px-3 py-1 mx-auto inline-flex items-center gap-1.5 ${
                      rpTimer <= 60 ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-600"
                    }`}>
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Expires in {Math.floor(rpTimer / 60)}:{String(rpTimer % 60).padStart(2, "0")}
                    </div>
                  ) : (
                    <div className="text-center text-xs font-bold text-red-600 bg-red-100 px-3 py-1 mx-auto rounded-full">
                      OTP Expired — please resend
                    </div>
                  )}
                  <input
                    type="text" placeholder="- - - - - -" autoFocus
                    className="w-full rounded-xl border-2 border-slate-200 p-4 text-center text-2xl tracking-[0.3em] sm:text-3xl sm:tracking-[0.5em] font-bold focus:border-ocean focus:outline-none transition-all"
                    value={rpOtp}
                    onChange={(e) => setRpOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleRpVerifyOtp(); } }}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    onClick={handleRpVerifyOtp}
                    disabled={rpLoading || rpOtp.length !== 6}
                    className="w-full rounded-xl bg-ocean p-3 font-bold text-white shadow-lg hover:bg-ocean/90 disabled:opacity-50 transition-all"
                  >
                    {rpLoading ? "Verifying..." : "Verify OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRpSendOtp}
                    disabled={rpLoading || rpResendCountdown > 0}
                    className="w-full rounded-xl bg-emerald-50 py-2 text-sm font-bold text-emerald-700 border border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 transition-all"
                  >
                    {rpResendCountdown > 0 ? `Resend OTP in ${rpResendCountdown}s` : "Resend OTP"}
                  </button>
                </>
              )}

              {/* Step 3: New Password */}
              {rpStep === "newpass" && (
                <>
                  <input
                    type="password" placeholder="New Password" autoFocus
                    className="w-full rounded-xl border-2 border-slate-200 p-3 text-sm focus:border-ocean focus:outline-none transition-all"
                    value={rpNewPassword}
                    onChange={(e) => setRpNewPassword(e.target.value)}
                  />
                  <input
                    type="password" placeholder="Confirm New Password"
                    className={`w-full rounded-xl border-2 p-3 text-sm focus:outline-none transition-all ${
                      rpConfirmPassword.length > 0
                        ? (rpNewPassword === rpConfirmPassword ? "border-emerald-400 focus:border-emerald-500" : "border-red-300 focus:border-red-400")
                        : "border-slate-200 focus:border-ocean"
                    }`}
                    value={rpConfirmPassword}
                    onChange={(e) => setRpConfirmPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleRpResetPassword(); } }}
                  />
                  <div className="text-[12px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="font-medium text-slate-700 mb-1">Password requirements:</p>
                    <ul className="space-y-1">
                      {[
                        { label: "At least 8 characters", met: rpNewPassword.length >= 8 },
                        { label: "1 uppercase letter", met: /[A-Z]/.test(rpNewPassword) },
                        { label: "1 lowercase letter", met: /[a-z]/.test(rpNewPassword) },
                        { label: "1 number", met: /\d/.test(rpNewPassword) },
                        { label: "1 special character", met: /[\W_]/.test(rpNewPassword) },
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
                    onClick={handleRpResetPassword}
                    disabled={rpLoading || !rpNewPassword || rpNewPassword !== rpConfirmPassword}
                    className="w-full rounded-xl bg-ocean p-3 font-bold text-white shadow-lg hover:bg-ocean/90 disabled:opacity-50 transition-all"
                  >
                    {rpLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </>
              )}

              {/* Step 4: Done */}
              {rpStep === "done" && (
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="w-full rounded-xl bg-ocean p-3 font-bold text-white shadow-lg hover:bg-ocean/90 transition-all"
                >
                  Done
                </button>
              )}

              {rpStep !== "done" && (
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
