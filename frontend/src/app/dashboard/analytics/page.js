"use client";

import AnalyticsCharts from "../../../components/AnalyticsCharts";
import ProtectedRoute from "../../../components/ProtectedRoute";

export default function AnalyticsPage() {
  return (
    <ProtectedRoute allowRoles={["admin"]}>
      <section>
        <h1 className="font-display mb-6 text-3xl font-bold">Analytics Dashboard</h1>
        <AnalyticsCharts />
      </section>
    </ProtectedRoute>
  );
}
