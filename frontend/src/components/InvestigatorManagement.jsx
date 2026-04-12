"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";

export default function InvestigatorManagement() {
  const [investigators, setInvestigators] = useState([]);
  const [creatingInvestigator, setCreatingInvestigator] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "" });
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(null);
  const [editingInvestigatorId, setEditingInvestigatorId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", password: "" });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(null);
  const [savingInvestigatorId, setSavingInvestigatorId] = useState(null);
  const [deletingInvestigatorId, setDeletingInvestigatorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/admin/investigators");
      setInvestigators(data?.investigators || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load investigators.");
      setInvestigators([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createInvestigator = async (event) => {
    event.preventDefault();

    try {
      setCreatingInvestigator(true);
      setCreateError("");
      setCreateSuccess(null);

      const { data } = await api.post("/admin/investigators", createForm);
      setCreateSuccess(data);
      setCreateForm({ name: "", email: "", password: "" });
      await load();
    } catch (err) {
      setCreateError(err?.response?.data?.message || "Unable to create investigator.");
    } finally {
      setCreatingInvestigator(false);
    }
  };

  const startEditingInvestigator = (investigator) => {
    setEditingInvestigatorId(investigator.id);
    setEditError("");
    setEditSuccess(null);
    setEditForm({
      name: investigator.name,
      email: investigator.email,
      password: ""
    });
  };

  const cancelEditingInvestigator = () => {
    setEditingInvestigatorId(null);
    setEditForm({ name: "", email: "", password: "" });
    setEditError("");
    setEditSuccess(null);
  };

  const saveInvestigator = async (investigatorId) => {
    try {
      setSavingInvestigatorId(investigatorId);
      setEditError("");
      setEditSuccess(null);

      const payload = {
        name: editForm.name,
        email: editForm.email,
        ...(editForm.password.trim() ? { password: editForm.password.trim() } : {})
      };

      const { data } = await api.patch(`/admin/investigators/${investigatorId}`, payload);
      setEditSuccess(data);
      await load();
      setEditingInvestigatorId(null);
      setEditForm({ name: "", email: "", password: "" });
    } catch (err) {
      setEditError(err?.response?.data?.message || "Unable to update investigator.");
    } finally {
      setSavingInvestigatorId(null);
    }
  };

  const removeInvestigator = async (investigator) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Remove investigator ${investigator.name}? Assigned cases will become unassigned.`
      );
      if (!confirmed) return;
    }

    try {
      setDeletingInvestigatorId(investigator.id);
      setError("");
      await api.delete(`/admin/investigators/${investigator.id}`);
      if (editingInvestigatorId === investigator.id) {
        cancelEditingInvestigator();
      }
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to remove investigator.");
    } finally {
      setDeletingInvestigatorId(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Investigator Management</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create investigator accounts, review workload, update credentials, or remove investigators.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <Link href="/dashboard/admin" className="rounded-lg border px-4 py-2 text-center text-sm font-semibold text-slate-700">
            Back to Admin Home
          </Link>
          <Link href="/dashboard/admin/cases" className="rounded-lg bg-ocean px-4 py-2 text-center text-sm font-semibold text-white">
            Open Case Assignment
          </Link>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="glass rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Investigators</h2>
          <p className="mt-1 text-sm text-slate-600">Availability and workload for all active investigator accounts.</p>

          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="text-sm text-slate-500">Loading investigators...</p>
            ) : investigators.length === 0 ? (
              <p className="text-sm text-slate-500">No investigators found.</p>
            ) : (
              investigators.map((investigator) => (
                <div key={investigator.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{investigator.name}</p>
                      <p className="text-sm text-slate-500">{investigator.email}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        investigator.currentStatus === "Busy"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {investigator.currentStatus}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-center text-xs sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-lg font-bold text-slate-800">{investigator.totalAssignedCases}</p>
                      <p className="text-slate-500">Total</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-lg font-bold text-slate-800">{investigator.activeAssignedCases}</p>
                      <p className="text-slate-500">Active</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="text-lg font-bold text-slate-800">{investigator.resolvedCases}</p>
                      <p className="text-slate-500">Resolved</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-ocean px-3 py-2 text-sm font-semibold text-ocean"
                      onClick={() => startEditingInvestigator(investigator)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                      disabled={deletingInvestigatorId === investigator.id}
                      onClick={() => removeInvestigator(investigator)}
                    >
                      {deletingInvestigatorId === investigator.id ? "Removing..." : "Remove"}
                    </button>
                  </div>

                  {editingInvestigatorId === investigator.id && (
                    <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <input
                        className="w-full rounded-lg border p-3"
                        placeholder="Investigator name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                      <input
                        className="w-full rounded-lg border p-3"
                        type="email"
                        placeholder="Investigator email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                      <input
                        className="w-full rounded-lg border p-3"
                        type="text"
                        placeholder="New password (optional)"
                        value={editForm.password}
                        onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                      />

                      {editError && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{editError}</p>}
                      {editSuccess?.investigator?.id === investigator.id && (
                        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                          <p className="font-semibold">Investigator updated successfully.</p>
                          <p>Email: {editSuccess.investigator.email}</p>
                          {editSuccess.message && <p>{editSuccess.message}</p>}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-ocean px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                          disabled={savingInvestigatorId === investigator.id}
                          onClick={() => saveInvestigator(investigator.id)}
                        >
                          {savingInvestigatorId === investigator.id ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600"
                          onClick={cancelEditingInvestigator}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section id="add-investigator" className="glass rounded-2xl p-5 sm:p-6">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Add Investigator</h2>
          <p className="mt-1 text-sm text-slate-600">Create a new investigator account and define their login credentials.</p>

          <form className="mt-4 space-y-3" onSubmit={createInvestigator}>
            <input
              className="w-full rounded-lg border p-3"
              placeholder="Investigator name"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
            <input
              className="w-full rounded-lg border p-3"
              type="email"
              placeholder="Investigator email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
            <input
              className="w-full rounded-lg border p-3"
              type="text"
              placeholder="Temporary password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              required
            />

            {createError && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{createError}</p>}
            {createSuccess && (
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
                <p className="font-semibold">Investigator created successfully.</p>
                <p>Email: {createSuccess.investigator?.email}</p>
                {createSuccess.message && <p>{createSuccess.message}</p>}
              </div>
            )}

            <button
              className="w-full rounded-lg bg-ocean px-4 py-3 font-semibold text-white disabled:opacity-60"
              disabled={creatingInvestigator}
            >
              {creatingInvestigator ? "Creating..." : "Create Investigator"}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
