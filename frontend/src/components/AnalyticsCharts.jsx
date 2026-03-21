"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from "recharts";
import api from "../lib/api";

const PIE_COLORS = ["#0a6173", "#ff6b57", "#22c55e", "#f59e0b", "#8b5cf6", "#14b8a6", "#0f172a"];

// Custom Tooltip for premium look
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/40 bg-white/90 p-4 shadow-xl backdrop-blur-md">
        <p className="mb-2 font-display text-sm font-bold text-ink">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color || entry.fill }}>
            {entry.name}: {new Intl.NumberFormat("en-IN").format(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsCharts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/analytics/dashboard");
        setData(res.data);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Unable to load analytics. Please log in as an admin or investigator, and ensure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-ocean border-r-transparent drop-shadow-md"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 shadow-sm backdrop-blur-sm text-center">
        <p className="text-lg font-semibold text-red-700">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const totalLoss = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    data.financialFraudStats?.total_loss || 0
  );

  return (
    <section className="space-y-8 animate-in fade-in duration-700">
      {/* Top Metrics Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-ocean/10 to-transparent p-6 shadow-sm backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-ocean/20 blur-3xl transition-transform duration-700 group-hover:scale-150"></div>
          <p className="text-sm font-semibold tracking-wider text-ocean/80 uppercase">Total Financial Loss</p>
          <p className="mt-2 font-display text-4xl font-extrabold text-ink drop-shadow-sm">{totalLoss}</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-coral/10 to-transparent p-6 shadow-sm backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-coral/20 blur-3xl transition-transform duration-700 group-hover:scale-150"></div>
          <p className="text-sm font-semibold tracking-wider text-coral/80 uppercase">Affected Regions</p>
          <p className="mt-2 font-display text-4xl font-extrabold text-ink drop-shadow-sm">{data.reportsPerState?.length || 0}</p>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-emerald-500/10 to-transparent p-6 shadow-sm backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg sm:col-span-2 lg:col-span-1">
          <div className="absolute -right-4 -top-4 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl transition-transform duration-700 group-hover:scale-150"></div>
          <p className="text-sm font-semibold tracking-wider text-emerald-600/80 uppercase">Crime Categories</p>
          <p className="mt-2 font-display text-4xl font-extrabold text-ink drop-shadow-sm">{data.crimeDistribution?.length || 0}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend - Area Chart */}
        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-white/60 bg-white/40 p-6 shadow-md backdrop-blur-xl transition-all duration-500 hover:shadow-lg">
          <h2 className="mb-6 font-display text-xl font-bold text-ink">Monthly Crime Trends</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a6173" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0a6173" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.5} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13 }} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="reports" stroke="#0a6173" strokeWidth={4} fillOpacity={1} fill="url(#colorReports)" animationDuration={1800} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crime Distribution - Horizontal Bar Chart */}
        <div className="group rounded-2xl border border-white/60 bg-white/40 p-6 shadow-md backdrop-blur-xl transition-all duration-500 hover:shadow-lg">
          <h2 className="mb-6 font-display text-xl font-bold text-ink">Crime Distribution</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.crimeDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" opacity={0.5} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fill: "#334155", fontSize: 13, fontWeight: 500 }} width={130} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9", opacity: 0.5 }} />
                <Bar dataKey="value" name="Cases" fill="#ff6b57" radius={[0, 6, 6, 0]} animationDuration={1800} barSize={24}>
                  {data.crimeDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} className="transition-all duration-300 hover:brightness-110" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown - Donut Chart */}
        <div className="group rounded-2xl border border-white/60 bg-white/40 p-6 shadow-md backdrop-blur-xl transition-all duration-500 hover:shadow-lg flex flex-col">
          <h2 className="mb-2 font-display text-xl font-bold text-ink">Status Breakdown</h2>
          <div className="h-80 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={90}
                  outerRadius={130}
                  paddingAngle={4}
                  animationDuration={1800}
                >
                  {data.statusBreakdown?.map((entry, index) => (
                    <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} className="drop-shadow-sm transition-all duration-300 hover:opacity-80 hover:-translate-y-1 outline-none cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "14px", fontWeight: "500", color: "#334155" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top States Bar Chart */}
        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-white/60 bg-white/40 p-6 shadow-md backdrop-blur-xl transition-all duration-500 hover:shadow-lg">
          <h2 className="mb-6 font-display text-xl font-bold text-ink">Geographical Hotspots</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.reportsPerState?.slice(0, 10) || []} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorState" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.5} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#334155", fontSize: 13, fontWeight: 500 }} angle={-20} textAnchor="end" height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 13 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9", opacity: 0.5 }} />
                <Bar dataKey="value" name="Reports" fill="url(#colorState)" radius={[8, 8, 0, 0]} animationDuration={1800} barSize={40}>
                   {data.reportsPerState?.slice(0, 10).map((entry, index) => (
                    <Cell key={`cellState-${index}`} className="transition-all duration-300 hover:brightness-110 cursor-pointer" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </section>
  );
}
