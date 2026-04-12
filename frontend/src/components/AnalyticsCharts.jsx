"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import api from "../lib/api";

const colors = ["#0a6173", "#ff6b57", "#0f172a", "#22c55e", "#f59e0b", "#14b8a6", "#8b5cf6"];

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
    return <p>Loading analytics...</p>;
  }

  if (error) {
    return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  }

  if (!data) {
    return <p>No analytics data available yet.</p>;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-slate-500">Total Financial Loss</p>
          <p className="mt-2 font-display text-3xl font-bold">Rs {data.financialFraudStats.total_loss}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-slate-500">Reported States</p>
          <p className="mt-2 font-display text-3xl font-bold">{data.reportsPerState.length}</p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-sm text-slate-500">Crime Categories</p>
          <p className="mt-2 font-display text-3xl font-bold">{data.crimeDistribution.length}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-xl p-4">
          <h2 className="font-display mb-4 text-xl font-bold">Crime Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.crimeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0a6173" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <h2 className="font-display mb-4 text-xl font-bold">Status Breakdown</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.statusBreakdown} dataKey="value" nameKey="label" outerRadius={110} label>
                  {data.statusBreakdown.map((entry, index) => (
                    <Cell key={entry.label} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-xl p-4 md:col-span-2">
          <h2 className="font-display mb-4 text-xl font-bold">Monthly Crime Trends</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="reports" stroke="#ff6b57" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
