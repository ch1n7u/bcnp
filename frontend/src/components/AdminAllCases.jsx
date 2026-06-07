"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import api from "../lib/api";

const statusBadge = {
  Submitted: "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Investigation: "bg-orange-100 text-orange-700",
  Resolved: "bg-emerald-100 text-emerald-700",
  Closed: "bg-slate-100 text-slate-600"
};

const statuses = ["Submitted", "Under Review", "Investigation", "Resolved", "Closed"];

const crimeTypesMap = {
  "Phishing": "Phishing Scam",
  "Online fraud": "Online Fraud",
  "UPI scams": "UPI Scam",
  "Social media harassment": "Social Media Harassment",
  "Identity theft": "Identity Theft",
  "Cryptocurrency scams": "Cryptocurrency Scam",
  "Fake websites": "Fake Website Scam"
};

function SecureImage({ src, alt, className }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let active = true;
    api.get(src, { responseType: "blob" })
      .then((res) => {
        if (active) setBlobUrl(URL.createObjectURL(res.data));
      })
      .catch((err) => console.error("Failed to fetch secure image:", err));

    return () => {
      active = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [src]);

  if (!blobUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-200 animate-pulse ${className}`}>
        <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>
    );
  }

  return <img src={blobUrl} alt={alt} className={className} />;
}

export default function AdminAllCases() {
  const [reports, setReports] = useState([]);
  const [investigators, setInvestigators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError("");
      const [repRes, invRes] = await Promise.all([
        api.get("/reports"),
        api.get("/admin/investigators")
      ]);
      setReports(repRes.data || []);
      setInvestigators(invRes.data?.investigators || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const updateStatus = async (reportId, newStatus) => {
    try {
      setUpdatingId(reportId);
      await api.patch(`/cases/${reportId}/status`, { status: newStatus });
      setReports(prev => prev.map(r => r.report_id === reportId ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const assignInvestigator = async (reportId, investigatorId) => {
    if (!investigatorId) return;
    try {
      setUpdatingId(reportId);
      await api.put("/admin/assign-investigator", { reportId, investigatorId });
      fetchCases(); // Refresh to get the new investigator name
    } catch (err) {
      alert("Failed to assign investigator.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div className="mt-8 rounded-2xl bg-white/60 p-8 text-center text-slate-500 shadow-xl backdrop-blur-md">Loading all cases...</div>;
  }

  if (error) {
    return <div className="mt-8 rounded-2xl bg-red-50 p-6 text-red-600 shadow-xl">{error}</div>;
  }

  return (
    <div className="mt-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Comprehensive Case Overview</h2>
          <p className="mt-1 text-sm text-slate-600">Review full details, evidence, and control active cases directly.</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {reports.map((report) => {
          const isExpanded = expandedId === report.report_id;
          const assignedId = report.assigned_investigator_id || "";

          return (
            <div key={report.report_id} className={`rounded-2xl border transition-all duration-300 ${isExpanded ? "border-ocean/40 bg-white shadow-2xl" : "border-slate-200 bg-white/70 hover:bg-white hover:shadow-lg"}`}>
              {/* Header - Click to expand */}
              <div 
                className="flex cursor-pointer flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
                onClick={() => setExpandedId(isExpanded ? null : report.report_id)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 font-display font-bold text-slate-600">
                    #{report.report_id}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{crimeTypesMap[report.crime_type] || report.crime_type || "Not Specified"}</h3>
                    <p className="text-sm text-slate-500">{report.victim_name || "Anonymous"} • {new Date(report.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:ml-auto">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadge[report.status] || "bg-slate-100 text-slate-600"}`}>
                    {report.status}
                  </span>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isExpanded ? "bg-ocean text-white" : "bg-slate-100 text-slate-500"}`}>
                    <svg className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {/* Left Column: Details */}
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Victim Details</h4>
                        <p className="mt-1 font-medium">{report.victim_name || "N/A"} <span className="text-slate-500 font-normal ml-2">{report.email} | {report.phone_number}</span></p>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Incident Information</h4>
                        <div className="mt-2 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                          <div className="col-span-2 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-ocean">Crime / Case Type</p>
                            <p className="mt-1 font-semibold text-slate-900 text-base">{crimeTypesMap[report.crime_type] || report.crime_type || "Not Specified"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Date/Time</p>
                            <p className="font-medium">{new Date(report.incident_datetime).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Location/Platform</p>
                            <p className="font-medium">{report.location}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-slate-500">Financial Loss</p>
                            <p className="font-medium text-coral">{report.financial_loss_amount ? `₹${report.financial_loss_amount}` : "None"}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</h4>
                        <p className="mt-1 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">{report.description}</p>
                      </div>

                      {report.suspect_details && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Suspect Details</h4>
                          <p className="mt-1 whitespace-pre-wrap rounded-xl bg-red-50 p-4 text-sm leading-relaxed text-red-900">{report.suspect_details}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Evidence & Controls */}
                    <div className="space-y-6 flex flex-col">
                      <div className="flex-1">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Attached Evidence</h4>
                        {report.evidence && report.evidence.length > 0 ? (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {report.evidence.map((ev) => (
                              <a 
                                key={ev.evidence_id}
                                href={ev.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="group block overflow-hidden rounded-xl border border-slate-200 bg-slate-50 hover:border-ocean/50 transition"
                              >
                                {ev.mime_type?.startsWith("image/") ? (
                                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                                    <SecureImage src={ev.file_url} alt="Evidence" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                  </div>
                                ) : (
                                  <div className="flex aspect-video w-full items-center justify-center bg-slate-100 text-slate-400 group-hover:bg-ocean/5 group-hover:text-ocean">
                                    <svg className="h-10 w-10 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                  </div>
                                )}
                                <div className="p-3">
                                  <p className="truncate text-xs font-medium text-slate-700">{ev.original_name}</p>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Click to view securely</p>
                                </div>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm italic text-slate-500">No evidence uploaded for this case.</p>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="rounded-2xl border-2 border-slate-100 bg-white p-5 mt-auto">
                        <h4 className="text-sm font-bold text-slate-900 mb-4">Admin Controls</h4>
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Update Status</label>
                            <select
                              className="w-full rounded-lg border-slate-300 p-2.5 text-sm focus:border-ocean focus:ring-ocean font-medium"
                              value={report.status}
                              disabled={updatingId === report.report_id}
                              onChange={(e) => updateStatus(report.report_id, e.target.value)}
                            >
                              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Assign Investigator</label>
                            <select
                              className="w-full rounded-lg border-slate-300 p-2.5 text-sm focus:border-ocean focus:ring-ocean font-medium"
                              value={assignedId}
                              disabled={updatingId === report.report_id}
                              onChange={(e) => assignInvestigator(report.report_id, e.target.value)}
                            >
                              <option value="">Unassigned</option>
                              {investigators.map(inv => (
                                <option key={inv.id} value={inv.id}>{inv.name} ({inv.currentStatus})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {reports.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white/50 p-12 text-center">
            <h3 className="text-lg font-bold text-slate-700">No Cases Found</h3>
            <p className="mt-2 text-slate-500">There are currently no cases recorded in the system.</p>
          </div>
        )}
      </div>
    </div>
  );
}
