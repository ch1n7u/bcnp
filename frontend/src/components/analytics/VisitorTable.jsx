"use client";

import { useState } from "react";

export default function VisitorTable({ visitors }) {
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;
  const totalPages = Math.ceil((visitors?.length || 0) / itemsPerPage);

  const displayedVisitors = (visitors || []).slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-bold text-slate-800">Recent Visitors (IP Details)</h3>
      </div>
      <div className="overflow-auto max-h-[400px]">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4">IP Address</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Device & Browser</th>
              <th className="px-6 py-4">First Seen</th>
              <th className="px-6 py-4">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedVisitors.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No visitors found.</td>
              </tr>
            ) : (
              displayedVisitors.map((visitor) => (
                <tr key={visitor.id} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 font-mono font-medium text-slate-900">
                    {visitor.ip_address}
                  </td>
                  <td className="px-6 py-4">
                    {visitor.city || visitor.region || visitor.country ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{visitor.city || "Unknown City"}</span>
                        <span className="text-xs text-slate-500">{visitor.region}, {visitor.country}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">Unknown Location</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">{visitor.device_type || "Unknown Device"}</span>
                      <span className="text-xs text-slate-500">{visitor.browser || "Unknown Browser"} / {visitor.os || "Unknown OS"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    {new Date(visitor.first_seen).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-700">
                    {new Date(visitor.last_seen).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-3">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-lg px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="rounded-lg px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
