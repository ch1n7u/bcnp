"use client";

import { useState } from "react";

export default function AuditLogTable({ logs }) {
  const [page, setPage] = useState(0);
  const itemsPerPage = 10;
  const totalPages = Math.ceil((logs?.length || 0) / itemsPerPage);

  const displayedLogs = (logs || []).slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const getActionColor = (actionType) => {
    if (actionType.includes("LOGIN") || actionType.includes("REGISTER")) return "bg-green-100 text-green-800";
    if (actionType.includes("DELETE") || actionType.includes("FAILED")) return "bg-red-100 text-red-800";
    if (actionType.includes("UPDATE") || actionType.includes("ASSIGN")) return "bg-blue-100 text-blue-800";
    if (actionType.includes("LOGOUT")) return "bg-slate-100 text-slate-800";
    return "bg-purple-100 text-purple-800";
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-700">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Target</th>
              <th className="px-6 py-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No audit logs found.</td>
              </tr>
            ) : (
              displayedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionColor(log.action_type)}`}>
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {log.user_name ? (
                      <div>
                        <div className="font-medium text-slate-900">{log.user_name}</div>
                        <div className="text-xs text-slate-500">{log.user_email}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400">Anonymous / System</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.target_type ? (
                      <div>
                        <span className="font-medium">{log.target_type}</span>: {log.target_id}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {log.ip_address}
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
            className="rounded-lg px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="rounded-lg px-3 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
