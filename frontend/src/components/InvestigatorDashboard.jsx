"use client";

import { useEffect, useState, useCallback } from "react";
import api from "../lib/api";

const STATUSES = ["Submitted", "Under Review", "Investigation", "Resolved", "Closed"];

const STATUS_COLORS = {
  Submitted: "bg-blue-100 text-blue-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Investigation: "bg-orange-100 text-orange-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-slate-100 text-slate-600",
};

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-xl p-4 ${accent}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
    </div>
  );
}

export default function InvestigatorDashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [noteInputs, setNoteInputs] = useState({});
  const [expandedNotes, setExpandedNotes] = useState({});
  const [notesList, setNotesList] = useState({});
  const [savingNote, setSavingNote] = useState({});
  const [noteError, setNoteError] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/cases/assigned");
      setCases(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load assigned cases.");
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (reportId, status) => {
    try {
      setError("");
      await api.patch(`/cases/${reportId}/status`, { status });
      setCases((prev) =>
        prev.map((c) => (c.report_id === reportId ? { ...c, status, updated_at: new Date().toISOString() } : c))
      );
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update status.");
    }
  };

  const saveNote = async (reportId) => {
    const text = (noteInputs[reportId] || "").trim();
    if (!text) return;
    setSavingNote((prev) => ({ ...prev, [reportId]: true }));
    setNoteError((prev) => ({ ...prev, [reportId]: "" }));
    try {
      await api.post(`/cases/${reportId}/notes`, { noteText: text });
      setNoteInputs((prev) => ({ ...prev, [reportId]: "" }));
      // Refresh notes if expanded
      if (expandedNotes[reportId]) {
        fetchNotes(reportId);
      }
    } catch (err) {
      setNoteError((prev) => ({
        ...prev,
        [reportId]: err?.response?.data?.message || "Failed to save note.",
      }));
    } finally {
      setSavingNote((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const fetchNotes = async (reportId) => {
    try {
      const { data } = await api.get(`/cases/${reportId}/notes`);
      setNotesList((prev) => ({ ...prev, [reportId]: data || [] }));
    } catch {
      setNotesList((prev) => ({ ...prev, [reportId]: [] }));
    }
  };

  const toggleNotes = async (reportId) => {
    if (expandedNotes[reportId]) {
      setExpandedNotes((prev) => ({ ...prev, [reportId]: false }));
    } else {
      setExpandedNotes((prev) => ({ ...prev, [reportId]: true }));
      await fetchNotes(reportId);
    }
  };

  const filtered = statusFilter ? cases.filter((c) => c.status === statusFilter) : cases;

  // Stats
  const total = cases.length;
  const active = cases.filter((c) => ["Submitted", "Under Review", "Investigation"].includes(c.status)).length;
  const resolved = cases.filter((c) => c.status === "Resolved").length;
  const closed = cases.filter((c) => c.status === "Closed").length;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Investigator Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your assigned cases, update statuses, and add investigation notes.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Assigned" value={total} accent="bg-ocean/10 text-ocean" />
        <StatCard label="Active" value={active} accent="bg-orange-50 text-orange-700" />
        <StatCard label="Resolved" value={resolved} accent="bg-green-50 text-green-700" />
        <StatCard label="Closed" value={closed} accent="bg-slate-100 text-slate-600" />
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="text-sm font-semibold text-slate-700">Filter by status:</label>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm sm:w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All ({total})</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s} ({cases.filter((c) => c.status === s).length})
            </option>
          ))}
        </select>
        <button onClick={load} className="w-full rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 sm:w-auto">
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading assigned cases...</p>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-slate-500">
          {statusFilter ? `No cases with status "${statusFilter}".` : "No cases assigned to you yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div key={c.report_id} className="glass rounded-2xl p-5 shadow-sm">
              {/* Case header row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">#{c.report_id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[c.status] || "bg-slate-100 text-slate-600"}`}>
                      {c.status}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">{c.crime_type}</p>
                  <p className="text-sm text-slate-500">
                    Victim: <span className="text-slate-700">{c.victim_name}</span>
                    {c.location ? <> &nbsp;·&nbsp; Location: <span className="text-slate-700">{c.location}</span></> : null}
                    {c.financial_loss_amount > 0 ? (
                      <> &nbsp;·&nbsp; Loss: <span className="text-slate-700">₹{Number(c.financial_loss_amount).toLocaleString("en-IN")}</span></>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-400">
                    Reported: {new Date(c.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    &nbsp;·&nbsp; Updated: {new Date(c.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>

                {/* Status updater */}
                <div className="flex flex-col items-end gap-2">
                  <label className="text-xs font-semibold text-slate-500">Update Status</label>
                  <select
                    className="rounded-lg border px-3 py-1.5 text-sm"
                    value={c.status}
                    onChange={(e) => updateStatus(c.report_id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Case Details & Evidence */}
              <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <h4 className="font-semibold text-slate-700">Contact Details</h4>
                    <p className="text-slate-600">Email: {c.email || "N/A"}</p>
                    <p className="text-slate-600">Phone: {c.phone_number || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700">Incident Details</h4>
                    <p className="text-slate-600">Date/Time: {c.incident_datetime ? new Date(c.incident_datetime).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <h4 className="font-semibold text-slate-700">Description</h4>
                    <p className="mt-1 whitespace-pre-wrap text-slate-600 rounded-lg bg-white p-3 shadow-sm border border-slate-100">{c.description || "No description provided."}</p>
                  </div>
                </div>

                {c.suspect_details && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <h4 className="font-semibold text-slate-700">Scam & Suspect Details</h4>
                    <p className="mt-1 whitespace-pre-wrap rounded-lg bg-white p-3 text-sm text-slate-600 shadow-sm border border-slate-100">
                      {c.suspect_details}
                    </p>
                  </div>
                )}

                {c.evidence && c.evidence.length > 0 && (
                  <div className="mt-4 border-t border-slate-200 pt-4">
                    <h4 className="font-semibold text-slate-700 mb-2">Attached Evidence</h4>
                    <div className="flex flex-wrap gap-3">
                      {c.evidence.map((ev) => (
                        <a
                          key={ev.evidence_id}
                          href={ev.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ocean transition hover:border-ocean hover:bg-ocean/5 shadow-sm"
                          title={ev.mime_type}
                        >
                          📎 {ev.original_name || "Attachment"}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Note input */}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm sm:min-w-[200px] sm:flex-1"
                  placeholder="Add investigation note..."
                  value={noteInputs[c.report_id] || ""}
                  onChange={(e) => setNoteInputs((prev) => ({ ...prev, [c.report_id]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") saveNote(c.report_id); }}
                />
                <button
                  className="w-full rounded-lg bg-ocean px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
                  disabled={savingNote[c.report_id] || !noteInputs[c.report_id]?.trim()}
                  onClick={() => saveNote(c.report_id)}
                >
                  {savingNote[c.report_id] ? "Saving..." : "Add Note"}
                </button>
                <button
                  className="w-full rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:w-auto"
                  onClick={() => toggleNotes(c.report_id)}
                >
                  {expandedNotes[c.report_id] ? "Hide Notes" : "View Notes"}
                </button>
              </div>
              {noteError[c.report_id] && (
                <p className="mt-1 text-xs text-red-600">{noteError[c.report_id]}</p>
              )}

              {/* Notes list */}
              {expandedNotes[c.report_id] && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  {(notesList[c.report_id] || []).length === 0 ? (
                    <p className="text-xs text-slate-400">No notes yet.</p>
                  ) : (
                    (notesList[c.report_id] || []).map((note) => (
                      <div key={note.note_id} className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-sm text-slate-700">{note.note_text}</p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {note.investigator_name || "Investigator"} &nbsp;·&nbsp;{" "}
                          {new Date(note.created_at).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
