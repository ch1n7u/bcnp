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
    phone: ""
  });
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
            : "/profile";
      router.replace(dest);
    }
  }, [isAuthenticated, user, router]);

  const isRegister = mode === "register";

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedPhone = form.phone.trim();
    if (isRegister && !/^\+?[0-9]{10,15}$/.test(trimmedPhone)) {
      setError("Phone number is required and must be 10 to 15 digits.");
      return;
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
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
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
            : "/profile";
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
        setError("Unable to reach server. Ensure backend is running at http://localhost:5000 and try again.");
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
      {success && <p className="mt-4 rounded-lg bg-green-50 p-2 text-sm text-green-700">{success}</p>}

      <div className="mt-5 space-y-4">
        {isRegister && (
          <input
            placeholder="Full name"
            className="w-full rounded-lg border p-3"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        )}
        {isRegister && (
          <input
            type="tel"
            placeholder="Phone"
            className="w-full rounded-lg border p-3"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            pattern="^\+?[0-9]{10,15}$"
            title="Phone must be 10 to 15 digits"
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded-lg border p-3"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-lg border p-3"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
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
    </form>
  );
}
