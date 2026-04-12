"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const statuses = ["Submitted", "Under Review", "Investigation", "Resolved", "Closed"];

const statusBadge = {
  Submitted: "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Investigation: "bg-orange-100 text-orange-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-slate-100 text-slate-600"
};

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.crimeType) params.crimeType = filter.crimeType;

      const [reportsResponse, investigatorsResponse] = await Promise.all([
        api.get("/reports", { params }),
        api.get("/admin/investigators")
      ]);

      const nextReports = reportsResponse.data || [];
      const nextInvestigators = investigatorsResponse.data?.investigators || [];

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

  const investigatorNameById = useMemo(() => {
    return investigators.reduce((acc, investigator) => {
      acc[investigator.id] = investigator.name;
      return acc;
    }, {});
  }, [investigators]);

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
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.report_id} className="border-t align-top">
                    <td className="p-2 font-semibold">#{report.report_id}</td>
                    <td className="p-2">{report.citizen_name || "Anonymous"}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
