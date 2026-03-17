"use client";

import { useState } from "react";
import api from "../lib/api";

export default function CaseTracker() {
  const [reportId, setReportId] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const search = async () => {
    setError("");
    setData(null);
    if (!reportId) return;

    try {
      const res = await api.get(`/reports/${reportId}`);
      const evidence = await api.get(`/evidence/${reportId}`);
      const notes = await api.get(`/cases/${reportId}/notes`);
      setData({ ...res.data, evidence: evidence.data, notes: notes.data });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to fetch the case.");
    }
  };

  return (
    <section className="glass rounded-2xl p-5 sm:p-6">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Track Your Case</h1>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          className="w-full rounded-lg border p-3 sm:flex-1"
          placeholder="Enter Report ID"
          value={reportId}
          onChange={(e) => setReportId(e.target.value)}
        />
        <button onClick={search} className="w-full rounded-lg bg-ocean px-5 py-3 text-white sm:w-auto">
          Check Status
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {data && (
        <div className="mt-6 space-y-4 text-sm">
          <div className="rounded-xl bg-white p-4">
            <p><strong>Status:</strong> {data.status}</p>
            <p><strong>Crime Type:</strong> {data.crime_type}</p>
            <p><strong>Location:</strong> {data.location}</p>
            <p><strong>Assigned Investigator:</strong> {data.investigator_name || "Pending"}</p>
          </div>
          <div className="rounded-xl bg-white p-4">
            <h3 className="font-semibold">Evidence</h3>
            <ul className="mt-2 space-y-1">
              {data.evidence.map((item) => (
                <li key={item.evidence_id} className="break-all">
                  <a className="text-ocean underline" href={item.file_url} target="_blank">
                    {item.original_name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white p-4">
            <h3 className="font-semibold">Case Notes</h3>
            <ul className="mt-2 space-y-2">
              {data.notes.map((note) => (
                <li key={note.note_id}>
                  <strong>{note.investigator_name}:</strong> {note.note_text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
