"use client";

import Link from "next/link";

const statusBadge = {
  Submitted: "bg-blue-100 text-blue-700",
  "Under Review": "bg-amber-100 text-amber-700",
  Investigation: "bg-orange-100 text-orange-700",
  Resolved: "bg-green-100 text-green-700",
  Closed: "bg-slate-100 text-slate-600"
};

const crimeTypesMap = {
  "Phishing": "Phishing Scam",
  "Online fraud": "Online Fraud",
  "UPI scams": "UPI Scam",
  "Social media harassment": "Social Media Harassment",
  "Identity theft": "Identity Theft",
  "Cryptocurrency scams": "Cryptocurrency Scam",
  "Fake websites": "Fake Website Scam"
};

export default function AdminReportsTable({ reports = [], loading = false }) {
  return (
    <section className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Reports</h2>
          <p className="mt-1 text-sm text-slate-600">
            Quick overview of submitted reports.
          </p>
        </div>
        <Link href="/dashboard/admin/cases" className="rounded-lg bg-ocean px-4 py-2 text-sm font-semibold text-white">
          Open Full Case Assignment
        </Link>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-slate-600">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No reports available.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="p-2">ID</th>
                <th className="p-2">Citizen</th>
                <th className="p-2">Crime Type</th>
                <th className="p-2">Status</th>
                <th className="p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.report_id} className="border-t">
                  <td className="p-2 font-semibold">#{report.report_id}</td>
                  <td className="p-2">{report.victim_name || report.citizen_name || "Anonymous"}</td>
                  <td className="p-2">{crimeTypesMap[report.crime_type] || report.crime_type || "-"}</td>
                  <td className="p-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        statusBadge[report.status] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {report.status || "Submitted"}
                    </span>
                  </td>
                  <td className="p-2 text-slate-500">
                    {report.created_at ? new Date(report.created_at).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
