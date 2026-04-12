"use client";

import { useEffect, useState } from "react";
import api from "../lib/api";

export default function ProfileSummary() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <section className="space-y-6">
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
    </section>
  );
}
