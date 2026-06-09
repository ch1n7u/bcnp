"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "../../../../lib/api";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import VisitorMap from "../../../../components/analytics/VisitorMap";
import AuditLogTable from "../../../../components/analytics/AuditLogTable";
import PageMetrics from "../../../../components/analytics/PageMetrics";
import VisitorTable from "../../../../components/analytics/VisitorTable";

export default function AnalyticsDashboardPage() {
  const [data, setData] = useState({
    visitors: [],
    totalVisitors: 0,
    pages: [],
    topPages: [],
    auditLogs: [],
    securityThreats: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const [visitorsRes, pagesRes, logsRes, dashboardRes] = await Promise.all([
          api.get("/analytics/visitors"),
          api.get("/analytics/pages"),
          api.get("/analytics/audit-logs"),
          api.get("/analytics/dashboard") // for security threats
        ]);

        setData({
          visitors: visitorsRes.data.visitors,
          totalVisitors: visitorsRes.data.total,
          pages: pagesRes.data.recent,
          topPages: pagesRes.data.topPages,
          auditLogs: logsRes.data,
          securityThreats: dashboardRes.data.securityThreats
        });
      } catch (err) {
        console.error("Failed to load analytics", err);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <ProtectedRoute allowRoles={["admin"]}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-ocean"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowRoles={["admin"]}>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowRoles={["admin"]}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">Analytics & Security</h1>
          <p className="mt-1 text-sm text-slate-600">Monitor platform usage, visitor locations, and security logs.</p>
        </div>
        <Link 
          href="/dashboard/admin" 
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
        >
          Back to Admin
        </Link>
      </div>

      {data.securityThreats?.flaggedVisitorsCount > 0 && (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm sm:p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-red-800">Security Alert</h3>
              <p className="mt-1 text-sm text-red-700">
                {data.securityThreats.message} ({data.securityThreats.flaggedVisitorsCount} IPs flagged).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Total Visitors</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{data.totalVisitors.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Recent Audit Logs</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{data.auditLogs.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Total Page Visits</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{data.pages.length}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Active Unique IPs (Last 100)</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {new Set(data.visitors.map(v => v.ip_address)).size}
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Visitor Locations</h2>
          <VisitorMap visitors={data.visitors} />
        </div>
        <div>
          <PageMetrics topPages={data.topPages} />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-bold text-slate-900">Visitor IP Tracking</h2>
        <VisitorTable visitors={data.visitors} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Security & Audit Logs</h2>
        </div>
        <AuditLogTable logs={data.auditLogs} />
      </div>

    </ProtectedRoute>
  );
}
