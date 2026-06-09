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
import { defaultStates, defaultCitiesByState } from "../lib/locations";

const PIE_COLORS = ["#0a6173", "#ff6b57", "#22c55e", "#f59e0b", "#8b5cf6", "#14b8a6", "#0f172a"];

const crimeTypes = [
  { value: "Phishing", label: "Phishing Scam" },
  { value: "Online fraud", label: "Online Fraud" },
  { value: "UPI scams", label: "UPI Scam" },
  { value: "Social media harassment", label: "Social Media Harassment" },
  { value: "Identity theft", label: "Identity Theft" },
  { value: "Cryptocurrency scams", label: "Cryptocurrency Scam" },
  { value: "Fake websites", label: "Fake Website Scam" }
];

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

  // Filter States
  const [preset, setPreset] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCrimeType, setSelectedCrimeType] = useState("");
  const [filterOptions, setFilterOptions] = useState({ states: [], crimeTypes: [] });

  // Local filters for Geographical Hotspots
  const [hotspotState, setHotspotState] = useState("");
  const [hotspotDistrict, setHotspotDistrict] = useState("");

  const getDateRangeForPreset = (rangePreset, startVal, endVal) => {
    const now = new Date();
    let start = "";
    let end = "";

    if (rangePreset === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start = today.toISOString();
    } else if (rangePreset === "7days") {
      const date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start = date.toISOString();
    } else if (rangePreset === "30days") {
      const date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = date.toISOString();
    } else if (rangePreset === "custom") {
      if (startVal) {
        start = new Date(startVal).toISOString();
      }
      if (endVal) {
        const endDateObj = new Date(endVal);
        endDateObj.setHours(23, 59, 59, 999);
        end = endDateObj.toISOString();
      }
    }
    return { start, end };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");
        
        const { start, end } = getDateRangeForPreset(preset, customStart, customEnd);
        
        const params = {};
        if (start) params.startDate = start;
        if (end) params.endDate = end;
        if (selectedState) params.state = selectedState;
        if (selectedDistrict) params.district = selectedDistrict;
        if (selectedCrimeType) params.crimeType = selectedCrimeType;

        const res = await api.get("/analytics/dashboard", { params });
        setData(res.data);
        
        if (res.data.filterOptions) {
          setFilterOptions(res.data.filterOptions);
        }
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
  }, [preset, customStart, customEnd, selectedState, selectedDistrict, selectedCrimeType]);

  const exportToCSV = () => {
    if (!data) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Summary Metrics
    csvContent += "METRIC,VALUE\n";
    csvContent += `Total Reports,${data.metrics?.totalReports || 0}\n`;
    csvContent += `Total Loss (INR),${data.metrics?.totalLoss || 0}\n`;
    csvContent += `Resolved Reports,${data.metrics?.resolvedReports || 0}\n`;
    csvContent += `Active Investigations,${data.metrics?.activeInvestigations || 0}\n`;
    csvContent += `Average Turnaround Time (Hours),${data.metrics?.averageResolutionHours || 0}\n\n`;

    // Crime Breakdown
    csvContent += "CRIME CATEGORY,CASES\n";
    (data.crimeDistribution || []).forEach(row => {
      csvContent += `"${row.label.replace(/"/g, '""')}",${row.value}\n`;
    });
    csvContent += "\n";

    // State Breakdown
    csvContent += "STATE/UT,CASES\n";
    (data.reportsPerState || []).forEach(row => {
      csvContent += `"${row.label.replace(/"/g, '""')}",${row.value}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cybercrime_analytics_${preset}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) {
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

  const totalLoss = new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR", 
    maximumFractionDigits: 0 
  }).format(data.metrics?.totalLoss || 0);

  const resolutionRate = data.metrics?.totalReports > 0
    ? ((data.metrics.resolvedReports / data.metrics.totalReports) * 100).toFixed(1)
    : "0.0";

  // Filter hotspot data based on local selection
  let hotspotData = data.reportsPerState || [];
  if (hotspotState) {
    hotspotData = hotspotData.filter((item) => item.label.includes(hotspotState));
  }
  if (hotspotDistrict) {
    hotspotData = hotspotData.filter((item) => item.label.includes(hotspotDistrict));
  }
  hotspotData = hotspotData.slice(0, 8);

  return (
    <section className="space-y-8 animate-in fade-in duration-700 print:space-y-4 print:text-black">
      {/* Interactive Filter Panel (hidden during Print/PDF) */}
      <div className="glass rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl transition-all duration-300 print:hidden">
        <h3 className="mb-4 font-display text-sm font-bold tracking-wider text-slate-700 uppercase">
          Analytics Controls & Filters
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Preset Select */}
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold text-slate-600">Date Preset</label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* State Select */}
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold text-slate-600">State / UT</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setSelectedDistrict("");
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean"
            >
              <option value="">All States</option>
              {defaultStates.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* District Select */}
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold text-slate-600">District / City</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              disabled={!selectedState}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean disabled:opacity-50 disabled:bg-slate-50"
            >
              <option value="">All Districts</option>
              {selectedState && defaultCitiesByState[selectedState]?.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </select>
          </div>

          {/* Scam Type Select */}
          <div className="flex flex-col">
            <label className="mb-1 text-xs font-semibold text-slate-600">Scam Type</label>
            <select
              value={selectedCrimeType}
              onChange={(e) => setSelectedCrimeType(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean"
            >
              <option value="">All Scam Types</option>
              {crimeTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons: Export & Print */}
          <div className="flex items-end gap-2">
            <button
              onClick={exportToCSV}
              disabled={loading}
              className="flex-1 rounded-xl bg-[#0f172a] px-3 py-2 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:opacity-50"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Print / PDF
            </button>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {preset === "custom" && (
          <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-semibold text-slate-600">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-1 text-xs font-semibold text-slate-600">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean"
              />
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay when data is refreshing */}
      <div className={`relative ${loading ? "opacity-60" : ""}`}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/20 backdrop-blur-xs print:hidden">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-ocean border-r-transparent"></div>
          </div>
        )}

        <div className="space-y-8 print:space-y-4">
          {/* Metrics Row */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 print:grid-cols-5 print:gap-2">
            {/* Card 1: Loss */}
            <div className="group relative overflow-hidden rounded-2xl border border-red-100 bg-gradient-to-br from-red-500/10 to-transparent p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md print:border-none print:p-2 print:bg-none">
              <p className="text-xs font-bold tracking-wider text-red-700 uppercase print:text-black">Total Loss</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-red-900 print:text-black">{totalLoss}</p>
            </div>

            {/* Card 2: Total Reports */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-500/10 to-transparent p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md print:border-none print:p-2 print:bg-none">
              <p className="text-xs font-bold tracking-wider text-slate-700 uppercase print:text-black">Total Reports</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-slate-900 print:text-black">{data.metrics?.totalReports || 0}</p>
            </div>

            {/* Card 3: Resolution Rate */}
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md print:border-none print:p-2 print:bg-none">
              <p className="text-xs font-bold tracking-wider text-emerald-700 uppercase print:text-black">Resolution Rate</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-emerald-900 print:text-black">{resolutionRate}%</p>
            </div>

            {/* Card 4: Active Investigations */}
            <div className="group relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-500/10 to-transparent p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md print:border-none print:p-2 print:bg-none">
              <p className="text-xs font-bold tracking-wider text-amber-700 uppercase print:text-black">Active Cases</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-amber-900 print:text-black">{data.metrics?.activeInvestigations || 0}</p>
            </div>

            {/* Card 5: Avg TAT */}
            <div className="group relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-500/10 to-transparent p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md print:border-none print:p-2 print:bg-none">
              <p className="text-xs font-bold tracking-wider text-teal-700 uppercase print:text-black">Avg Resolution</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-teal-900 print:text-black">
                {data.metrics?.averageResolutionHours > 0 
                  ? `${data.metrics.averageResolutionHours} hrs` 
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-1">
            {/* Monthly Trend - Area Chart */}
            <div className="col-span-1 lg:col-span-2 rounded-2xl border border-white/60 bg-white/40 p-6 shadow-md backdrop-blur-xl transition-all duration-500 hover:shadow-lg print:border-none print:shadow-none">
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
            <div className="group rounded-2xl border border-white/60 bg-white/40 p-6 shadow-md backdrop-blur-xl transition-all duration-500 hover:shadow-lg print:border-none print:shadow-none">
              <h2 className="mb-6 font-display text-xl font-bold text-ink">Crime Distribution</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.crimeDistribution} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" opacity={0.5} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fill: "#334155", fontSize: 13, fontWeight: 500 }} width={130} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9", opacity: 0.5 }} />
                    <Bar dataKey="value" name="Cases" fill="#ff6b57" radius={[0, 6, 6, 0]} animationDuration={1800} barSize={20}>
                      {data.crimeDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} className="transition-all duration-300 hover:brightness-110" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Breakdown - Donut Chart */}
            <div className="group rounded-2xl border border-white/60 bg-white/40 p-6 shadow-md backdrop-blur-xl transition-all duration-500 hover:shadow-lg flex flex-col print:border-none print:shadow-none">
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

            {/* Geographical Hotspots - Horizontal Bar Chart (Fixed label overlap) */}
            <div className="col-span-1 lg:col-span-2 rounded-2xl border border-white/60 bg-white/40 p-6 shadow-md backdrop-blur-xl transition-all duration-500 hover:shadow-lg print:border-none print:shadow-none">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="font-display text-xl font-bold text-ink">Geographical Hotspots</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={hotspotState}
                    onChange={(e) => {
                      setHotspotState(e.target.value);
                      setHotspotDistrict("");
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean"
                  >
                    <option value="">All States</option>
                    {defaultStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <select
                    value={hotspotDistrict}
                    onChange={(e) => setHotspotDistrict(e.target.value)}
                    disabled={!hotspotState}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-ocean focus:outline-none focus:ring-1 focus:ring-ocean disabled:opacity-50 disabled:bg-slate-50"
                  >
                    <option value="">All Districts</option>
                    {hotspotState && defaultCitiesByState[hotspotState]?.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hotspotData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorState" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#cbd5e1" opacity={0.5} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fill: "#334155", fontSize: 13, fontWeight: 500 }} width={120} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9", opacity: 0.5 }} />
                    <Bar dataKey="value" name="Reports" fill="url(#colorState)" radius={[0, 6, 6, 0]} animationDuration={1800} barSize={20}>
                       {hotspotData.map((entry, index) => (
                        <Cell key={`cellState-${index}`} className="transition-all duration-300 hover:brightness-110 cursor-pointer" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Reports Data Grid */}
          <div className="rounded-2xl border border-white/60 bg-white/40 p-6 shadow-md backdrop-blur-xl print:border-none print:shadow-none">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-ink">Recent Cyber Crime Reports</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 print:hidden">
                Showing top 5 matching filters
              </span>
            </div>
            
            {data.recentReports?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="pb-3 pl-4">ID</th>
                      <th className="pb-3">Victim Name</th>
                      <th className="pb-3">Crime Type</th>
                      <th className="pb-3">Financial Loss</th>
                      <th className="pb-3">Location</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {data.recentReports.map((report) => (
                      <tr key={report.report_id} className="group hover:bg-white/10 transition-colors">
                        <td className="py-3.5 pl-4 font-semibold text-slate-900">#{report.report_id}</td>
                        <td className="py-3.5 text-slate-700">{report.victim_name}</td>
                        <td className="py-3.5 font-medium text-slate-900 max-w-[200px] truncate" title={report.crime_type}>
                          {report.crime_type}
                        </td>
                        <td className="py-3.5 text-red-600 font-bold">
                          {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(report.financial_loss_amount || 0)}
                        </td>
                        <td className="py-3.5 text-slate-600">{report.location}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            report.status === "Resolved" || report.status === "Closed"
                              ? "bg-emerald-100 text-emerald-800"
                              : report.status === "Investigation"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-slate-500">
                          {new Date(report.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm font-medium text-slate-500">
                No reports found matching the selected filters.
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
