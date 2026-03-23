"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AuthForm({ mode = "login" }) {
  const router = useRouter();
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  const isRegister = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedPhone = form.phone.trim();
    if (isRegister) {
      if (!/^[0-9]{10}$/.test(trimmedPhone)) {
        setError("Phone number is required and must be exactly 10 digits.");
        return;
      }
      
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!strongPasswordRegex.test(form.password)) {
        setError("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.");
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match. Please ensure both password fields are identical.");
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister
        ? {
            name: form.name,
            email: form.email,
            password: form.password,
            phone: trimmedPhone
          }
        : {
            email: form.email,
            password: form.password
          };

      const { data } = await api.post(endpoint, payload);

      if (isRegister) {
        setSuccess("Registration completed successfully!");
        setForm({ name: "", email: "", password: "", confirmPassword: "", phone: "" });
        return;
      }

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

      // Fallback in case Next navigation does not trigger in some browser states.
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

  return (
    <form onSubmit={submit} className="glass mx-auto w-full max-w-xl rounded-2xl p-5 shadow-lg sm:p-6">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{isRegister ? "Create Account" : "Welcome Back"}</h1>
      <p className="mt-1 text-sm text-slate-600">
        {isRegister ? "Create your citizen account to file and track complaints" : "Log in to access your portal"}
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {success && !isRegister && <p className="mt-4 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">{success}</p>}

      <div className="mt-5 space-y-4">
        {isRegister && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
            <input
              placeholder="e.g. Aman Thakur"
              className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-ocean/50"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
        )}
        {isRegister && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone <span className="text-red-500">*</span></label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-ocean/50"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              pattern="^[0-9]{10}$"
              title="Phone must be exactly 10 digits"
              required
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email <span className="text-red-500">*</span></label>
          <input
            type="email"
            placeholder="e.g. citizen@gmail.com"
            className="w-full rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-ocean/50"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full rounded-lg border p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-ocean/50"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
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
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`w-full rounded-lg border p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-ocean/50 ${form.confirmPassword.length > 0 ? (form.password === form.confirmPassword ? "border-emerald-500 focus:ring-emerald-500/50" : "border-red-400 focus:ring-red-400/50") : ""}`}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
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
            {form.confirmPassword.length > 0 && (
              <div className={`mt-1.5 flex items-center space-x-1.5 text-[13px] font-medium transition-colors ${form.password === form.confirmPassword ? "text-emerald-600" : "text-red-500"}`}>
                {form.password === form.confirmPassword ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    <span>Passwords match</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    <span>Passwords do not match</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-ocean p-3 font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Please wait..." : isRegister ? "Register" : "Login"}
      </button>

      <div className="mt-3 text-center text-sm">
        <Link href="/report" className="font-semibold text-ocean underline-offset-2 hover:underline">
          Continue anonymously to report a complaint
        </Link>
      </div>

      {success && isRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm scale-100 rounded-3xl bg-white p-8 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="mt-5 text-center font-display text-2xl font-bold text-slate-800">Registration Successful!</h3>
            <p className="mt-3 text-center text-[15px] font-medium text-slate-600 leading-relaxed text-balance">
              Your citizen account has been uniquely created. You can now log in securely to track and file your cases.
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
  );
}
