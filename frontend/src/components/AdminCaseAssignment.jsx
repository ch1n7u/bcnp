"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import api from "../lib/api";

const statuses = ["Submitted", "Under Review", "Investigation", "Resolved", "Closed"];

const statusBadge = {
  Submitted: "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Investigation: "bg-orange-100 text-orange-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-slate-100 text-slate-600"
};

const timelineActionLabel = {
  CASE_CREATED: "Case created",
  INVESTIGATOR_ASSIGNED: "Investigator assigned",
  STATUS_UPDATED: "Status updated",
  CASE_NOTE_ADDED: "Case note added",
  EVIDENCE_UPLOADED: "Evidence uploaded",
  CASE_DELETED: "Case deleted"
};

function timelineDescription(entry) {
  const metadata = entry.metadata || {};

  if (entry.action_type === "STATUS_UPDATED") {
    return `Status changed from ${metadata.previous_status || "Unknown"} to ${metadata.new_status || "Unknown"}.`;
  }

  if (entry.action_type === "INVESTIGATOR_ASSIGNED") {
    const investigatorName = metadata.new_investigator_name || metadata.new_investigator_id || "Unknown";
    return `Assigned to ${investigatorName}.`;
  }

  if (entry.action_type === "CASE_NOTE_ADDED") {
    return metadata.note_preview ? `Note: ${metadata.note_preview}` : "A case note was added.";
  }

  if (entry.action_type === "EVIDENCE_UPLOADED") {
    const name = metadata.original_name || "evidence file";
    return `Uploaded ${name}.`;
  }

  if (entry.action_type === "CASE_CREATED") {
    return `Case opened as ${metadata.initial_status || "Submitted"}.`;
  }

  if (entry.action_type === "CASE_DELETED") {
    return metadata.message || "Case deleted by admin.";
  }

  return "Action recorded.";
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const raw = String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-2xl p-4 ${accent}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
    </div>
  );
}

export default function AdminCaseAssignment() {
  const [reports, setReports] = useState([]);
  const [investigators, setInvestigators] = useState([]);
  const [filter, setFilter] = useState({ status: "", crimeType: "" });
  const [noteText, setNoteText] = useState({});
  const [selectedInvestigator, setSelectedInvestigator] = useState({});
  const [assigningReportId, setAssigningReportId] = useState(null);
  const [updatingReportId, setUpdatingReportId] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [pendingDeleteReportId, setPendingDeleteReportId] = useState(null);
  const [timelineReportId, setTimelineReportId] = useState(null);
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.crimeType) params.crimeType = filter.crimeType;

      const [reportsResult, investigatorsResult] = await Promise.allSettled([
        api.get("/reports", { params }),
        api.get("/admin/investigators")
      ]);

      const nextReports = reportsResult.status === "fulfilled" ? reportsResult.value.data || [] : [];
      const nextInvestigators =
        investigatorsResult.status === "fulfilled"
          ? investigatorsResult.value.data?.investigators || []
          : [];

      setReports(nextReports);
      setInvestigators(nextInvestigators);
      setSelectedInvestigator((prev) => {
        const next = { ...prev };
        for (const report of nextReports) {
          if (next[report.report_id] === undefined) {
            next[report.report_id] = report.assigned_investigator_id || "";
          }
        }
        return next;
      });

      if (reportsResult.status === "rejected") {
        const reportErrorMessage =
          reportsResult.reason?.response?.data?.message || "Unable to load reports.";
        setError(reportErrorMessage);
      } else if (investigatorsResult.status === "rejected") {
        const investigatorErrorMessage =
          investigatorsResult.reason?.response?.data?.message ||
          "Reports loaded, but investigators list is unavailable.";
        setError(investigatorErrorMessage);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load case assignment data.");
      setReports([]);
      setInvestigators([]);
    } finally {
      setLoading(false);
    }
  }, [filter.crimeType, filter.status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    if (pendingDeleteReportId || timelineReportId) {
      htmlElement.style.overflow = "hidden";
      bodyElement.style.overflow = "hidden";
    } else {
      htmlElement.style.overflow = "";
      bodyElement.style.overflow = "";
    }

    return () => {
      htmlElement.style.overflow = "";
      bodyElement.style.overflow = "";
    };
  }, [pendingDeleteReportId, timelineReportId]);

  const updateStatus = async (reportId, status) => {
    try {
      setUpdatingReportId(reportId);
      setError("");
      await api.patch(`/cases/${reportId}/status`, { status });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to update status.");
    } finally {
      setUpdatingReportId(null);
    }
  };

  const assign = async (reportId, investigatorId) => {
    if (!investigatorId) {
      setError("Please select an investigator before assigning the case.");
      return;
    }

    try {
      setAssigningReportId(reportId);
      setError("");
      await api.put("/admin/assign-investigator", {
        reportId,
        investigatorId: String(investigatorId).trim()
      });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to assign investigator.");
    } finally {
      setAssigningReportId(null);
    }
  };

  const addNote = async (reportId) => {
    if (!noteText[reportId]) return;
    try {
      setError("");
      await api.post(`/cases/${reportId}/notes`, { noteText: noteText[reportId] });
      setNoteText((prev) => ({ ...prev, [reportId]: "" }));
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to add note.");
    }
  };

  const confirmDeleteCase = async () => {
    if (!pendingDeleteReportId) return;

    try {
      setDeletingReportId(pendingDeleteReportId);
      setError("");
      await api.delete(`/cases/${pendingDeleteReportId}`);
      await load();
      setPendingDeleteReportId(null);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to delete case.");
    } finally {
      setDeletingReportId(null);
    }
  };

  const requestDeleteCase = (reportId) => {
    setPendingDeleteReportId(reportId);
  };

  const cancelDeleteCase = () => {
    if (deletingReportId) return;
    setPendingDeleteReportId(null);
  };

  const openTimeline = async (reportId) => {
    setTimelineReportId(reportId);
    setTimelineError("");
    setTimelineEntries([]);

    try {
      setTimelineLoading(true);
      const { data } = await api.get(`/cases/${reportId}/timeline`);
      setTimelineEntries(data || []);
    } catch (err) {
      setTimelineError(err?.response?.data?.message || "Unable to load case timeline.");
    } finally {
      setTimelineLoading(false);
    }
  };

  const closeTimeline = () => {
    if (timelineLoading) return;
    setTimelineReportId(null);
    setTimelineEntries([]);
    setTimelineError("");
  };

  const exportTimelineCsv = () => {
    if (!timelineReportId || timelineEntries.length === 0) return;

    const header = [
      "Timeline ID",
      "Case ID",
      "Action",
      "Description",
      "Actor Name",
      "Actor Role",
      "IP Address",
      "Timestamp"
    ];

    const rows = timelineEntries.map((entry) => [
      entry.timeline_id,
      entry.report_id,
      timelineActionLabel[entry.action_type] || entry.action_type,
      timelineDescription(entry),
      entry.actor_name || "System/Anonymous",
      entry.actor_role || "",
      entry.ip_address || "",
      new Date(entry.created_at).toISOString()
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => csvEscape(cell)).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", `case-${timelineReportId}-timeline.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  const exportTimelinePdf = () => {
    if (!timelineReportId || timelineEntries.length === 0) return;

    const popup = window.open("", "_blank", "width=1000,height=800");
    if (!popup) {
      setTimelineError("Popup blocked. Allow popups to export PDF.");
      return;
    }

    const itemsHtml = timelineEntries
      .map((entry) => {
        const action = timelineActionLabel[entry.action_type] || entry.action_type;
        const actor = `${entry.actor_name || "System/Anonymous"}${entry.actor_role ? ` (${entry.actor_role})` : ""
          }`;
        const time = new Date(entry.created_at).toLocaleString();
        const description = timelineDescription(entry)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        return `
          <article class="item">
            <div class="row">
              <strong>${action}</strong>
              <span>${time}</span>
            </div>
            <p>${description}</p>
            <p class="meta">Actor: ${actor}${entry.ip_address ? ` | IP: ${entry.ip_address}` : ""}</p>
          </article>
        `;
      })
      .join("");

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Case ${timelineReportId} Timeline</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 24px; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            .sub { margin: 0 0 20px; color: #475569; font-size: 13px; }
            .item { border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; margin: 0 0 10px; }
            .row { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 8px; font-size: 13px; }
            p { margin: 0 0 8px; font-size: 13px; line-height: 1.4; }
            .meta { color: #64748b; font-size: 12px; margin: 0; }
            @media print { body { margin: 12mm; } }
          </style>
        </head>
        <body>
          <h1>Case Timeline #${timelineReportId}</h1>
          <p class="sub">Generated ${new Date().toLocaleString()}</p>
          ${itemsHtml}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    popup.document.close();
  };

  const investigatorNameById = useMemo(() => {
    return investigators.reduce((acc, investigator) => {
      acc[investigator.id] = investigator.name;
      return acc;
    }, {});
  }, [investigators]);

  const timelineReport = useMemo(
    () => reports.find((report) => report.report_id === timelineReportId) || null,
    [reports, timelineReportId]
  );

  const totalReports = reports.length;
  const unassignedReports = reports.filter((report) => !report.assigned_investigator_id).length;
  const busyInvestigators = investigators.filter((investigator) => investigator.currentStatus === "Busy").length;
  const availableInvestigators = investigators.filter(
    (investigator) => investigator.currentStatus === "Available"
  ).length;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Case Assignment</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review reports, assign investigators, update status, and add case notes.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <Link href="/dashboard/admin" className="rounded-lg border px-4 py-2 text-center text-sm font-semibold text-slate-700">
            Back to Admin Home
          </Link>
          <Link href="/dashboard/admin/investigators" className="rounded-lg bg-ocean px-4 py-2 text-center text-sm font-semibold text-white">
            Manage Investigators
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Visible Reports" value={totalReports} accent="bg-ocean/10 text-ocean" />
        <StatCard label="Unassigned Cases" value={unassignedReports} accent="bg-coral/10 text-coral" />
        <StatCard label="Busy Investigators" value={busyInvestigators} accent="bg-amber-50 text-amber-700" />
        <StatCard label="Available Investigators" value={availableInvestigators} accent="bg-green-50 text-green-700" />
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="glass rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Report Queue</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <select
              className="w-full rounded-lg border p-2 sm:w-auto"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-lg border p-2 sm:w-auto"
              placeholder="Crime type"
              value={filter.crimeType}
              onChange={(e) => setFilter({ ...filter, crimeType: e.target.value })}
            />
          </div>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-600">Loading reports...</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="p-2">ID</th>
                  <th className="p-2">Citizen</th>
                  <th className="p-2">Crime</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Assigned To</th>
                  <th className="p-2">Assign</th>
                  <th className="p-2">Note</th>
                  <th className="p-2">Timeline</th>
                  <th className="p-2">Delete</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.report_id} className="border-t align-top">
                    <td className="p-2 font-semibold">#{report.report_id}</td>
                    <td className="p-2">{report.victim_name || report.citizen_name || "Anonymous"}</td>
                    <td className="p-2">
                      <div className="font-medium">{report.crime_type}</div>
                      <div className="text-xs text-slate-400">{report.location}</div>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col gap-2">
                        <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${statusBadge[report.status] || "bg-slate-100 text-slate-600"}`}>
                          {report.status}
                        </span>
                        <select
                          className="rounded border p-1"
                          value={report.status}
                          disabled={updatingReportId === report.report_id}
                          onChange={(e) => updateStatus(report.report_id, e.target.value)}
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="p-2">
                      {report.investigator_name || investigatorNameById[report.assigned_investigator_id] || "Unassigned"}
                    </td>
                    <td className="p-2">
                      <div className="flex min-w-[220px] gap-2">
                        <select
                          className="flex-1 rounded border p-1"
                          value={selectedInvestigator[report.report_id] || ""}
                          onChange={(e) =>
                            setSelectedInvestigator((prev) => ({
                              ...prev,
                              [report.report_id]: e.target.value
                            }))
                          }
                        >
                          <option value="">Select investigator</option>
                          {investigators.map((investigator) => (
                            <option key={investigator.id} value={investigator.id}>
                              {investigator.name} ({investigator.currentStatus})
                            </option>
                          ))}
                        </select>
                        <button
                          className="rounded bg-ocean px-3 py-1 text-white disabled:opacity-60"
                          disabled={assigningReportId === report.report_id}
                          onClick={() => assign(report.report_id, selectedInvestigator[report.report_id])}
                        >
                          {assigningReportId === report.report_id ? "..." : "Assign"}
                        </button>
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex min-w-[220px] gap-2">
                        <input
                          className="flex-1 rounded border p-1"
                          placeholder="Investigation note"
                          value={noteText[report.report_id] || ""}
                          onChange={(e) =>
                            setNoteText((prev) => ({ ...prev, [report.report_id]: e.target.value }))
                          }
                        />
                        <button className="rounded bg-coral px-2 py-1 text-white" onClick={() => addNote(report.report_id)}>
                          Save
                        </button>
                      </div>
                    </td>
                    <td className="p-2">
                      <button
                        className="rounded border border-slate-300 px-3 py-1 text-slate-700 transition hover:bg-slate-50"
                        onClick={() => openTimeline(report.report_id)}
                      >
                        View
                      </button>
                    </td>
                    <td className="p-2">
                      <button
                        className="rounded bg-red-600 px-3 py-1 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={deletingReportId === report.report_id}
                        onClick={() => requestDeleteCase(report.report_id)}
                      >
                        {deletingReportId === report.report_id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isMounted &&
        pendingDeleteReportId &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/55 p-4">
            <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-5 shadow-2xl sm:p-6">
              <h3 className="font-display text-xl font-bold text-slate-900">Delete Case #{pendingDeleteReportId}?</h3>
              <p className="mt-2 text-sm text-slate-600">
                This action is permanent. The case report and all linked notes/evidence will be removed and cannot be recovered.
              </p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={cancelDeleteCase}
                  disabled={Boolean(deletingReportId)}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={confirmDeleteCase}
                  disabled={Boolean(deletingReportId)}
                >
                  {deletingReportId ? "Deleting..." : "Delete Permanently"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {isMounted &&
        timelineReportId &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/55 p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900">
                    Case Timeline #{timelineReportId}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Chain-of-custody log for {timelineReport?.crime_type || "selected case"}.
                  </p>
                </div>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  onClick={closeTimeline}
                  disabled={timelineLoading}
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  onClick={exportTimelineCsv}
                  disabled={timelineLoading || timelineEntries.length === 0}
                >
                  Export CSV
                </button>
                <button
                  className="rounded-lg border border-slate-300 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  onClick={exportTimelinePdf}
                  disabled={timelineLoading || timelineEntries.length === 0}
                >
                  Export PDF
                </button>
              </div>

              {timelineLoading ? (
                <p className="mt-4 text-sm text-slate-600">Loading timeline...</p>
              ) : timelineError ? (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{timelineError}</p>
              ) : timelineEntries.length === 0 ? (
                <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">No timeline activity found for this case.</p>
              ) : (
                <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                  {timelineEntries.map((entry) => (
                    <article key={entry.timeline_id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">
                          {timelineActionLabel[entry.action_type] || entry.action_type}
                        </p>
                        <time className="text-xs text-slate-500">
                          {new Date(entry.created_at).toLocaleString()}
                        </time>
                      </div>
                      <p className="mt-1 text-sm text-slate-700">{timelineDescription(entry)}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Actor: {entry.actor_name || "System/Anonymous"}
                        {entry.actor_role ? ` (${entry.actor_role})` : ""}
                        {entry.ip_address ? ` | IP: ${entry.ip_address}` : ""}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
