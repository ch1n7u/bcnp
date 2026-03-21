"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useAuth } from "../../context/AuthContext";
import InvestigatorDashboard from "../../components/InvestigatorDashboard";

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === "admin") {
      router.replace("/dashboard/admin");
    } else if (user?.role === "citizen") {
      router.replace("/profile");
    }
  }, [router, user?.role]);

  if (user?.role === "investigator") {
    return <InvestigatorDashboard />;
  }

  return <p className="p-6 text-sm text-slate-600">Opening your dashboard...</p>;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowRoles={["citizen", "investigator", "admin"]}>
      <DashboardContent />
    </ProtectedRoute>
  );
}
